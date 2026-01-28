import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  // Use NEXT_PUBLIC_SOCKET_URL or fallback to API_URL without /api suffix
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                    process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 
                    'http://localhost:5000';

  socket = io(socketUrl, {
    auth: {
      token
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    // Socket connected successfully
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      // Server disconnected, try to reconnect
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export default { initializeSocket, disconnectSocket, getSocket };
