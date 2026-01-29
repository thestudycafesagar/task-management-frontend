import { io } from 'socket.io-client';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export const initializeSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  // Use NEXT_PUBLIC_SOCKET_URL or fallback to API_URL without /api suffix
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                    process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 
                    'http://localhost:5000';

  console.log('🔌 Initializing socket connection to:', socketUrl);

  socket = io(socketUrl, {
    auth: {
      token
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    timeout: 20000,
    autoConnect: true
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
    
    if (reason === 'io server disconnect') {
      // Server disconnected, try to reconnect
      console.log('🔄 Attempting to reconnect...');
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    reconnectAttempts++;
    console.error(`❌ Socket connection error (attempt ${reconnectAttempts}):`, error.message);
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnection attempts reached. Socket disabled.');
    }
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
    reconnectAttempts = 0;
  });

  socket.on('reconnect_failed', () => {
    console.error('❌ Socket reconnection failed');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

export const getSocket = () => socket;

export default { initializeSocket, disconnectSocket, getSocket };
