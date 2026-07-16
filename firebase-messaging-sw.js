// Firebase Cloud Messaging background handler.
// This is a SEPARATE service worker from sw.js (the PWA/offline one) — Firebase Cloud
// Messaging specifically requires its own file named firebase-messaging-sw.js registered
// at the root scope. Both workers run side by side without conflict.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Must match the FIREBASE_CONFIG object in index.html exactly.
firebase.initializeApp({
  apiKey: "AIzaSyDvrN-zAralK-poWaEljoFK8_OV58XBsPk",
  authDomain: "bible-tracker-4b8f4.firebaseapp.com",
  projectId: "bible-tracker-4b8f4",
  storageBucket: "bible-tracker-4b8f4.firebasestorage.app",
  messagingSenderId: "1076567117129",
  appId: "1:1076567117129:web:a444e419f79985a3dade98"
});

const messaging = firebase.messaging();

// Shown when a check-in reminder arrives while the app isn't in the foreground.
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Cultivate';
  const options = {
    body: (payload.notification && payload.notification.body) || "It's been a few days — no pressure, just a gentle nudge.",
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: './' }
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
