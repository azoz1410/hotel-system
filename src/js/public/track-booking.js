let currentBooking = null;
let currentBookingKey = null;

// ترجمة الحالات
const statusTranslations = {
    pending: 'قيد المراجعة',
    confirmed: 'مؤكد',
    'checkout-requested': 'طلب خروج',
    completed: 'مكتمل',
    cancelled: 'ملغى'
};

// البحث عن الحجز
document.getElementById('trackForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bookingId = document.getElementById('bookingId').value.trim().toUpperCase();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const trackBtn = document.getElementById('trackBtn');
    
    trackBtn.disabled = true;
    trackBtn.textContent = '🔄 جاري البحث...';
    
    try {
        // البحث في قاعدة البيانات
        const snapshot = await bookingsRef.once('value');
        const bookings = snapshot.val();
        
        if (!bookings) {
            showToast('❌ لم يتم العثور على الحجز', 'error');
            trackBtn.disabled = false;
            trackBtn.textContent = '🔎 البحث عن الحجز';
            return;
        }
        
        // البحث عن الحجز المطابق
        let foundBooking = null;
        let foundKey = null;
        
        Object.keys(bookings).forEach(key => {
            const booking = bookings[key];
            const shortId = key.substring(0, 8).toUpperCase();
            
            if (shortId === bookingId && booking.customerPhone === phoneNumber) {
                foundBooking = booking;
                foundKey = key;
            }
        });
        
        if (!foundBooking) {
            showToast('❌ رقم الحجز أو رقم الجوال غير صحيح', 'error');
            trackBtn.disabled = false;
            trackBtn.textContent = '🔎 البحث عن الحجز';
            return;
        }
        
        // عرض تفاصيل الحجز
        currentBooking = foundBooking;
        currentBookingKey = foundKey;
        displayBookingDetails(foundBooking, foundKey);
        
        trackBtn.disabled = false;
        trackBtn.textContent = '🔎 البحث عن الحجز';
        
    } catch (error) {
        console.error('خطأ في البحث:', error);
        console.error('تفاصيل الخطأ:', error.message);
        showToast(`❌ حدث خطأ أثناء البحث: ${error.message}`, 'error');
        trackBtn.disabled = false;
        trackBtn.textContent = '🔎 البحث عن الحجز';
    }
});

