/**
 * Push Notifications Settings Component
 * Allows users to enable/disable notifications
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  alerts: boolean;
  reminders: boolean;
  reports: boolean;
  updates: boolean;
  marketing: boolean;
}

export function PushNotificationSettings() {
  const { toast } = useToast();
  const {
    isSupported,
    isPermitted,
    isSubscribed,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
  } = usePushNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    alerts: true,
    reminders: true,
    reports: true,
    updates: true,
    marketing: false,
  });

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermission();

      if (granted) {
        // TODO: Replace with your actual VAPID public key
        const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

        if (VAPID_PUBLIC_KEY) {
          const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);
          if (subscription) {
            // Send subscription to server
            await fetch('/api/notifications/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subscription),
            });

            toast({
              title: '✅ Notifications Enabled',
              description: 'Push notifications have been enabled for your account',
            });
          }
        } else {
          toast({
            title: '⚠️ Configuration Required',
            description: 'VAPID key not configured. Contact administrator.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: '❌ Permission Denied',
          description: 'Notification permission was denied. You can change this in your browser settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to enable notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      await unsubscribeFromPush();

      // Notify server
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
      });

      toast({
        title: '✅ Notifications Disabled',
        description: 'Push notifications have been disabled',
      });
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to disable notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    localStorage.setItem('notificationPreferences', JSON.stringify(updated));

    // Send to server
    fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(console.error);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported on your browser. Please use a modern browser like Chrome, Firefox, or Edge.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Get real-time alerts and reminders for your shrimp farming operations
            </CardDescription>
          </div>
          <Badge variant={isPermitted ? 'default' : 'secondary'}>
            {isPermitted ? '✅ Enabled' : '⭕ Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium">Status</h4>
              <p className="text-sm text-muted-foreground">
                {isPermitted ? 'Notifications are enabled' : 'Notifications are disabled'}
              </p>
            </div>
            <Button
              onClick={isPermitted ? handleDisableNotifications : handleEnableNotifications}
              disabled={isLoading}
              variant={isPermitted ? 'destructive' : 'default'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isPermitted ? 'Disabling...' : 'Enabling...'}
                </>
              ) : (
                isPermitted ? 'Disable' : 'Enable'
              )}
            </Button>
          </div>
        </div>

        {/* Notification Types */}
        {isPermitted && (
          <div className="space-y-3">
            <h4 className="font-medium">Notification Types</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Choose which notifications you'd like to receive
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-2">
                <Checkbox
                  id="alerts"
                  checked={preferences.alerts}
                  onCheckedChange={() => handlePreferenceChange('alerts')}
                />
                <Label htmlFor="alerts" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Critical Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Water quality issues, disease outbreaks, equipment failures
                    </p>
                  </div>
                </Label>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

              <div className="flex items-center space-x-3 p-2">
                <Checkbox
                  id="reminders"
                  checked={preferences.reminders}
                  onCheckedChange={() => handlePreferenceChange('reminders')}
                />
                <Label htmlFor="reminders" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Daily Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Feeding schedules, water testing, maintenance tasks
                    </p>
                  </div>
                </Label>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

              <div className="flex items-center space-x-3 p-2">
                <Checkbox
                  id="reports"
                  checked={preferences.reports}
                  onCheckedChange={() => handlePreferenceChange('reports')}
                />
                <Label htmlFor="reports" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Report Summaries</p>
                    <p className="text-sm text-muted-foreground">
                      Daily, weekly, and cycle analysis reports
                    </p>
                  </div>
                </Label>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

              <div className="flex items-center space-x-3 p-2">
                <Checkbox
                  id="updates"
                  checked={preferences.updates}
                  onCheckedChange={() => handlePreferenceChange('updates')}
                />
                <Label htmlFor="updates" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">AI Insights</p>
                    <p className="text-sm text-muted-foreground">
                      Predictive alerts and optimization recommendations
                    </p>
                  </div>
                </Label>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

              <div className="flex items-center space-x-3 p-2">
                <Checkbox
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={() => handlePreferenceChange('marketing')}
                />
                <Label htmlFor="marketing" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Tips & Features</p>
                    <p className="text-sm text-muted-foreground">
                      New features, tips, and educational content
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Info Alert */}
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            Push notifications work even when the app is closed. Make sure your browser allows notifications and you're logged in on this device.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
