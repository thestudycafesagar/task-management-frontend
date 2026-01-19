import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  // Set notifications from API
  setNotifications: (notifications, unreadCount) => {
    set({ notifications, unreadCount });
  },

  // Add new notification (from Socket.IO)
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1
    }));
  },

  // Mark notification as read
  markAsRead: (notificationId) => {
    set((state) => {
      const notification = state.notifications.find(n => n._id === notificationId);
      if (!notification || notification.isRead) return state;

      return {
        notifications: state.notifications.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    });
  },

  // Mark all as read
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0
    }));
  },

  // Clear notifications
  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  }
}));

export default useNotificationStore;
