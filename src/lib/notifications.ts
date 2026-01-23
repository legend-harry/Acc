/**
 * Push Notifications Service
 * Handles registration, management, and delivery of push notifications
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: Record<string, any>;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export class NotificationService {
  private serviceWorkerReady = false;

  /**
   * Initialize the notification service
   * Checks browser support and requests permissions
   */
  async initialize(): Promise<boolean> {
    // Check if running in browser
    if (typeof window === 'undefined') return false;

    // Check notification support
    if (!('Notification' in window)) {
      console.warn('Notifications not supported by this browser');
      return false;
    }

    // Check service worker support
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported by this browser');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      this.serviceWorkerReady = !!registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }

    // Request permission if needed
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return Notification.permission === 'granted';
  }

  /**
   * Send a local notification immediately
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    if (!this.serviceWorkerReady) {
      console.warn('Service Worker not ready');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag,
        requireInteraction: payload.requireInteraction ?? false,
        actions: payload.actions,
        data: payload.data,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Send an alert notification (requires interaction)
   */
  async sendAlert(title: string, body: string, data?: Record<string, any>): Promise<void> {
    await this.sendNotification({
      title,
      body,
      requireInteraction: true,
      data,
      icon: '/icons/alert.svg',
    });
  }

  /**
   * Send a success notification
   */
  async sendSuccess(title: string, body: string, data?: Record<string, any>): Promise<void> {
    await this.sendNotification({
      title,
      body,
      data,
      icon: '/icons/success.svg',
    });
  }

  /**
   * Send an info notification
   */
  async sendInfo(title: string, body: string, data?: Record<string, any>): Promise<void> {
    await this.sendNotification({
      title,
      body,
      data,
      icon: '/icons/info.svg',
    });
  }

  /**
   * Send a reminder notification
   */
  async sendReminder(title: string, body: string, delayMs: number = 0): Promise<void> {
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    await this.sendNotification({
      title,
      body,
      tag: 'reminder',
      icon: '/icons/reminder.svg',
    });
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.serviceWorkerReady) {
      console.warn('Service Worker not ready for push subscription');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      });

      return {
        endpoint: subscription.endpoint,
        keys: {
          auth: this.arrayBufferToBase64(subscription.getKey('auth')),
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
        },
      };
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        return true;
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
    return false;
  }

  /**
   * Get current push subscription
   */
  async getPushSubscription(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        return {
          endpoint: subscription.endpoint,
          keys: {
            auth: this.arrayBufferToBase64(subscription.getKey('auth')),
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          },
        };
      }
    } catch (error) {
      console.error('Failed to get push subscription:', error);
    }
    return null;
  }

  /**
   * Check if notifications are permitted
   */
  canNotify(): boolean {
    return typeof window !== 'undefined' && 
           'Notification' in window && 
           Notification.permission === 'granted';
  }

  /**
   * Convert base64 string to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Create singleton instance
export const notificationService = new NotificationService();
