import { Bell, X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead, clearNotifications as clearNotificationsApi, deleteNotification } from '../../../api/notifications.api';
import { useNotificationStore } from '../../../hooks/useNotificationStore';

export default function NotificationsMenu({ variant = 'button' }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { notifications: localNotifications } = useNotificationStore();

  // Fetch notifications from database
  const { data: dbNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications().then((res) => res.data.data.notifications || []),
    refetchInterval: open ? 3000 : 30000, // Refetch every 3s when open, 30s when closed
    staleTime: 2000,
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Clear all notifications mutation
  const clearMutation = useMutation({
    mutationFn: () => clearNotificationsApi(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Combine local (toast) and database notifications
  const allNotifications = [
    ...localNotifications,
    ...dbNotifications.filter(
      (dbNotif) => !localNotifications.some(
        (localNotif) => localNotif.message === dbNotif.message && 
        Math.abs(localNotif.timestamp - new Date(dbNotif.createdAt)) < 1000
      )
    ),
  ].slice(0, 20); // Keep max 20

  const unreadCount = dbNotifications.filter((n) => !n.isRead).length + localNotifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className={
          variant === 'icon'
            ? 'relative flex h-9 w-9 items-center justify-center rounded-full text-[#1f2a44] transition hover:bg-[#eef2fb] hover:text-[#0f72f0]'
            : 'relative rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50'
        }
        aria-label="Notifications"
        title={unreadCount > 0 ? `${unreadCount} recent notification${unreadCount !== 1 ? 's' : ''}` : 'No notifications'}
      >
        {variant === 'icon' ? <Bell size={19} strokeWidth={1.9} /> : 'Notifications'}
        {unreadCount > 0 && (
          <span className={`absolute flex h-5 w-5 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white ${variant === 'icon' ? '-right-1 -top-1' : '-top-2 -right-2'}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
          />
          <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-96 max-w-[calc(100vw-16px)] rounded-[14px] border border-[#e0e7f1] bg-white shadow-[0_18px_46px_rgba(15,23,42,0.16)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#eff2f7] px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-[#1f2a44]">Notifications</p>
                <p className="text-[11px] text-[#7a84a4]">{allNotifications.length} activity item{allNotifications.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[#7a84a4] transition hover:text-[#1f2a44]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[12px] text-[#7a84a4]">Loading...</p>
                </div>
              ) : !allNotifications.length ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[12px] text-[#7a84a4]">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f0f3fa]">
                  {allNotifications.map((notification) => {
                    const isUnread = notification.isRead === false;
                    const notificationType = notification.type || 'info';
                    const timestamp = notification.timestamp || new Date(notification.createdAt);
                    
                    return (
                      <div
                        key={notification.id || notification.message + notification.timestamp}
                        className={`px-4 py-3 transition hover:bg-[#f8fbff] cursor-pointer ${
                          notificationType === 'error' ? 'bg-red-50 hover:bg-red-100' : 
                          notificationType === 'success' ? 'bg-green-50 hover:bg-green-100' : 
                          notificationType === 'warning' ? 'bg-yellow-50 hover:bg-yellow-100' :
                          'bg-white'
                        } ${isUnread ? 'border-l-4 border-[#0f72f0]' : ''}`}
                        onClick={() => {
                          if (notification.id && !notification.isRead) {
                            markReadMutation.mutate(notification.id);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                              notificationType === 'error' ? 'bg-[#ef4444]' : 
                              notificationType === 'success' ? 'bg-[#10b981]' : 
                              notificationType === 'warning' ? 'bg-[#f59e0b]' :
                              'bg-[#0f72f0]'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] text-[#1f2a44] font-medium leading-snug">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-[11px] text-[#7a84a4]">
                              {timestamp instanceof Date 
                                ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              }
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (notification.id) {
                                deleteMutation.mutate(notification.id);
                              }
                            }}
                            className="mt-0.5 text-[#b0b8c8] transition hover:text-[#ef4444]"
                            title="Remove notification"
                            disabled={deleteMutation.isPending}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {allNotifications.length > 0 ? (
              <div className="border-t border-[#eff2f7] px-4 py-2.5">
                <button
                  onClick={() => clearMutation.mutate()}
                  disabled={clearMutation.isPending}
                  className="w-full rounded-[6px] bg-[#f0f3fa] px-2.5 py-1.5 text-[11px] font-medium text-[#1f2a44] transition hover:bg-[#e6ebf5] disabled:opacity-50"
                >
                  Clear all
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
