import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { Notification } from '../types';
import { listenToNotificationsByUser, markNotificationRead } from '../services/notifications';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);
  const seenIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      initializedRef.current = false;
      seenIdsRef.current.clear();
      return () => undefined;
    }

    setLoading(true);
    const unsubscribe = listenToNotificationsByUser(currentUser.uid, (list) => {
      setNotifications(list);
      setLoading(false);

      list.forEach((notification) => {
        if (!seenIdsRef.current.has(notification.id)) {
          if (initializedRef.current && !notification.read) {
            toast(notification.title, {
              duration: 4000,
            });
          }
          seenIdsRef.current.add(notification.id);
        }
      });

      if (!initializedRef.current) {
        initializedRef.current = true;
      }
    });

    return () => {
      unsubscribe();
      setNotifications([]);
      setLoading(false);
      initializedRef.current = false;
      seenIdsRef.current.clear();
    };
  }, [currentUser]);

  const markAsRead = async (notificationId: string) => {
    await markNotificationRead(notificationId);
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((notification) => !notification.read);
    await Promise.all(unread.map((notification) => markNotificationRead(notification.id)));
  };

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      loading,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      markAsRead,
      markAllAsRead,
    }),
    [loading, notifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
