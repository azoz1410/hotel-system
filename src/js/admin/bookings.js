// متغيرات عامة
let allBookings = [];
let allRooms = [];
let currentFilter = 'all';

// ترجمة الحالات
const statusTranslations = {
    pending: 'معلقة',
    confirmed: 'مؤكدة',
    completed: 'مكتملة',
    cancelled: 'ملغاة'
};

// تحميل الغرف المتاحة
function loadAvailableRooms() {
    roomsRef.on('value', (snapshot) => {
        allRooms = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                allRooms.push(data[key]);
            });
        }

        // ترتيب الغرف
        allRooms.sort((a, b) => a.number - b.number);

        // تحديث قائمة الغرف في النموذج
        updateRoomSelect();
    });
}

// تحديث قائمة الغرف في النموذج
function updateRoomSelect() {
    const roomSelect = document.getElementById('roomNumber');
    roomSelect.innerHTML = '<option value="">اختر الغرفة</option>';

    // عرض الغرف المتاحة فقط
    allRooms.forEach(room => {
        if (room.status === 'available') {
            const option = document.createElement('option');
            option.value = room.number;
            option.textContent = `غرفة ${room.number} - ${room.type} (${room.price} ريال/ليلة)`;
            option.dataset.price = room.price;
            roomSelect.appendChild(option);
        }
    });
}

// حساب السعر الإجمالي
function calculateTotalPrice() {
    const roomSelect = document.getElementById('roomNumber');
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const totalPriceInput = document.getElementById('totalPrice');

    if (roomSelect.value && checkIn && checkOut) {
        const selectedOption = roomSelect.options[roomSelect.selectedIndex];
        const pricePerNight = parseInt(selectedOption.dataset.price);
        
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

        if (nights > 0) {
            const total = pricePerNight * nights;
            totalPriceInput.value = total;
        } else {
            totalPriceInput.value = '';
            showToast('❌ تاريخ الخروج يجب أن يكون بعد تاريخ الدخول', 'error');
        }
    }
}

// الاستماع للتحديثات في الحجوزات
function loadBookings() {
    bookingsRef.on('value', (snapshot) => {
        allBookings = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                allBookings.push({ id: key, ...data[key] });
            });
        }

        // ترتيب حسب التاريخ (الأحدث أولاً)
        allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        displayBookings();
        updateStats();
    });
}

