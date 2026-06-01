import axios from 'axios';

// Helper to convert base64 VAPID public keys to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeUserToPush = async () => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported in this browser.');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Fetch VAPID public key from backend
    const { data } = await axios.get('/api/notifications/vapid-key');
    const vapidPublicKey = data.publicKey;
    
    if (!vapidPublicKey) {
      console.error('VAPID public key not found on server.');
      return;
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Request permissions
    const permission = await window.Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied by user.');
      return;
    }

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    // Save on backend
    await axios.post('/api/notifications/subscribe', { subscription });
    console.log('User successfully subscribed to Web Push notifications!');
  } catch (err) {
    console.error('Error subscribing user to push notifications:', err);
  }
};

export const unsubscribeUserFromPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await axios.delete('/api/notifications/unsubscribe');
      console.log('User successfully unsubscribed from push.');
    }
  } catch (err) {
    console.error('Error unsubscribing user from push:', err);
  }
};
