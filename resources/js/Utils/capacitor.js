import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

export const initCapacitorPush = async () => {
    if (!Capacitor.isNativePlatform()) {
        return;
    }

    try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            console.log('User denied mobile push notification permissions');
            return;
        }

        // Create High-Priority Notification Channels for Android so notifications POP UP on screen (Heads-Up Banner)
        if (Capacitor.getPlatform() === 'android') {
            try {
                await PushNotifications.createChannel({
                    id: 'fcm_default_channel',
                    name: 'Notifikasi Trakin Gym',
                    description: 'Pemberitahuan aktivitas, kelas, dan akun',
                    importance: 5, // 5 = IMPORTANCE_HIGH (Shows as floating heads-up pop-up banner on screen)
                    visibility: 1, // 1 = VISIBILITY_PUBLIC
                    sound: 'default',
                    vibration: true,
                    lights: true,
                });

                await LocalNotifications.createChannel({
                    id: 'fcm_default_channel',
                    name: 'Notifikasi Trakin Gym',
                    description: 'Pemberitahuan aktivitas, kelas, dan akun',
                    importance: 5,
                    visibility: 1,
                    sound: 'default',
                    vibration: true,
                    lights: true,
                });
            } catch (chanErr) {
                console.warn('Channel creation warning:', chanErr);
            }
        }

        // 1. Remove existing listeners to avoid duplicate callbacks
        await PushNotifications.removeAllListeners();

        // 2. Register listeners BEFORE calling register()
        PushNotifications.addListener('registration', async (token) => {
            console.log('Capacitor Push Token obtained:', token.value);
            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                const response = await fetch('/device-token', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({ token: token.value }),
                });

                if (response.ok) {
                    console.log('Device token saved successfully to backend!');
                } else {
                    console.warn('Failed to save device token:', response.status, await response.text());
                }
            } catch (e) {
                console.error('Error posting device token to server:', e);
            }
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('Capacitor Push Registration Error:', error);
        });

        // If notification arrives while app is open in foreground, display a floating banner via LocalNotifications
        PushNotifications.addListener('pushNotificationReceived', async (notification) => {
            console.log('Mobile Push Notification Received:', notification);
            try {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            id: Math.floor(Math.random() * 100000),
                            title: notification.title || 'Trakin Gym',
                            body: notification.body || '',
                            channelId: 'fcm_default_channel',
                            sound: 'default',
                            extra: notification.data || {},
                        }
                    ]
                });
            } catch (e) {
                console.warn('Foreground notification display fallback error:', e);
            }
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Mobile Push Notification Action Performed:', notification);
            const url = notification?.notification?.data?.url;
            if (url) {
                window.location.href = url;
            }
        });

        // 3. Trigger native registration AFTER listeners are set up
        await PushNotifications.register();
    } catch (e) {
        console.error('Capacitor Push Init Error:', e);
    }
};
