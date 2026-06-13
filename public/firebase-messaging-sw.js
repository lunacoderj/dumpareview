// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// We need to parse the query parameters if any, but since the SW is loaded without them,
// you usually hardcode the config here, or fetch it from a public endpoint.
// For security/simplicity, you must replace these with your actual Firebase config values
// because SW cannot read import.meta.env
firebase.initializeApp({
  apiKey: "YOUR_API_KEY", // Note to user: Replace this
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'DumpAReview Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/vite.svg', // Replace with your actual icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
