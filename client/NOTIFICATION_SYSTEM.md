# Notification System Usage Guide

## Overview
The app now uses a **unified notification system** that:
- Shows professional **toast notifications** (top-right)
- Displays recent activity in the **bell icon dropdown** (in-memory, temporary)
- Automatically tracks all notifications without backend

## How to Use

### Option 1: Using `useNotify` Hook (Recommended)
Best for React components that need to show notifications.

```jsx
import { useNotify } from '@/hooks/useNotify';

export default function MyComponent() {
  const notify = useNotify();

  const handleAction = () => {
    try {
      // Do something
      notify.success('Action completed successfully!');
    } catch (error) {
      notify.error('Something went wrong');
    }
  };

  return <button onClick={handleAction}>Perform Action</button>;
}
```

### Option 2: Using `notifyUser` Function (Outside Components)
For standalone use outside React components:

```jsx
import { notifyUser } from '@/hooks/useNotify';

// Anywhere in your code
notifyUser('Profile updated!', 'success');
notifyUser('Error loading data', 'error');
notifyUser('Loading...', 'info');
```

### Option 3: Direct Toast Usage (Legacy)
Traditional approach - still works, but won't appear in bell dropdown:

```jsx
import toast from 'react-hot-toast';

toast.success('Operation completed');
toast.error('Failed to save');
```

## Available Methods

```jsx
// Success notification (green)
notify.success('Task saved successfully!');

// Error notification (red)
notify.error('Failed to update task');

// Info notification (blue)
notify.info('Process started');
```

## Notification Storage Behavior
- **Max stored**: 10 most recent notifications
- **Display duration**: Auto-removes after 5 seconds in history
- **Toast timeout**: 3-4 seconds (configurable in App.tsx)
- **Bell badge**: Shows count of recent notifications

## Migration Guide
To migrate existing toast calls:

### Before
```jsx
import toast from 'react-hot-toast';

toast.success('Task saved!');
```

### After  
```jsx
import { useNotify } from '@/hooks/useNotify';

const notify = useNotify();
notify.success('Task saved!');
```

This change:
- ✅ Shows the same toast (top-right)
- ✅ Adds to bell icon notification history
- ✅ Automatically removes after 5 seconds in history

## Files Using New System
- `TaskDetailPanel.jsx` - Updated to useNotify
- `NotificationsMenu.jsx` - Shows temporary notifications from bell icon
- `useNotificationStore.js` - Core notification storage engine
- `useNotify.js` - Hook and helper functions

## Styling
Toast notifications are styled in `App.tsx`:
- Background: Dark (`#1f2a44`)
- Success: Green (`#10b981`)
- Error: Red (`#ef4444`)
- Text: White
- Border radius: 8px
- Position: Top-right
