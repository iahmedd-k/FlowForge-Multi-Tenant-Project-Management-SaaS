import toast from 'react-hot-toast';
import { addNotification } from './useNotificationStore';

// For use outside React components
export const notifyUser = (message, type = 'success') => {
  if (type === 'success') {
    toast.success(message);
  } else if (type === 'error') {
    toast.error(message);
  } else {
    toast(message);
  }
  addNotification(message, type);
};

// For use within components as a hook
export const useNotify = () => {
  return {
    success: (message) => {
      toast.success(message);
      addNotification(message, 'success');
    },
    error: (message) => {
      toast.error(message);
      addNotification(message, 'error');
    },
    info: (message) => {
      toast(message);
      addNotification(message, 'info');
    },
  };
};

