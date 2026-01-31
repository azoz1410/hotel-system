// إعدادات Firebase
// ملاحظة: استبدل هذه الإعدادات بإعدادات مشروعك من Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyDemoKeyForHotelSystem123456789",
    authDomain: "hotel-system-demo.firebaseapp.com",
    databaseURL: "https://hotel-system-demo-default-rtdb.firebaseio.com",
    projectId: "hotel-system-demo",
    storageBucket: "hotel-system-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// مرجع لقاعدة البيانات
const database = firebase.database();
const roomsRef = database.ref('rooms');
const logsRef = database.ref('logs');

console.log('✅ تم الاتصال بـ Firebase');
