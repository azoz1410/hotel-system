// متغير لتخزين الغرف
let rooms = [];

// ترجمة حالات الغرف
const statusTranslations = {
    available: 'متاحة',
    occupied: 'محجوزة',
    maintenance: 'صيانة'
};

// الاستماع للتحديثات من Firebase
function listenToRooms() {
    roomsRef.on('value', (snapshot) => {
        rooms = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                rooms.push(data[key]);
            });
        }
        
        // ترتيب الغرف حسب الرقم
        rooms.sort((a, b) => a.number - b.number);
        
        console.log('✅ تم تحميل الغرف من Firebase:', rooms.length);
        
        // عرض الغرف
        displayRooms();
    }, (error) => {
        console.error('❌ خطأ في الاتصال بـ Firebase:', error);
    });
}

// عرض الغرف
function displayRooms(filter = 'all') {
    const roomsGrid = document.getElementById('roomsGrid');
    roomsGrid.innerHTML = '';

    let filteredRooms = rooms;
    
    if (filter !== 'all') {
        filteredRooms = rooms.filter(room => room.status === filter);
    }

    if (filteredRooms.length === 0) {
        roomsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #999; font-size: 18px;">لا توجد غرف متاحة</div>';
        updateStats();
        return;
    }

    filteredRooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = `room-card ${room.status}`;
        
        roomCard.innerHTML = `
            <div class="room-number">${room.number}</div>
            <div class="room-type">${room.type}</div>
            <div class="room-status">${statusTranslations[room.status]}</div>
            <div class="room-price">${room.price} ريال</div>
        `;

        // إضافة تأثير النقر
        roomCard.addEventListener('click', () => {
            showRoomDetails(room);
        });

        roomsGrid.appendChild(roomCard);
    });

    updateStats();
}

// تحديث الإحصائيات
function updateStats() {
    const available = rooms.filter(r => r.status === 'available').length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const total = rooms.length;

    document.getElementById('availableCount').textContent = available;
    document.getElementById('occupiedCount').textContent = occupied;
    document.getElementById('totalCount').textContent = total;
}

// عرض تفاصيل الغرفة
function showRoomDetails(room) {
    const statusText = statusTranslations[room.status];
    alert(`
غرفة رقم: ${room.number}
النوع: ${room.type}
الحالة: ${statusText}
السعر: ${room.price} ريال/ليلة
    `.trim());
}

// تصفية الغرف
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // إزالة الفئة النشطة من جميع الأزرار
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        
        // إضافة الفئة النشطة للزر المحدد
        this.classList.add('active');
        
        // تصفية الغرف
        const filter = this.dataset.filter;
        displayRooms(filter);
    });
});

// تسجيل Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 جاري الاتصال بـ Firebase...');
    
    // بدء الاستماع للتحديثات
    listenToRooms();
    
    console.log('✅ نظام إدارة الفندق جاهز - Firebase Realtime Database');
});
