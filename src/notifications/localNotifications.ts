import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const CHANNEL_ID = 'laboratorio';
let channelReady = false;

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
                name: 'Avisos de laboratorio',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#087f8c',
            });
            channelReady = true;
        } catch (error) {
            // Algunas versiones de Expo Go fallan al crear el canal; se usa el canal por defecto.
            console.warn('No se pudo crear el canal, se usará el predeterminado.', error);
        }
    }

    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) {
        permission = await Notifications.requestPermissionsAsync();
    }

    return permission.granted ||
        permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function showLocalNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Usted es un exitoso 😉',
            body: `Prueba programada el ${new Date().toLocaleString('es-PE')}.`,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 3,
            channelId: channelReady ? CHANNEL_ID : undefined,
        },
    });
}

export async function getExpoPushToken(): Promise<string> {
    const allowed = await ensureNotificationPermission();
    if (!allowed) throw new Error('Permiso denegado');
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
    if (!projectId) throw new Error('Falta projectId de EAS');
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return result.data;
}
