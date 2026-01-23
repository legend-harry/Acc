/**
 * Hook for managing push notifications in React components
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { notificationService, NotificationPayload, PushSubscription } from '@/lib/notifications';
import { useUser } from '@/context/user-context';

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  isPermitted: boolean;
  isSubscribed: boolean;
  sendNotification: (payload: NotificationPayload) => Promise<void>;
  sendAlert: (title: string, body: string, data?: Record<string, any>) => Promise<void>;
  sendSuccess: (title: string, body: string, data?: Record<string, any>) => Promise<void>;
  sendInfo: (title: string, body: string, data?: Record<string, any>) => Promise<void>;
  sendReminder: (title: string, body: string, delayMs?: number) => Promise<void>;
  subscribeToPush: (vapidKey: string) => Promise<PushSubscription | null>;
  unsubscribeFromPush: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isPermitted, setIsPermitted] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { selectedProfile } = useUser();

  // Initialize notification service
  useEffect(() => {
    const initializeNotifications = async () => {
      const supported = typeof window !== 'undefined' && 'Notification' in window;
      setIsSupported(supported);

      if (supported) {
        setIsPermitted(notificationService.canNotify());
      }
    };

    initializeNotifications();
  }, []);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      const subscription = await notificationService.getPushSubscription();
      setIsSubscribed(!!subscription);
    };

    if (isPermitted) {
      checkSubscription();
    }
  }, [isPermitted]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const result = await notificationService.initialize();
    setIsPermitted(result);
    return result;
  }, []);

  const sendNotification = useCallback(async (payload: NotificationPayload) => {
    if (!isPermitted) {
      console.warn('Notifications not permitted');
      return;
    }
    await notificationService.sendNotification(payload);
  }, [isPermitted]);

  const sendAlert = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    if (!isPermitted) return;
    await notificationService.sendAlert(title, body, data);
  }, [isPermitted]);

  const sendSuccess = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    if (!isPermitted) return;
    await notificationService.sendSuccess(title, body, data);
  }, [isPermitted]);

  const sendInfo = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    if (!isPermitted) return;
    await notificationService.sendInfo(title, body, data);
  }, [isPermitted]);

  const sendReminder = useCallback(async (
    title: string,
    body: string,
    delayMs?: number
  ) => {
    if (!isPermitted) return;
    await notificationService.sendReminder(title, body, delayMs);
  }, [isPermitted]);

  const subscribeToPush = useCallback(async (vapidKey: string) => {
    const subscription = await notificationService.subscribeToPush(vapidKey);
    setIsSubscribed(!!subscription);
    return subscription;
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
    const result = await notificationService.unsubscribeFromPush();
    setIsSubscribed(!result);
    return result;
  }, []);

  return {
    isSupported,
    isPermitted,
    isSubscribed,
    sendNotification,
    sendAlert,
    sendSuccess,
    sendInfo,
    sendReminder,
    subscribeToPush,
    unsubscribeFromPush,
    requestPermission,
  };
}
