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
        
        // عرض الغرف في الجدول
        displayRoomsTable();
    }, (error) => {
        console.error('❌ خطأ في الاتصال بـ Firebase:', error);
    });
}

// عرض الغرف في الجدول
function displayRoomsTable() {
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
            await roomsRef.child(editingRoomNumber.toString()).update(roomData);
            
            // إضافة سجل
            await logsRef.push({
                action: 'update',
                room: roomNumber,
                timestamp: new Date().toISOString(),
                details: `تم تعديل الغرفة ${roomNumber}`
            });
            
            alert('✅ تم تعديل الغرفة بنجاح!');
            editingRoomNumber = null;
            document.querySelector('button[type="submit"]').textContent = '➕ إضافة غرفة';
        } else {
            // التحقق من عدم وجود الغرفة
            const snapshot = await roomsRef.child(roomNumber.toString()).once('value');
            if (snapshot.exists()) {
                alert('❌ رقم الغرفة موجود بالفعل!');
                return;
            }
            
            // إضافة غرفة جديدة
            await roomsRef.child(roomNumber.toString()).set(roomData);
            
            // إضافة سجل
            await logsRef.push({
                action: 'add',
                room: roomNumber,
                timestamp: new Date().toISOString(),
                details: `تم إضافة الغرفة ${roomNumber}`
            });
            
            alert('✅ تم إضافة الغرفة بنجاح!');
        }

        // إعادة تعيين النموذج
        this.reset();
        
        // إلغاء وضع التعديل
        editingRoomNumber = null;
        document.getElementById('roomNumber').disabled = false;
    } catch (error) {
        console.error('❌ خطأ في حفظ الغرفة:', error);
        alert('❌ حدث خطأ أثناء حفظ الغرفة: ' + error.message);
    }
});

// تعديل غرفة
function editRoom(roomNumber) {
    const room = rooms.find(r => r.number === roomNumber);
    
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
}

// حذف غرفة
async function deleteRoom(roomNumber) {
    if (confirm(`هل أنت متأكد من حذف الغرفة رقم ${roomNumber}؟`)) {
        try {
            await roomsRef.child(roomNumber.toString()).remove();
            
            // إضافة سجل
            await logsRef.push({
                action: 'delete',
                room: roomNumber,
                timestamp: new Date().toISOString(),
                details: `تم حذف الغرفة ${roomNumber}`
            });
            
            alert('✅ تم حذف الغرفة بنجاح!');
        } catch (error) {
            console.error('❌ خطأ في حذف الغرفة:', error);
            alert('❌ حدث خطأ أثناء حذف الغرفة: ' + error.message);
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

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 جاري الاتصال بـ Firebase...');
    
    // بدء الاستماع للتحديثات
    listenToRooms();
    
    console.log('✅ لوحة التحكم جاهزة - Firebase Realtime Database');
});
