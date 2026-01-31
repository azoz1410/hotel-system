// بيانات الغرف الافتراضية
const defaultRooms = [
    { number: 101, type: 'غرفة مفردة', status: 'available', price: 150 },
    { number: 102, type: 'غرفة مفردة', status: 'occupied', price: 150 },
    { number: 103, type: 'غرفة مزدوجة', status: 'available', price: 250 },
    { number: 104, type: 'غرفة مزدوجة', status: 'available', price: 250 },
    { number: 105, type: 'جناح', status: 'occupied', price: 500 },
    { number: 201, type: 'غرفة مفردة', status: 'available', price: 150 },
    { number: 202, type: 'غرفة مفردة', status: 'available', price: 150 },
    { number: 203, type: 'غرفة مزدوجة', status: 'occupied', price: 250 },
    { number: 204, type: 'غرفة مزدوجة', status: 'available', price: 250 },
    { number: 205, type: 'جناح', status: 'available', price: 500 },
    { number: 301, type: 'غرفة مفردة', status: 'available', price: 150 },
    { number: 302, type: 'غرفة مفردة', status: 'maintenance', price: 150 },
    { number: 303, type: 'غرفة مزدوجة', status: 'available', price: 250 },
    { number: 304, type: 'غرفة مزدوجة', status: 'available', price: 250 },
    { number: 305, type: 'جناح', status: 'occupied', price: 500 },
];

// تحميل الغرف من localStorage أو استخدام البيانات الافتراضية
let rooms = [];
function loadRooms() {
    const savedData = localStorage.getItem('hotelRooms');
    if (savedData) {
        rooms = JSON.parse(savedData);
    } else {
        rooms = [...defaultRooms];
    }
}

// ترجمة حالات الغرف
const statusTranslations = {
    available: 'متاحة',
    occupied: 'محجوزة',
    maintenance: 'صيانة'
};

// عرض الغرف
function displayRooms(filter = 'all') {
    const roomsGrid = document.getElementById('roomsGrid');
    roomsGrid.innerHTML = '';

    let filteredRooms = rooms;
    
    if (filter !== 'all') {
        filteredRooms = rooms.filter(room => room.status === filter);
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

// تحديث تلقائي للحالة كل 30 ثانية (تحديث من localStorage)
function simulateRealTimeUpdates() {
    setInterval(() => {
        // تحديث من localStorage في حالة تغيير البيانات من لوحة التحكم
        loadRooms();
        displayRooms();
        console.log('تحديث البيانات...');
    }, 30000);
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    loadRooms(); // تحميل الغرف
    displayRooms();
    simulateRealTimeUpdates();
    
    // إضافة رسالة ترحيبية
    console.log('✅ نظام إدارة الفندق جاهز');
});
