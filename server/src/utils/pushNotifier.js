import webpush from 'web-push';
import User from '../models/User.js';

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

// Generate fallback keys on development if missing
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  const keys = webpush.generateVAPIDKeys();
  vapidKeys = {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey
  };
  console.log('\n==================================================');
  console.log('🔑 GENERATED FALLBACK VAPID KEYS FOR WEB PUSH');
  console.log('Public VAPID Key:', keys.publicKey);
  console.log('Private VAPID Key:', keys.privateKey);
  console.log('==================================================\n');
}

webpush.setVapidDetails(
  'mailto:admin@eventsync.ausic.org',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export const getPublicKey = () => vapidKeys.publicKey;

export const sendPushNotification = async (userId, title, body, url = '/') => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscription) return false;

    const payload = JSON.stringify({
      title,
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url }
    });

    await webpush.sendNotification(user.pushSubscription, payload);
    return true;
  } catch (err) {
    console.error(`Failed to send web push notification to user ${userId}:`, err);
    // If subscription is expired or invalid (410 or 404), clear it
    if (err.statusCode === 410 || err.statusCode === 404) {
      await User.findByIdAndUpdate(userId, { $set: { pushSubscription: null } });
      console.log(`Cleared expired push subscription for user ${userId}`);
    }
    return false;
  }
};
