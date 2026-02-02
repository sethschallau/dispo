/**
 * useNotifications Hook
 *
 * State management for user notifications with real-time updates.
 */

import { Notification, notificationsService } from '@/services/notifications';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = notificationsService.subscribeToNotifications(
      userId,
      (notifs) => {
        setNotifications(notifs);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      await notificationsService.markAsRead(userId, notificationId);
    },
    [userId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id!);
    if (unreadIds.length > 0) {
      await notificationsService.markAllAsRead(userId, unreadIds);
    }
  }, [userId, notifications]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      await notificationsService.deleteNotification(userId, notificationId);
    },
    [userId]
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
