// بيانات الحجز
let bookingData = {
    selectedRoom: null,
    checkIn: null,
    checkOut: null,
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    nationalId: null,
    notes: null,
    totalPrice: 0,
    nights: 0
};

let allRooms = [];
let currentStep = 1;

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

        // عرض الغرف
        displayRooms();
        
        // تحديد الغرفة من URL إذا كانت موجودة
        const urlParams = new URLSearchParams(window.location.search);
        const roomNumber = urlParams.get('room');
        if (roomNumber) {
            const room = allRooms.find(r => r.number == roomNumber && r.status === 'available');
            if (room) {
                setTimeout(() => selectRoom(room), 500);
            }
        }
    });
}

// عرض الغرف
function displayRooms() {
    const roomsList = document.getElementById('roomsList');
    roomsList.innerHTML = '';

    if (allRooms.length === 0) {
        roomsList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">لا توجد غرف متاحة حالياً</p>';
        return;
    }

    allRooms.forEach(room => {
        const isAvailable = room.status === 'available';
        const roomCard = document.createElement('div');
        roomCard.className = `room-option ${!isAvailable ? 'unavailable' : ''}`;
        
        if (isAvailable) {
            roomCard.onclick = () => selectRoom(room);
        }

        roomCard.innerHTML = `
            <div class="room-number">غرفة ${room.number}</div>
            <div class="room-type">${room.type}</div>
            <div class="room-price">${room.price} ريال/ليلة</div>
            ${!isAvailable ? '<div style="color: #ee5a6f; font-size: 0.9em; margin-top: 10px;">غير متاحة</div>' : ''}
        `;

        roomsList.appendChild(roomCard);
    });
}

// اختيار الغرفة
function selectRoom(room) {
    // إزالة التحديد من جميع الغرف
    document.querySelectorAll('.room-option').forEach(el => {
        el.classList.remove('selected');
    });

    // تحديد الغرفة المختارة
    const roomElement = Array.from(document.querySelectorAll('.room-option')).find(
        el => el.textContent.includes(`غرفة ${room.number}`)
    );
    
    if (roomElement) {
        roomElement.classList.add('selected');
    }

    bookingData.selectedRoom = room;
    document.getElementById('step1Next').disabled = false;
}

