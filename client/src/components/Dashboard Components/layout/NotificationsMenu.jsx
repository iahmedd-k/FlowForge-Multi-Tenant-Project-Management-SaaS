import { Bell, X, Check, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearNotifications,
} from '../../../api/notifications.api';
import Spinner from '../ui/Spinner';

export default function NotificationsMenu({ variant = 'button' }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ limit: 10 }).then((res) => res.data.data),
    staleTime: 3_000,
    refetchInterval: 5_000,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const { mutate: readOne } = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: refresh,
  });

  const { mutate: readAll, isPending: readingAll } = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      refresh();
    },
  });

  const { mutate: removeOne } = useMutation({
    mutationFn: deleteNotification,
    onSuccess: refresh,
  });

  const { mutate: clearRead, isPending: clearing } = useMutation({
    mutationFn: clearNotifications,
    onSuccess: () => {
      refresh();
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

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
        title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'No unread notifications'}
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
          <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-80 max-w-[calc(100vw-16px)] rounded-[14px] border border-[#e0e7f1] bg-white shadow-[0_18px_46px_rgba(15,23,42,0.16)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#eff2f7] px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-[#1f2a44]">Notifications</p>
                <p className="text-[11px] text-[#7a84a4]">{unreadCount} unread</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[#7a84a4] transition hover:text-[#1f2a44]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner />
                </div>
              ) : !notifications.length ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[12px] text-[#7a84a4]">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f0f3fa]">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`px-4 py-3 transition hover:bg-[#f8fbff] ${
                        !notification.read ? 'bg-[#f8fbff]' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                            !notification.read ? 'bg-[#0f72f0]' : 'bg-transparent'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] text-[#1f2a44] font-medium leading-snug">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-[11px] text-[#7a84a4] capitalize">
                            {notification.type.replaceAll('_', ' ')}
                          </p>
                        </div>
                        <button
                          onClick={() => removeOne(notification._id)}
                          className="mt-0.5 text-[#b0b8c8] transition hover:text-[#ef4444]"
                          title="Remove notification"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 ? (
              <div className="flex items-center gap-2 border-t border-[#eff2f7] px-4 py-2.5">
                <button
                  onClick={() => readAll()}
                  disabled={!unreadCount || readingAll}
                  className="flex-1 rounded-[6px] bg-[#f0f3fa] px-2.5 py-1.5 text-[11px] font-medium text-[#1f2a44] transition hover:bg-[#e6ebf5] disabled:opacity-50"
                >
                  Mark all read
                </button>
                <button
                  onClick={() => clearRead()}
                  disabled={!notifications.length || clearing}
                  className="flex-1 rounded-[6px] bg-[#f0f3fa] px-2.5 py-1.5 text-[11px] font-medium text-[#1f2a44] transition hover:bg-[#e6ebf5] disabled:opacity-50"
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