// عرض الحجوزات
function displayBookings() {
    const tbody = document.getElementById('bookingsTableBody');
    tbody.innerHTML = '';

    let filteredBookings = allBookings;
    if (currentFilter !== 'all') {
        filteredBookings = allBookings.filter(b => b.status === currentFilter);
    }

    if (filteredBookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 60px;">
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>لا توجد حجوزات</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    filteredBookings.forEach(booking => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${booking.roomNumber}</strong></td>
            <td>${booking.customerName}</td>
            <td>${booking.customerPhone}</td>
            <td>${formatDate(booking.checkIn)}</td>
            <td>${formatDate(booking.checkOut)}</td>
            <td><strong>${booking.totalPrice} ريال</strong></td>
            <td><span class="status-badge status-${booking.status}">${statusTranslations[booking.status]}</span></td>
            <td>
                <div class="action-buttons">
                    ${booking.status === 'pending' ? `
                        <button class="action-btn btn-confirm" onclick="confirmBooking('${booking.id}')">✅</button>
                    ` : ''}
                    ${booking.status !== 'cancelled' && booking.status !== 'completed' ? `
                        <button class="action-btn btn-cancel" onclick="cancelBooking('${booking.id}')">❌</button>
                    ` : ''}
                    <button class="action-btn btn-delete" onclick="deleteBooking('${booking.id}')">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// تحديث الإحصائيات
function updateStats() {
    const total = allBookings.length;
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const confirmed = allBookings.filter(b => b.status === 'confirmed').length;
    const revenue = allBookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + b.totalPrice, 0);

    document.getElementById('totalBookings').textContent = total;
    document.getElementById('pendingBookings').textContent = pending;
    document.getElementById('confirmedBookings').textContent = confirmed;
    document.getElementById('totalRevenue').textContent = revenue.toLocaleString();
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// إضافة حجز جديد
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const roomNumber = parseInt(document.getElementById('roomNumber').value);
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const totalPrice = parseInt(document.getElementById('totalPrice').value);

    // التحقق من التواريخ
    if (new Date(checkOut) <= new Date(checkIn)) {
        showToast('❌ تاريخ الخروج يجب أن يكون بعد تاريخ الدخول', 'error');
        return;
    }

    // بيانات الحجز
    const bookingData = {
        roomNumber,
        customerName,
        customerPhone,
        customerEmail: customerEmail || '',
        checkIn,
        checkOut,
        totalPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: firebase.auth().currentUser?.email || 'guest'
    };

    try {
        // إضافة الحجز
        await bookingsRef.push(bookingData);

        // تحديث حالة الغرفة
        await roomsRef.child(roomNumber.toString()).update({ status: 'occupied' });

        // إضافة العميل إلى قاعدة البيانات
        if (customerPhone) {
            await customersRef.child(customerPhone.replace(/\D/g, '')).set({
                name: customerName,
                phone: customerPhone,
                email: customerEmail || '',
                lastBooking: new Date().toISOString()
            });
        }

        // إضافة سجل
        await logsRef.push({
            action: 'booking_created',
            room: roomNumber,
            timestamp: new Date().toISOString(),
            userId: firebase.auth().currentUser?.uid || 'guest',
            details: `تم إنشاء حجز جديد للغرفة ${roomNumber} - ${customerName}`
        });

        showToast('✅ تم إضافة الحجز بنجاح!', 'success');
        document.getElementById('bookingForm').reset();

    } catch (error) {
        console.error('خطأ في إضافة الحجز:', error);
        showToast('❌ حدث خطأ في إضافة الحجز: ' + error.message, 'error');
    }
});

// تأكيد الحجز
async function confirmBooking(bookingId) {
    if (confirm('هل تريد تأكيد هذا الحجز؟')) {
        try {
            await bookingsRef.child(bookingId).update({ 
                status: 'confirmed',
                confirmedAt: new Date().toISOString(),
                confirmedBy: firebase.auth().currentUser?.email || 'admin'
            });

            await logsRef.push({
                action: 'booking_confirmed',
                bookingId,
                timestamp: new Date().toISOString(),
                userId: firebase.auth().currentUser?.uid || 'admin',
                details: `تم تأكيد الحجز ${bookingId}`
            });

            showToast('✅ تم تأكيد الحجز بنجاح!', 'success');
        } catch (error) {
            console.error('خطأ في تأكيد الحجز:', error);
            showToast('❌ حدث خطأ في تأكيد الحجز', 'error');
        }
    }
}

// إلغاء الحجز
async function cancelBooking(bookingId) {
    if (confirm('هل تريد إلغاء هذا الحجز؟')) {
        try {
            const booking = allBookings.find(b => b.id === bookingId);
            
            await bookingsRef.child(bookingId).update({ 
                status: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancelledBy: firebase.auth().currentUser?.email || 'admin'
            });

            // تحرير الغرفة
            if (booking) {
                await roomsRef.child(booking.roomNumber.toString()).update({ status: 'available' });
            }

            await logsRef.push({
                action: 'booking_cancelled',
                bookingId,
                timestamp: new Date().toISOString(),
                userId: firebase.auth().currentUser?.uid || 'admin',
                details: `تم إلغاء الحجز ${bookingId}`
            });

            showToast('✅ تم إلغاء الحجز بنجاح!', 'success');
        } catch (error) {
            console.error('خطأ في إلغاء الحجز:', error);
            showToast('❌ حدث خطأ في إلغاء الحجز', 'error');
        }
    }
}

// حذف الحجز
async function deleteBooking(bookingId) {
    if (confirm('هل تريد حذف هذا الحجز نهائياً؟')) {
        try {
            const booking = allBookings.find(b => b.id === bookingId);
            
            await bookingsRef.child(bookingId).remove();

            // تحرير الغرفة إذا كان الحجز نشط
            if (booking && booking.status !== 'cancelled' && booking.status !== 'completed') {
                await roomsRef.child(booking.roomNumber.toString()).update({ status: 'available' });
            }

            await logsRef.push({
                action: 'booking_deleted',
                bookingId,
                timestamp: new Date().toISOString(),
                userId: firebase.auth().currentUser?.uid || 'admin',
                details: `تم حذف الحجز ${bookingId}`
            });

            showToast('✅ تم حذف الحجز بنجاح!', 'success');
        } catch (error) {
            console.error('خطأ في حذف الحجز:', error);
            showToast('❌ حدث خطأ في حذف الحجز', 'error');
        }
    }
}

// التصفية
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.status;
        displayBookings();
    });
});

// حساب السعر عند تغيير التواريخ أو الغرفة
document.getElementById('roomNumber').addEventListener('change', calculateTotalPrice);
document.getElementById('checkIn').addEventListener('change', calculateTotalPrice);
document.getElementById('checkOut').addEventListener('change', calculateTotalPrice);

// تعيين الحد الأدنى للتاريخ (اليوم)
const today = new Date().toISOString().split('T')[0];
document.getElementById('checkIn').min = today;
document.getElementById('checkOut').min = today;

// التهيئة
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 جاري تحميل نظام الحجوزات...');
    loadAvailableRooms();
    loadBookings();
    console.log('✅ نظام الحجوزات جاهز');
});