// الانتقال للخطوة التالية
function nextStep(step) {
    // التحقق من البيانات المطلوبة
    if (step === 2 && !bookingData.selectedRoom) {
        showToast('الرجاء اختيار غرفة أولاً', 'error');
        return;
    }

    if (step === 3) {
        const checkIn = document.getElementById('checkIn').value;
        const checkOut = document.getElementById('checkOut').value;

        if (!checkIn || !checkOut) {
            showToast('الرجاء اختيار تواريخ الدخول والخروج', 'error');
            return;
        }

        if (new Date(checkOut) <= new Date(checkIn)) {
            showToast('تاريخ الخروج يجب أن يكون بعد تاريخ الدخول', 'error');
            return;
        }

        bookingData.checkIn = checkIn;
        bookingData.checkOut = checkOut;
    }

    if (step === 4) {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const nationalId = document.getElementById('nationalId').value.trim();

        if (!name || !phone || !nationalId) {
            showToast('الرجاء ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        if (!/^05[0-9]{8}$/.test(phone)) {
            showToast('رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام', 'error');
            return;
        }

        if (!/^[12][0-9]{9}$/.test(nationalId)) {
            showToast('رقم الإقامة/الهوية يجب أن يبدأ بـ 1 أو 2 ويتكون من 10 أرقام', 'error');
            return;
        }

        bookingData.customerName = name;
        bookingData.customerPhone = phone;
        bookingData.nationalId = nationalId;
        bookingData.customerEmail = document.getElementById('customerEmail').value.trim();
        bookingData.notes = document.getElementById('notes').value.trim();

        // عرض الملخص النهائي
        displayFinalSummary();
    }

    // تحديث الخطوات
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('step' + step).classList.add('active');

    document.querySelectorAll('.step').forEach(s => {
        const stepNum = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        
        if (stepNum === step) {
            s.classList.add('active');
        } else if (stepNum < step) {
            s.classList.add('completed');
        }
    });

    currentStep = step;

    // التمرير للأعلى
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// الرجوع للخطوة السابقة
function prevStep(step) {
    nextStep(step);
}

// حساب السعر عند تغيير التواريخ
document.addEventListener('DOMContentLoaded', () => {
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');

    // تعيين الحد الأدنى للتاريخ (اليوم)
    const today = new Date().toISOString().split('T')[0];
    checkInInput.min = today;
    checkOutInput.min = today;

    function calculatePrice() {
        const checkIn = checkInInput.value;
        const checkOut = checkOutInput.value;

        if (checkIn && checkOut && bookingData.selectedRoom) {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

            if (nights > 0) {
                bookingData.nights = nights;
                bookingData.totalPrice = bookingData.selectedRoom.price * nights;

                document.getElementById('nightsCount').textContent = nights + ' ليلة';
                document.getElementById('totalPreview').textContent = bookingData.totalPrice.toLocaleString() + ' ریال';
                const pricePreview = document.getElementById('pricePreview');
                pricePreview.classList.add('show');
                document.getElementById('step2Next').disabled = false;
            } else {
                document.getElementById('step2Next').disabled = true;
            }
        }
    }

    checkInInput.addEventListener('change', calculatePrice);
    checkOutInput.addEventListener('change', calculatePrice);

    // التحقق من حقول الخطوة 3
    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const nationalIdInput = document.getElementById('nationalId');

    function validateStep3() {
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const nationalId = nationalIdInput.value.trim();
        const isValid = name && phone && nationalId && 
                       /^05[0-9]{8}$/.test(phone) && 
                       /^[12][0-9]{9}$/.test(nationalId);
        document.getElementById('step3Next').disabled = !isValid;
    }

    nameInput.addEventListener('input', validateStep3);
    phoneInput.addEventListener('input', validateStep3);
    nationalIdInput.addEventListener('input', validateStep3);

    // تحميل الغرف
    loadAvailableRooms();
});

// عرض الملخص النهائي
function displayFinalSummary() {
    const summary = document.getElementById('finalSummary');
    const room = bookingData.selectedRoom;

    summary.innerHTML = `
        <div class="summary-item">
            <span class="summary-label">الغرفة:</span>
            <span class="summary-value">غرفة ${room.number} - ${room.type}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">تاريخ الدخول:</span>
            <span class="summary-value">${formatDate(bookingData.checkIn)}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">تاريخ الخروج:</span>
            <span class="summary-value">${formatDate(bookingData.checkOut)}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">عدد الليالي:</span>
            <span class="summary-value">${bookingData.nights} ليلة</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">الاسم:</span>
            <span class="summary-value">${bookingData.customerName}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">رقم الإقامة/الهوية:</span>
            <span class="summary-value">${bookingData.nationalId}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">الجوال:</span>
            <span class="summary-value">${bookingData.customerPhone}</span>
        </div>
        ${bookingData.customerEmail ? `
        <div class="summary-item">
            <span class="summary-label">البريد:</span>
            <span class="summary-value">${bookingData.customerEmail}</span>
        </div>
        ` : ''}
        ${bookingData.notes ? `
        <div class="summary-item">
            <span class="summary-label">ملاحظات:</span>
            <span class="summary-value">${bookingData.notes}</span>
        </div>
        ` : ''}
        <div class="summary-item">
            <span class="summary-label">الإجمالي:</span>
            <span class="summary-value">${bookingData.totalPrice.toLocaleString()} ريال</span>
        </div>
    `;
}

// تأكيد الحجز
async function confirmBooking() {
    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = '⏳ جاري الحجز...';

    try {
        // إنشاء بيانات الحجز
        const booking = {
            roomNumber: bookingData.selectedRoom.number,
            customerName: bookingData.customerName,
            customerPhone: bookingData.customerPhone,
            customerEmail: bookingData.customerEmail || '',
            nationalId: bookingData.nationalId,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            totalPrice: bookingData.totalPrice,
            nights: bookingData.nights,
            notes: bookingData.notes || '',
            status: 'pending',
            source: 'public',
            createdAt: new Date().toISOString()
        };

        // حفظ الحجز في Firebase
        const bookingRef = await bookingsRef.push(booking);
        const bookingId = bookingRef.key;

        // تحديث حالة الغرفة إلى محجوزة
        await roomsRef.child(bookingData.selectedRoom.number.toString()).update({ 
            status: 'occupied' 
        });
        
        // حفظ معلومات العميل
        if (bookingData.customerPhone) {
            await customersRef.child(bookingData.customerPhone.replace(/\D/g, '')).set({
                name: bookingData.customerName,
                phone: bookingData.customerPhone,
                email: bookingData.customerEmail || '',
                lastBooking: new Date().toISOString()
            });
        }

        // إضافة سجل
        await logsRef.push({
            action: 'public_booking_created',
            room: bookingData.selectedRoom.number,
            timestamp: new Date().toISOString(),
            details: `حجز عام جديد - ${bookingData.customerName} - ${bookingData.customerPhone}`
        });

        // إضافة إشعار للإدارة
        await notificationsRef.push({
            type: 'booking_created',
            bookingId: bookingId,
            roomNumber: bookingData.selectedRoom.number,
            customerName: bookingData.customerName,
            message: `حجز جديد من ${bookingData.customerName} - غرفة ${bookingData.selectedRoom.number}`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'normal'
        });

        // عرض رسالة النجاح
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.classList.add('show');
        }
        
        // عرض رقم الحجز المرجعي
        const bookingRefEl = document.getElementById('bookingRef');
        if (bookingRefEl) {
            bookingRefEl.textContent = bookingId.substring(0, 8).toUpperCase();
        }
        
        // عرض رقم الهاتف المؤكد
        const confirmedPhoneEl = document.getElementById('confirmedPhone');
        if (confirmedPhoneEl) {
            confirmedPhoneEl.textContent = bookingData.customerPhone;
        }

        // تنبيه صوتي (اختياري)
        showToast('✅ تم الحجز بنجاح! الغرفة محجوزة الآن', 'success');

    } catch (error) {
        console.error('خطأ في الحجز:', error);
        console.error('تفاصيل الخطأ:', error.message);
        showToast(`❌ حدث خطأ أثناء الحجز: ${error.message}`, 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = '✅ تأكيد الحجز';
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
