importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCFbgxWstKNY_62Vkk_YkMppcJdFeirit8",
  authDomain: "jagadeeshdashboard.firebaseapp.com",
  projectId: "jagadeeshdashboard",
  storageBucket: "jagadeeshdashboard.firebasestorage.app",
  messagingSenderId: "719977822113",
  appId: "1:719977822113:web:06abd62badb7e684e3bde0"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload?.notification?.title || "DumpAReview";
  const notificationOptions = {
    body: payload?.notification?.body || "You have a new notification",
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
