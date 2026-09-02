import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

let listenerInitialized = false;

// Register Service Worker for Web Browser Background Notifications
export const registerServiceWorker = async () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
        try {
            await navigator.serviceWorker.register('/sw.js');
        } catch (e) {
            console.warn('Service worker registration failed:', e);
        }
    }
};

// Initialize native notification listeners safely
export const initNativeNotifications = async () => {
    if (listenerInitialized) return;
    listenerInitialized = true;

    registerServiceWorker();

    try {
        if (Capacitor.isNativePlatform()) {
            await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
                const url = notification?.notification?.extra?.url;
                if (url) {
                    window.location.href = url;
                }
            });
        }
    } catch (e) {
        console.warn('LocalNotifications listener init warning:', e);
    }
};

// Request permissions for OS level native notifications safely
export const requestNativeNotificationPermissions = async () => {
    try {
        if (Capacitor.isNativePlatform()) {
            let perm = await LocalNotifications.checkPermissions();
            if (perm?.display === 'prompt') {
                perm = await LocalNotifications.requestPermissions();
            }
            return perm?.display === 'granted';
        } else if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                const perm = await Notification.requestPermission();
                return perm === 'granted';
            }
            return Notification.permission === 'granted';
        }
    } catch (e) {
        console.warn('Error requesting native notification permissions:', e);
    }
    return false;
};

// Send OS-Level System Notification (iOS/Android Lockscreen & macOS/Desktop System Banner)
// Supports immediate or pre-scheduled OS daemon notifications (fires even when app is closed/killed!)
export const sendNativeSystemNotification = async ({ id, title, body, icon = '/images/logo_trakin.png', url = null, scheduledAt = null }) => {
    try {
        if (typeof window !== 'undefined' && id) {
            const storageKey = 'trakin_sent_notif_' + id;
            if (sessionStorage.getItem(storageKey)) {
                return; // Notification already dispatched, skip duplicate!
            }
            sessionStorage.setItem(storageKey, '1');
        }

        const triggerTime = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 500);

        if (Capacitor.isNativePlatform()) {
            const hasPerm = await requestNativeNotificationPermissions();
            if (hasPerm) {
                const numericId = Math.abs(typeof id === 'number' ? id : String(id).split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 2147483647;
                
                // Cancel existing notification with same ID if any
                try {
                    await LocalNotifications.cancel({ notifications: [{ id: numericId }] });
                } catch (e) {
                    // Ignored
                }

                // Schedule into iOS UNUserNotificationCenter / Android NotificationManager
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            id: numericId || Math.floor(Math.random() * 100000),
                            title: title || 'Trakin Fitness',
                            body: body || '',
                            schedule: { at: triggerTime },
                            sound: 'default',
                            extra: { url: url },
                        },
                    ],
                });
            }
        } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const delay = triggerTime.getTime() - Date.now();

            const fireWebNotif = () => {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then((reg) => {
                        reg.showNotification(title || 'Trakin Fitness', {
                            body: body || '',
                            icon: icon,
                            badge: icon,
                            data: { url: url || '/' },
                        });
                    });
                } else {
                    const notif = new window.Notification(title || 'Trakin Fitness', {
                        body: body || '',
                        icon: icon,
                        badge: icon,
                    });

                    if (url) {
                        notif.onclick = () => {
                            window.focus();
                            window.location.href = url;
                        };
                    }
                }
            };

            if (delay > 1000) {
                setTimeout(fireWebNotif, delay);
            } else {
                fireWebNotif();
            }
        }
    } catch (e) {
        console.warn('Error sending native system notification:', e);
    }
};
