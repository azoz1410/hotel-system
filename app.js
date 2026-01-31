// متغير لتخزين الغرف
let rooms = [];

// تحميل الغرف من قاعدة البيانات
async function loadRooms() {
    try {
        rooms = await hotelDB.getAllRooms();
        console.log('✅ تم تحميل الغرف من قاعدة البيانات:', rooms.length);
    } catch (error) {
        console.error('❌ خطأ في تحميل الغرف:', error);
        rooms = [];
    }
}

// ترجمة حالات الغرف
const statusTranslations = {
    available: 'متاحة',
    occupied: 'محجوزة',
    maintenance: 'صيانة'
};

// عرض الغرف
async function displayRooms(filter = 'all') {
    // تحميل الغرف من قاعدة البيانات
    await loadRooms();
    
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
function simulateRealTimeUpdates() {
    setInterval(async () => {
        // تحديث من قاعدة البيانات
        await displayRooms();
        console.log('🔄 تحديث البيانات...');
    }, 30000);
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // تهيئة قاعدة البيانات
        await hotelDB.init();
        
        // عرض الغرف من قاعدة البيانات
        await displayRooms();
        
        // بدء التحديث التلقائي
        simulateRealTimeUpdates();
        
        // عرض الإحصائيات
        const stats = await hotelDB.getStats();
        console.log('📊 إحصائيات قاعدة البيانات:', stats);
        console.log('✅ نظام إدارة الفندق جاهز - عرض الغرف من قاعدة البيانات');
    } catch (error) {
        console.error('❌ خطأ في تهيئة النظام:', error);
    }
});