// عرض تفاصيل الحجز
function displayBookingDetails(booking, bookingKey) {
    const detailsDiv = document.getElementById('bookingDetails');
    const statusSpan = document.getElementById('bookingStatus');
    const detailsContent = document.getElementById('detailsContent');
    const actionButtons = document.getElementById('actionButtons');
    
    // تحديث الحالة
    const status = booking.status || 'pending';
    statusSpan.textContent = statusTranslations[status];
    statusSpan.className = `booking-status status-${status}`;
    
    // حساب عدد الليالي
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    // عرض التفاصيل
    detailsContent.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">رقم الحجز:</span>
            <span class="detail-value">${bookingKey.substring(0, 8).toUpperCase()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">رقم الغرفة:</span>
            <span class="detail-value">${booking.roomNumber}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">الاسم:</span>
            <span class="detail-value">${booking.customerName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">رقم الجوال:</span>
            <span class="detail-value">${booking.customerPhone}</span>
        </div>
        ${booking.nationalId ? `
        <div class="detail-row">
            <span class="detail-label">رقم الهوية:</span>
            <span class="detail-value">${booking.nationalId}</span>
        </div>
        ` : ''}
        <div class="detail-row">
            <span class="detail-label">تاريخ الدخول:</span>
            <span class="detail-value">${formatDate(booking.checkIn)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">تاريخ الخروج:</span>
            <span class="detail-value">${formatDate(booking.checkOut)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">عدد الليالي:</span>
            <span class="detail-value">${nights} ليلة</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">المبلغ الإجمالي:</span>
            <span class="detail-value">${booking.totalPrice} ريال</span>
        </div>
        ${booking.notes ? `
        <div class="detail-row">
            <span class="detail-label">ملاحظات:</span>
            <span class="detail-value">${booking.notes}</span>
        </div>
        ` : ''}
        ${booking.checkoutRequestDate ? `
        <div class="info-message">
            ℹ️ تم تقديم طلب خروج بتاريخ ${formatDate(booking.checkoutRequestDate)}
            <br>في انتظار موافقة الإدارة
        </div>
        ` : ''}
    `;
    
    // عرض الأزرار حسب الحالة
    let buttonsHTML = '';
    
    if (status === 'pending' || status === 'confirmed') {
        buttonsHTML += `
            <button onclick="showEditForm()" class="action-btn btn-edit">
                ✏️ تعديل الحجز
            </button>
        `;
    }
    
    if (status === 'confirmed' && !booking.checkoutRequestDate) {
        buttonsHTML += `
            <button onclick="requestCheckout()" class="action-btn btn-checkout">
                🚪 طلب الخروج
            </button>
        `;
    }
    
    if (status === 'pending') {
        buttonsHTML += `
            <button onclick="cancelBooking()" class="action-btn btn-cancel">
                ❌ إلغاء الحجز
            </button>
        `;
    }
    
    buttonsHTML += `
        <button onclick="hideBookingDetails()" class="action-btn btn-back">
            ← العودة
        </button>
    `;
    
    actionButtons.innerHTML = buttonsHTML;
    
    // إظهار التفاصيل
    detailsDiv.classList.add('show');
    detailsDiv.scrollIntoView({ behavior: 'smooth' });
}

// إخفاء التفاصيل
function hideBookingDetails() {
    document.getElementById('bookingDetails').classList.remove('show');
    document.getElementById('editForm').classList.remove('show');
    document.getElementById('trackForm').reset();
}

// إظهار نموذج التعديل
function showEditForm() {
    const editForm = document.getElementById('editForm');
    
    // ملء البيانات الحالية
    document.getElementById('editCheckIn').value = currentBooking.checkIn;
    document.getElementById('editCheckOut').value = currentBooking.checkOut;
    document.getElementById('editNotes').value = currentBooking.notes || '';
    
    // تعيين الحد الأدنى للتاريخ
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('editCheckIn').min = today;
    document.getElementById('editCheckOut').min = today;
    
    editForm.classList.add('show');
    editForm.scrollIntoView({ behavior: 'smooth' });
}

// إلغاء التعديل
function cancelEdit() {
    document.getElementById('editForm').classList.remove('show');
}

// حفظ التعديل
async function saveEdit() {
    const newCheckIn = document.getElementById('editCheckIn').value;
    const newCheckOut = document.getElementById('editCheckOut').value;
    const newNotes = document.getElementById('editNotes').value;
    
    // التحقق من التواريخ
    if (new Date(newCheckOut) <= new Date(newCheckIn)) {
        showToast('❌ تاريخ الخروج يجب أن يكون بعد تاريخ الدخول', 'error');
        return;
    }
    
    // التحقق من وجود تغيير
    if (newCheckIn === currentBooking.checkIn && 
        newCheckOut === currentBooking.checkOut && 
        newNotes === (currentBooking.notes || '')) {
        showToast('ℹ️ لم يتم إجراء أي تعديلات', 'info');
        return;
    }
    
    try {
        // حساب السعر الجديد
        const checkInDate = new Date(newCheckIn);
        const checkOutDate = new Date(newCheckOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        
        // الحصول على سعر الغرفة
        const roomSnapshot = await roomsRef.child(currentBooking.roomNumber.toString()).once('value');
        const room = roomSnapshot.val();
        const newTotalPrice = room ? room.price * nights : currentBooking.totalPrice;
        
        // تحديث الحجز
        await bookingsRef.child(currentBookingKey).update({
            checkIn: newCheckIn,
            checkOut: newCheckOut,
            notes: newNotes,
            totalPrice: newTotalPrice,
            nights: nights,
            lastModified: new Date().toISOString(),
            modifiedBy: 'customer'
        });
        
        // إضافة إشعار للإدارة
        await notificationsRef.push({
            type: 'booking_modified',
            bookingId: currentBookingKey,
            roomNumber: currentBooking.roomNumber,
            customerName: currentBooking.customerName,
            message: `تم تعديل الحجز ${currentBookingKey.substring(0, 8).toUpperCase()} من قبل العميل`,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // إضافة سجل
        await logsRef.push({
            action: 'booking_modified_by_customer',
            bookingId: currentBookingKey,
            room: currentBooking.roomNumber,
            timestamp: new Date().toISOString(),
            details: `تعديل الحجز من قبل ${currentBooking.customerName}`
        });
        
        showToast('✅ تم تعديل الحجز بنجاح', 'success');
        
        // تحديث البيانات المحلية
        currentBooking.checkIn = newCheckIn;
        currentBooking.checkOut = newCheckOut;
        currentBooking.notes = newNotes;
        currentBooking.totalPrice = newTotalPrice;
        
        // إعادة عرض التفاصيل
        displayBookingDetails(currentBooking, currentBookingKey);
        cancelEdit();
        
    } catch (error) {
        console.error('خطأ في التعديل:', error);
        showToast('❌ حدث خطأ أثناء التعديل', 'error');
    }
}

// طلب الخروج
async function requestCheckout() {
    if (!confirm('هل أنت متأكد من طلب الخروج؟\nسيتم إرسال طلبك للإدارة للموافقة عليه.')) {
        return;
    }
    
    try {
        // تحديث الحجز
        await bookingsRef.child(currentBookingKey).update({
            status: 'checkout-requested',
            checkoutRequestDate: new Date().toISOString()
        });
        
        // إضافة إشعار للإدارة
        await notificationsRef.push({
            type: 'checkout_requested',
            bookingId: currentBookingKey,
            roomNumber: currentBooking.roomNumber,
            customerName: currentBooking.customerName,
            message: `طلب خروج من العميل ${currentBooking.customerName} - غرفة ${currentBooking.roomNumber}`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'high'
        });
        
        // إضافة سجل
        await logsRef.push({
            action: 'checkout_requested',
            bookingId: currentBookingKey,
            room: currentBooking.roomNumber,
            timestamp: new Date().toISOString(),
            details: `طلب خروج من ${currentBooking.customerName}`
        });
        
        showToast('✅ تم إرسال طلب الخروج بنجاح', 'success');
        
        // تحديث البيانات المحلية
        currentBooking.status = 'checkout-requested';
        currentBooking.checkoutRequestDate = new Date().toISOString();
        
        // إعادة عرض التفاصيل
        displayBookingDetails(currentBooking, currentBookingKey);
        
    } catch (error) {
        console.error('خطأ في طلب الخروج:', error);
        showToast('❌ حدث خطأ أثناء طلب الخروج', 'error');
    }
}

// إلغاء الحجز
async function cancelBooking() {
    if (!confirm('هل أنت متأكد من إلغاء الحجز؟\nلن تتمكن من التراجع عن هذا الإجراء.')) {
        return;
    }
    
    try {
        // تحديث حالة الحجز
        await bookingsRef.child(currentBookingKey).update({
            status: 'cancelled',
            cancelledDate: new Date().toISOString(),
            cancelledBy: 'customer'
        });
        
        // تحديث حالة الغرفة
        if (currentBooking.status === 'confirmed') {
            await roomsRef.child(currentBooking.roomNumber.toString()).update({
                status: 'available'
            });
        }
        
        // إضافة إشعار للإدارة
        await notificationsRef.push({
            type: 'booking_cancelled',
            bookingId: currentBookingKey,
            roomNumber: currentBooking.roomNumber,
            customerName: currentBooking.customerName,
            message: `تم إلغاء الحجز ${currentBookingKey.substring(0, 8).toUpperCase()} من قبل العميل`,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // إضافة سجل
        await logsRef.push({
            action: 'booking_cancelled_by_customer',
            bookingId: currentBookingKey,
            room: currentBooking.roomNumber,
            timestamp: new Date().toISOString(),
            details: `إلغاء الحجز من قبل ${currentBooking.customerName}`
        });
        
        showToast('✅ تم إلغاء الحجز بنجاح', 'success');
        
        // تحديث البيانات المحلية
        currentBooking.status = 'cancelled';
        
        // إعادة عرض التفاصيل
        displayBookingDetails(currentBooking, currentBookingKey);
        
    } catch (error) {
        console.error('خطأ في الإلغاء:', error);
        showToast('❌ حدث خطأ أثناء إلغاء الحجز', 'error');
    }
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Toast Notifications
function showToast(message, type = 'info') {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) {
        oldToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 12px;
                color: white;
                font-weight: 600;
                font-size: 0.95em;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                animation: slideInRight 0.4s ease, fadeOut 0.4s ease 2.6s;
                max-width: 400px;
            }
            .toast-success { background: linear-gradient(135deg, #10ac84, #1dd1a1); }
            .toast-error { background: linear-gradient(135deg, #ee5a6f, #f368e0); }
            .toast-info { background: linear-gradient(135deg, #667eea, #764ba2); }
            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                to { opacity: 0; transform: translateX(400px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
