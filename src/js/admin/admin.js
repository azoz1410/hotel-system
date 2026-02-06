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

// ============================================
// Theme Management Functions
// ============================================

// حفظ الثيم إلى Firebase
function saveThemeToFirebase() {
    const themeSelector = document.getElementById('themeSelector');
    const selectedTheme = themeSelector.value;
    
    firebase.database().ref('settings/theme').set(selectedTheme)
        .then(() => {
            alert('✅ تم حفظ الثيم بنجاح! سيظهر لجميع الزوار.');
            // تطبيق الثيم فوراً
            window.ThemeSwitcher.loadTheme(selectedTheme);
        })
        .catch((error) => {
            console.error('❌ خطأ في حفظ الثيم:', error);
            alert('حدث خطأ في حفظ الثيم');
        });
}

// تحميل الثيم الحالي من Firebase
function loadCurrentTheme() {
    firebase.database().ref('settings/theme').once('value')
        .then((snapshot) => {
            const theme = snapshot.val() || 'default';
            const themeSelector = document.getElementById('themeSelector');
            if (themeSelector) {
                themeSelector.value = theme;
            }
        })
        .catch((error) => {
            console.error('❌ خطأ في تحميل الثيم:', error);
        });
}

// ============================================
// User Management
// ============================================

// عرض معلومات المستخدم
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.innerHTML = `<span>👤 ${user.email}</span>`;
        }
        // تحميل الثيم الحالي
        loadCurrentTheme();
    }
});

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
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('roomForm');
    if (!form) {
        console.error('❌ لم يتم العثور على النموذج!');
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 محاولة حفظ الغرفة...');

        const roomNumber = parseInt(document.getElementById('roomNumber').value);
        const roomType = document.getElementById('roomType').value;
        const roomStatus = document.getElementById('roomStatus').value;
        const roomPrice = parseInt(document.getElementById('roomPrice').value);

    // التحقق من البيانات
    if (!roomNumber || !roomType || !roomStatus || !roomPrice) {
        showToast('❌ الرجاء ملء جميع الحقول', 'error');
        return;
    }

    if (roomNumber < 1) {
        showToast('❌ رقم الغرفة يجب أن يكون أكبر من 0', 'error');
        return;
    }

    if (roomPrice < 1) {
        showToast('❌ السعر يجب أن يكون أكبر من 0', 'error');
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
            
            showToast('✅ تم تعديل الغرفة بنجاح!', 'success');
            editingRoomNumber = null;
            document.querySelector('button[type="submit"]').textContent = '➕ إضافة غرفة';
        } else {
            // التحقق من عدم وجود الغرفة
            const snapshot = await roomsRef.child(roomNumber.toString()).once('value');
            if (snapshot.exists()) {
                showToast('❌ رقم الغرفة موجود بالفعل!', 'error');
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
            
            showToast('✅ تم إضافة الغرفة بنجاح!', 'success');
        }

        // إعادة تعيين النموذج
        this.reset();
        
        // إلغاء وضع التعديل
        editingRoomNumber = null;
        document.getElementById('roomNumber').disabled = false;
    } catch (error) {
        console.error('❌ خطأ في حفظ الغرفة:', error);
        showToast('❌ حدث خطأ أثناء حفظ الغرفة: ' + error.message, 'error');
    }
    });
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
            
            showToast('✅ تم حذف الغرفة بنجاح!', 'success');
        } catch (error) {
            console.error('❌ خطأ في حذف الغرفة:', error);
            showToast('❌ حدث خطأ أثناء حذف الغرفة: ' + error.message, 'error');
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

// تهيئة Firebase والاستماع للتحديثات
function initializeAdmin() {
    console.log('🔄 جاري الاتصال بـ Firebase...');
    
    // التحقق من اتصال Firebase
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase غير محمل!');
        showToast('❌ خطأ: لم يتم تحميل Firebase. تحقق من اتصال الإنترنت.', 'error');
        return;
    }
    
    if (typeof roomsRef === 'undefined') {
        console.error('❌ لم يتم تهيئة Firebase بشكل صحيح!');
        showToast('❌ خطأ: يجب إعداد Firebase أولاً. راجع ملف FIREBASE-SETUP.md', 'error');
        return;
    }
    
    // بدء الاستماع للتحديثات
    listenToRooms();
    
    // تحديث شارة الإشعارات
    updateNotificationBadge();
    
    console.log('✅ لوحة التحكم جاهزة - Firebase Realtime Database');
}

// تحديث شارة الإشعارات
function updateNotificationBadge() {
    notificationsRef.on('value', (snapshot) => {
        const notifications = snapshot.val();
        let unreadCount = 0;
        
        if (notifications) {
            Object.values(notifications).forEach(notification => {
                if (!notification.read) {
                    unreadCount++;
                }
            });
        }
        
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
    });
}

// تهيئة عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
    initializeAdmin();
}
