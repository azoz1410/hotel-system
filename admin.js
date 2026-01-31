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
        rooms = await hotelAPI.getAllRooms();
        console.log('✅ تم تحميل الغرف من SQLite:', rooms.length);
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

    if (rooms.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">لا توجد غرف مسجلة. قم بإضافة غرفة جديدة</td></tr>';
        return;
    }

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

// إضافة أو تعديل غرفة
document.getElementById('roomForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const roomNumber = parseInt(document.getElementById('roomNumber').value);
    const roomType = document.getElementById('roomType').value;
    const roomStatus = document.getElementById('roomStatus').value;
    const roomPrice = parseInt(document.getElementById('roomPrice').value);

    // التحقق من البيانات
    if (!roomNumber || !roomType || !roomStatus || !roomPrice) {
        alert('❌ الرجاء ملء جميع الحقول');
        return;
    }

    if (roomNumber < 1) {
        alert('❌ رقم الغرفة يجب أن يكون أكبر من 0');
        return;
    }

    if (roomPrice < 1) {
        alert('❌ السعر يجب أن يكون أكبر من 0');
        return;
    }

    const roomData = {
        number: roomNumber,
        type: roomType,
        status: roomStatus,
        price: roomPrice
    };

    try {
        if (editingRoomNumber !== null) {
            // تعديل غرفة موجودة
            await hotelAPI.updateRoom(roomData);
            alert('✅ تم تعديل الغرفة بنجاح!');
            editingRoomNumber = null;
            document.querySelector('button[type="submit"]').textContent = '➕ إضافة غرفة';
        } else {
            // إضافة غرفة جديدة
            await hotelAPI.addRoom(roomData);
            alert('✅ تم إضافة الغرفة بنجاح!');
        }

        // إعادة تحميل الجدول
        await displayRoomsTable();
        
        // إعادة تعيين النموذج
        this.reset();
        
        // إلغاء وضع التعديل
        editingRoomNumber = null;
        document.getElementById('roomNumber').disabled = false;
    } catch (error) {
        console.error('❌ خطأ في حفظ الغرفة:', error);
        if (error.message && error.message.includes('موجود')) {
            alert('❌ رقم الغرفة موجود بالفعل!');
        } else {
            alert('❌ حدث خطأ أثناء حفظ الغرفة. تأكد من تشغيل السيرفر.');
        }
    }
});

// تعديل غرفة
async function editRoom(roomNumber) {
    try {
        const room = await hotelAPI.getRoom(roomNumber);
        if (room) {
            document.getElementById('roomNumber').value = room.number;
            document.getElementById('roomType').value = room.type;
            document.getElementById('roomStatus').value = room.status;
            document.getElementById('roomPrice').value = room.price;
            
            editingRoomNumber = roomNumber;
            
            // تعطيل حقل رقم الغرفة عند التعديل
            document.getElementById('roomNumber').disabled = true;
            
            // تغيير نص الزر
            document.querySelector('button[type="submit"]').textContent = '✏️ تحديث الغرفة';
            
            // تمرير النموذج إلى الأعلى
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل بيانات الغرفة:', error);
        alert('❌ حدث خطأ أثناء تحميل بيانات الغرفة');
    }
}

// حذف غرفة
async function deleteRoom(roomNumber) {
    if (confirm(`هل أنت متأكد من حذف الغرفة رقم ${roomNumber}؟`)) {
        try {
            await hotelAPI.deleteRoom(roomNumber);
            await displayRoomsTable();
            alert('✅ تم حذف الغرفة بنجاح!');
        } catch (error) {
            console.error('❌ خطأ في حذف الغرفة:', error);
            alert('❌ حدث خطأ أثناء حذف الغرفة');
        }
    }
}

// إلغاء وضع التعديل
function cancelEdit() {
    editingRoomNumber = null;
    document.getElementById('roomForm').reset();
    document.getElementById('roomNumber').disabled = false;
    document.querySelector('button[type="submit"]').textContent = '➕ إضافة غرفة';
}

// تحديث الإحصائيات
async function updateStats() {
    try {
        const stats = await hotelAPI.getStats();
        
        document.getElementById('totalRooms').textContent = stats.total;
        document.getElementById('availableRooms').textContent = stats.available;
        document.getElementById('occupiedRooms').textContent = stats.occupied;
        document.getElementById('maintenanceRooms').textContent = stats.maintenance;
    } catch (error) {
        console.error('❌ خطأ في تحميل الإحصائيات:', error);
    }
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🔄 جاري الاتصال بقاعدة البيانات...');
        
        // عرض الغرف من قاعدة البيانات SQLite
        await displayRoomsTable();
        
        // تحديث الإحصائيات
        await updateStats();
        
        // عرض معلومات الاتصال
        const stats = await hotelAPI.getStats();
        console.log('📊 إحصائيات النظام:', stats);
        console.log('✅ لوحة التحكم جاهزة - متصلة بقاعدة بيانات SQLite (hotel.db)');
        console.log('📍 السيرفر: http://localhost:5000');
    } catch (error) {
        console.error('❌ خطأ في تهيئة لوحة التحكم:', error);
        console.error('⚠️ تأكد من تشغيل السيرفر: python3 server.py');
        
        // عرض رسالة للمستخدم
        const tbody = document.getElementById('roomsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px;">
                        <div style="color: #ff6b6b; font-size: 18px; margin-bottom: 10px;">⚠️ خطأ في الاتصال بالسيرفر</div>
                        <div style="color: #666;">تأكد من تشغيل السيرفر باستخدام: <code>python3 server.py</code></div>
                    </td>
                </tr>
            `;
        }
    }
});
