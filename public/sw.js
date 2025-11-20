// This should be at the very top of your service worker file
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-database-compat.js");

const CACHE_NAME = 'expensetracker-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/Fintrack(logo).png',
  // Add other critical assets here
];

// Firebase configuration from your app
const firebaseConfig = {
  projectId: "studio-8032858002-f6cbf",
  appId: "1:577729465600:web:50e627ef49874158d3b7e5",
  storageBucket: "studio-8032858002-f6cbf.firebasestorage.app",
  apiKey: "AIzaSyD1bdATBTBi-QJTP0j1pTbzO2342ogENws",
  authDomain: "studio-8032858002-f6cbf.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "577729465600",
  databaseURL: "https://budget-app-3dfc3-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});


self.addEventListener('activate', (event) => {
    console.log('Service worker activated');
    event.waitUntil(
        self.clients.claim()
    );
});


self.addEventListener('push', event => {
    console.log('Push received:', event);
    const data = event.data.json();
    console.log('Push data:', data);

    const title = data.title || 'ExpenseWise';
    const options = {
        body: data.body,
        icon: '/Fintrack(logo).png',
        badge: '/Fintrack(logo).png',
        actions: data.actions || [],
        data: data.data // Pass along any custom data
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    console.log('Notification click received.', event.action);

    if (event.action === 'mark_present') {
        const employeeId = event.notification.data.employeeId;
        const dateString = new Date().toISOString().split('T')[0];
        
        if (employeeId) {
            console.log(`Marking ${employeeId} as present for ${dateString}`);
            const attendanceRef = db.ref(`attendance/${dateString}/${employeeId}`);
            
            // We need to get the existing record to not overwrite notes, etc.
            const updatePromise = attendanceRef.once('value').then(snapshot => {
                const existingRecord = snapshot.val() || {};
                return attendanceRef.set({
                    ...existingRecord,
                    status: 'full-day',
                    employeeId: employeeId,
                    date: dateString,
                });
            }).then(() => {
                console.log('Attendance marked successfully.');
                // Optionally show a confirmation notification
                return self.registration.showNotification('Attendance Marked', {
                    body: `Attendance has been marked for today.`,
                    icon: '/Fintrack(logo).png'
                });
            }).catch(error => {
                console.error('Failed to mark attendance:', error);
            });

            event.waitUntil(updatePromise);
        }
    } else {
        // Default action: open the app
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});