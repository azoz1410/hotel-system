// Service Worker للتطبيق
const CACHE_NAME = 'hotel-system-v1';
const urlsToCache = [
  '/welcome.html',
  '/index.html',
  '/admin.html',
  '/bookings.html',
  '/dashboard.html',
  '/login.html',
  '/qrcode.html',
  '/styles.css',
  '/app.js',
  '/admin.js',
  '/bookings.js',
  '/dashboard.js',
  '/auth.js',
  '/firebase-config.js'
];

// التثبيت
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('❌ Service Worker: Cache error', error);
      })
  );
});

// التفعيل
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch - استراتيجية Network First
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // نسخ الاستجابة
        const responseClone = response.clone();
        
        // حفظ في الكاش
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // إذا فشل الطلب، استخدم الكاش
        return caches.match(event.request);
      })
  );
});

// إشعارات Push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'إشعار جديد من نظام الفندق',
    icon: 'https://via.placeholder.com/192x192.png?text=🏨',
    badge: 'https://via.placeholder.com/96x96.png?text=🏨',
    vibrate: [200, 100, 200],
    tag: 'hotel-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'عرض'
      },
      {
        action: 'close',
        title: 'إغلاق'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('نظام إدارة الفندق', options)
  );
});

// التعامل مع إجراءات الإشعارات
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/admin.html')
    );
  }
});
