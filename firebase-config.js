// إعدادات Firebase
// ملاحظة: استبدل هذه الإعدادات بإعدادات مشروعك من Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAvOrqb1GNtrLUFuF3rE5c-nBeVNlkDHIA",
    authDomain: "hotel-system-f50a4.firebaseapp.com",
    databaseURL: "https://hotel-system-f50a4-default-rtdb.firebaseio.com",
    projectId: "hotel-system-f50a4",
    storageBucket: "hotel-system-f50a4.firebasestorage.app",
    messagingSenderId: "671973425461",
    appId: "1:671973425461:web:ff3d3fc7eae32a5a214c7c",
    measurementId: "G-4XZ3T2MWHN"

    
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// مرجع لقاعدة البيانات
const database = firebase.database();
const roomsRef = database.ref('rooms');
const logsRef = database.ref('logs');

console.log('✅ تم الاتصال بـ Firebase');
