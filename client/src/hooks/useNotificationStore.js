import { useEffect, useState } from 'react';

// Global notification storage
let notificationState = [];
let listeners = [];

const subscribe = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

const getNotifications = () => notificationState;

const addNotification = (message, type = 'info') => {
  const id = Date.now();
  const notification = {
    id,
    message,
    type,
    timestamp: new Date(),
  };

  notificationState = [notification, ...notificationState].slice(0, 10); // Keep last 10
  listeners.forEach((listener) => listener());

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notificationState = notificationState.filter((n) => n.id !== id);
    listeners.forEach((listener) => listener());
  }, 5000);

  return id;
};

const removeNotification = (id) => {
  notificationState = notificationState.filter((n) => n.id !== id);
  listeners.forEach((listener) => listener());
};

const clearNotifications = () => {
  notificationState = [];
  listeners.forEach((listener) => listener());
};

export const useNotificationStore = () => {
  const [notifications, setNotifications] = useState(notificationState);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setNotifications([...notificationState]);
    });
    return unsubscribe;
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };
};

// Export functions for use outside of React components
export { addNotification, removeNotification, clearNotifications };

