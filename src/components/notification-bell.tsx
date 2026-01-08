
"use client";

import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { get, ref } from 'firebase/database';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function NotificationBell() {
    const { toast } = useToast();
    const [hasPermission, setHasPermission] = useState(false);
    
    useEffect(() => {
        if ('Notification' in window) {
            setHasPermission(Notification.permission === 'granted');
        }
    }, []);

    const sendTestNotification = async () => {
        if (!('serviceWorker' in navigator) || !hasPermission) {
            toast({
                title: "Can't send notification",
                description: "Service worker not supported or permission denied.",
                variant: 'destructive',
            });
            return;
        }

        const primaryEmployeeId = localStorage.getItem('primaryEmployeeId');
        if (!primaryEmployeeId) {
             toast({
                title: "Primary Employee Not Set",
                description: "Please set a primary employee in settings to test notifications.",
                variant: 'destructive',
            });
            return;
        }

        try {
            const employeeSnap = await get(ref(db, `employees/${primaryEmployeeId}`));
            const employee = employeeSnap.val();
            
            if (!employee) {
                toast({ title: "Employee not found", variant: 'destructive' });
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            registration.showNotification('Test Attendance Reminder', {
                body: `Don't forget to mark attendance for ${employee.name}!`,
                icon: '/Fintrack(logo).png',
                actions: [
                    { action: 'mark_present', title: 'Mark as Present' },
                    { action: 'dismiss', title: 'Dismiss' },
                ],
                data: {
                    employeeId: primaryEmployeeId,
                    url: window.location.origin + '/employees'
                }
            });
            toast({ title: "Test Notification Sent" });

        } catch (error) {
            console.error("Error sending test notification:", error);
            toast({ title: "Failed to send notification", variant: 'destructive'});
        }
    };
    
    const requestPermission = () => {
         if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                setHasPermission(permission === 'granted');
                 if (permission === 'granted') {
                    toast({ title: "Notifications Enabled", description: "You can now receive attendance reminders." });
                } else {
                    toast({ title: "Notifications Denied", variant: 'destructive' });
                }
            });
        }
    }


    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Bell className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Notification Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={sendTestNotification} disabled={!hasPermission}>
                    Send Test Notification
                </DropdownMenuItem>
                 {!hasPermission && (
                     <DropdownMenuItem onClick={requestPermission}>
                        Enable Notifications
                    </DropdownMenuItem>
                 )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}