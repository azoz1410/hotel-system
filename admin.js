// متغير لتخزين الغرف
let rooms = [];

// ترجمة حالات الغرف
const statusTranslations = {
    available: 'متاحة',
    occupied: 'محجوزة',
    maintenance: 'صيانة'
};

// متغير لتتبع الغرفة قيد التعديل
let editingRoomNumber = null;

// تحميل الغرف من قاعدة البيانات
async function loadRooms() {
    try {
        rooms = await hotelDB.getAllRooms();
        console.log('✅ تم تحميل الغرف:', rooms.length);
    } catch (error) {
        console.error('❌ خطأ في تحميل الغرف:', error);
        rooms = [];
    }
}

// عرض الغرف في الجدول
async function displayRoomsTable() {
    await loadRooms();
    
    const tbody = document.getElementById('roomsTableBody');
    tbody.innerHTML = '';

    rooms.forEach(room => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${room.number}</strong></td>
            <td>${room.type}</td>
            <td><span class="status-badge status-${room.status}">${statusTranslations[room.status]}</span></td>
            <td>${room.price} ريال</td>
            <td>
                <button class="action-btn btn-edit" onclick="editRoom(${room.number})">✏️ تعديل</button>
                <button class="action-btn btn-delete" onclick="deleteRoom(${room.number})">🗑️ حذف</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// إضافة أو تعديل غرفةmber').value);
    const roomType = document.getElementById('roomType').value;async function(e) {
    e.preventDefault();

    const roomNumber = parseInt(document.getElementById('roomNumber').value);
    const roomType = document.getElementById('roomType').value;
    const roomStatus = document.getElementById('roomStatus').value;
    const roomPrice = parseInt(document.getElementById('roomPrice').value);

    const roomData = {
        number: roomNumber,
        type: roomType,
        status: roomStatus,
        price: roomPrice
    };

    try {
        if (editingRoomNumber !== null) {
            // تعديل غرفة موجودة
            await hotelDB.updateRoom(roomData);
            alert('✅ تم تعديل الغرفة بنجاح!');
            editingRoomNumber = null;
        } else {
            // إضافة غرفة جديدة
            const existingRoom = await hotelDB.getRoom(roomNumber);
            if (existingRoom) {
                alert('❌ رقم الغرفة موجود بالفعل!');
                return;
            }

            await hotelDB.addRoom(roomData);
            alert('✅ تم إضافة الغرفة بنجاح!');
        }

        // إعادة تحميل الجدول
        await displayRoomsTable();
        
        // إعادة تعيين النموذج
        this.reset();
    } catch (error) {
        console.error('❌ خطأ في حفظ الغرفة:', error);
        alert('❌ حدث خطأ أثناء حفظ الغرفة');
    }(roomNumber) {
    const room = rooms.find(r => r.number === roomNumber);
    if (room) {
async function editRoom(roomNumber) {
    c
});

// تعديل غرفةt.getElementById('roomNumber').value = room.number;
        document.getElementById('roomType').value = room.type;
        document.getElementById('roomStatus').value = room.status;
        document.getElementById('roomPrice').value = room.price;
        
        editingRoomNumber = roomNumber;
        
        // تمرير النموذج إلى الأعلى
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// حذف غرفة
async function deleteRoom(roomNumber) {
    if (confirm(`هل أنت متأكد من حذف الغرفة رقم ${roomNumber}؟`)) {
        try {
            await hotelDB.deleteRoom(roomNumber);
            await displayRoomsTable();
            alert('✅ تم حذف الغرفة بنجاح!');
        } catch (error) {
            console.error('❌ خطأ في حذف الغرفة:', error);
            alert('❌ حدث خطأ أثناء حذف الغرفة');
        }
    }
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // تهيئة قاعدة البيانات
        await hotelDB.init();
        
        // إضافة البيانات الافتراضية إذا لزم الأمر
        await hotelDB.seedDefaultData();
        
        // عرض الغرف
        await displayRoomsTable();
        
        // عرض الإحصائيات
        const stats = await hotelDB.getStats();
        console.log('📊 إحصائيات النظام:', stats);
        console.log('✅ لوحة التحكم جاهزة');
    } catch (error) {
        console.error('❌ خطأ في تهيئة لوحة التحكم:', error);
    }