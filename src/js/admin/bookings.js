// متغيرات عامة
let allBookings = [];
let allRooms = [];
let currentFilter = 'all';

// ترجمة الحالات
const statusTranslations = {
    pending: 'معلقة',
    confirmed: 'مؤكدة',
    'checkout-requested': 'طلب خروج',
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
                        <button class="action-btn btn-confirm" onclick="confirmBooking('${booking.id}')" title="تأكيد الحجز">✅</button>
                    ` : ''}
                    ${booking.status === 'checkout-requested' ? `
                        <button class="action-btn btn-confirm" onclick="approveCheckout('${booking.id}')" title="الموافقة على الخروج">✅ خروج</button>
                    ` : ''}
                    ${(booking.status === 'confirmed' || booking.status === 'completed') ? `
                        <button class="action-btn btn-info" onclick="generateInvoice('${booking.id}')" title="إصدار فاتورة">🧾</button>
                        <button class="action-btn btn-info" onclick="generateContract('${booking.id}')" title="إصدار عقد">📄</button>
                    ` : ''}
                    ${booking.status !== 'cancelled' && booking.status !== 'completed' ? `
                        <button class="action-btn btn-cancel" onclick="cancelBooking('${booking.id}')" title="إلغاء الحجز">❌</button>
                    ` : ''}
                    <button class="action-btn btn-delete" onclick="deleteBooking('${booking.id}')" title="حذف">🗑️</button>
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
    const nationalId = document.getElementById('nationalId').value;
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
        nationalId,
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
window.confirmBooking = async function(bookingId) {
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
};

// إلغاء الحجز
window.cancelBooking = async function(bookingId) {
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
};

// حذف الحجز
window.deleteBooking = async function(bookingId) {
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
};

// التصفية
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.status;
        displayBookings();
    });
});

// الموافقة على طلب الخروج
window.approveCheckout = async function(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) {
        showToast('❌ لم يتم العثور على الحجز', 'error');
        return;
    }
    
    if (!confirm(`هل أنت متأكد من الموافقة على خروج ${booking.customerName} من غرفة ${booking.roomNumber}؟`)) {
        return;
    }
    
    try {
        // تحديث حالة الحجز إلى مكتمل
        await bookingsRef.child(bookingId).update({
            status: 'completed',
            checkoutApprovedDate: new Date().toISOString(),
            checkoutApprovedBy: firebase.auth().currentUser?.email || 'admin'
        });
        
        // تحديث حالة الغرفة إلى متاحة
        await roomsRef.child(booking.roomNumber.toString()).update({
            status: 'available'
        });
        
        // إضافة سجل
        await logsRef.push({
            action: 'checkout_approved',
            bookingId: bookingId,
            room: booking.roomNumber,
            timestamp: new Date().toISOString(),
            userId: firebase.auth().currentUser?.uid || 'admin',
            details: `تمت الموافقة على خروج ${booking.customerName} من غرفة ${booking.roomNumber}`
        });
        
        // حذف الإشعار المتعلق بطلب الخروج
        const notifSnapshot = await notificationsRef.orderByChild('bookingId').equalTo(bookingId).once('value');
        if (notifSnapshot.exists()) {
            const notifications = notifSnapshot.val();
            Object.keys(notifications).forEach(async (key) => {
                if (notifications[key].type === 'checkout_requested') {
                    await notificationsRef.child(key).remove();
                }
            });
        }
        
        showToast('✅ تمت الموافقة على الخروج وتحرير الغرفة', 'success');
        
    } catch (error) {
        console.error('خطأ في الموافقة على الخروج:', error);
        showToast('❌ حدث خطأ أثناء الموافقة على الخروج', 'error');
    }
};

// إصدار فاتورة
window.generateInvoice = function(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) {
        showToast('❌ لم يتم العثور على الحجز', 'error');
        return;
    }

    const room = allRooms.find(r => r.number === booking.roomNumber);
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const invoiceNumber = `INV-${booking.id.substring(0, 8).toUpperCase()}`;
    const invoiceDate = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

    // إنشاء نافذة الفاتورة
    const invoiceWindow = window.open('', '_blank', 'width=800,height=900');
    invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>فاتورة - ${invoiceNumber}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 40px;
                    background: #f5f5f5;
                }
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #667eea;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #667eea;
                    font-size: 32px;
                    margin-bottom: 10px;
                }
                .header .invoice-number {
                    color: #666;
                    font-size: 18px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                }
                .info-section h3 {
                    color: #667eea;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                .info-section p {
                    color: #333;
                    line-height: 1.8;
                    margin: 5px 0;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 30px 0;
                }
                .items-table th {
                    background: #667eea;
                    color: white;
                    padding: 12px;
                    text-align: right;
                    font-weight: 600;
                }
                .items-table td {
                    padding: 12px;
                    border-bottom: 1px solid #ddd;
                    color: #333;
                }
                .total-section {
                    text-align: left;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 2px solid #667eea;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    font-size: 18px;
                }
                .total-row.grand-total {
                    font-size: 24px;
                    font-weight: bold;
                    color: #667eea;
                }
                .footer {
                    margin-top: 50px;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
                .print-btn {
                    display: block;
                    margin: 20px auto;
                    padding: 12px 30px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                }
                .print-btn:hover {
                    background: #5568d3;
                }
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    .invoice-container {
                        box-shadow: none;
                    }
                    .print-btn {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="header">
                    <h1>🏨 فاتورة الفندق</h1>
                    <p class="invoice-number">رقم الفاتورة: ${invoiceNumber}</p>
                    <p class="invoice-number">التاريخ: ${invoiceDate}</p>
                </div>

                <div class="info-grid">
                    <div class="info-section">
                        <h3>📋 معلومات الفندق</h3>
                        <p><strong>اسم الفندق:</strong> فندق الضيافة</p>
                        <p><strong>العنوان:</strong> المملكة العربية السعودية</p>
                        <p><strong>الهاتف:</strong> +966 XX XXX XXXX</p>
                    </div>
                    <div class="info-section">
                        <h3>👤 معلومات العميل</h3>
                        <p><strong>الاسم:</strong> ${booking.customerName}</p>
                        <p><strong>الجوال:</strong> ${booking.customerPhone}</p>
                        ${booking.nationalId ? `<p><strong>رقم الهوية:</strong> ${booking.nationalId}</p>` : ''}
                        ${booking.customerEmail ? `<p><strong>البريد:</strong> ${booking.customerEmail}</p>` : ''}
                    </div>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th>البند</th>
                            <th>التفاصيل</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            <th>المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>إقامة فندقية</td>
                            <td>
                                غرفة رقم ${booking.roomNumber} - ${room ? room.type : 'غرفة عادية'}<br>
                                من ${formatDate(booking.checkIn)} إلى ${formatDate(booking.checkOut)}
                            </td>
                            <td>${nights} ليلة</td>
                            <td>${room ? room.price : Math.round(booking.totalPrice / nights)} ريال</td>
                            <td>${booking.totalPrice} ريال</td>
                        </tr>
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-row">
                        <span>المجموع الفرعي:</span>
                        <span>${booking.totalPrice} ريال</span>
                    </div>
                    <div class="total-row">
                        <span>ضريبة القيمة المضافة (15%):</span>
                        <span>${Math.round(booking.totalPrice * 0.15)} ريال</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>المجموع الكلي:</span>
                        <span>${Math.round(booking.totalPrice * 1.15)} ريال</span>
                    </div>
                </div>

                <div class="footer">
                    <p>شكراً لاختياركم فندقنا</p>
                    <p>نتمنى لكم إقامة سعيدة</p>
                </div>

                <button class="print-btn" onclick="window.print()">🖨️ طباعة الفاتورة</button>
            </div>
        </body>
        </html>
    `);
    invoiceWindow.document.close();
};

// إصدار عقد
window.generateContract = function(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) {
        showToast('❌ لم يتم العثور على الحجز', 'error');
        return;
    }

    const room = allRooms.find(r => r.number === booking.roomNumber);
    const contractNumber = `CON-${booking.id.substring(0, 8).toUpperCase()}`;
    const contractDate = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

    // إنشاء نافذة العقد
    const contractWindow = window.open('', '_blank', 'width=800,height=1000');
    contractWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>عقد حجز - ${contractNumber}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 40px;
                    background: #f5f5f5;
                    line-height: 1.8;
                }
                .contract-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 50px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #667eea;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #667eea;
                    font-size: 28px;
                    margin-bottom: 10px;
                }
                .contract-info {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                }
                .contract-info p {
                    margin: 10px 0;
                    color: #333;
                }
                .contract-info strong {
                    color: #667eea;
                }
                .section {
                    margin: 30px 0;
                }
                .section h2 {
                    color: #667eea;
                    font-size: 20px;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 10px;
                }
                .section p, .section ul {
                    color: #333;
                    margin: 10px 0;
                }
                .section ul {
                    padding-right: 20px;
                }
                .section li {
                    margin: 8px 0;
                }
                .parties {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 30px 0;
                }
                .party {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                }
                .party h3 {
                    color: #667eea;
                    margin-bottom: 10px;
                }
                .signature-section {
                    margin-top: 50px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 50px;
                }
                .signature-box {
                    text-align: center;
                }
                .signature-line {
                    border-top: 2px solid #333;
                    margin-top: 60px;
                    padding-top: 10px;
                }
                .footer {
                    margin-top: 50px;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
                .print-btn {
                    display: block;
                    margin: 20px auto;
                    padding: 12px 30px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                }
                .print-btn:hover {
                    background: #5568d3;
                }
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    .contract-container {
                        box-shadow: none;
                    }
                    .print-btn {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="contract-container">
                <div class="header">
                    <h1>📄 عقد حجز فندقي</h1>
                    <p>رقم العقد: ${contractNumber}</p>
                    <p>التاريخ: ${contractDate}</p>
                </div>

                <div class="contract-info">
                    <p><strong>رقم الحجز:</strong> ${booking.id.substring(0, 8).toUpperCase()}</p>
                    <p><strong>رقم الغرفة:</strong> ${booking.roomNumber}</p>
                    <p><strong>تاريخ الدخول:</strong> ${formatDate(booking.checkIn)}</p>
                    <p><strong>تاريخ الخروج:</strong> ${formatDate(booking.checkOut)}</p>
                </div>

                <div class="parties">
                    <div class="party">
                        <h3>🏨 الطرف الأول (الفندق)</h3>
                        <p><strong>اسم الفندق:</strong> فندق الضيافة</p>
                        <p><strong>العنوان:</strong> المملكة العربية السعودية</p>
                        <p><strong>الهاتف:</strong> +966 XX XXX XXXX</p>
                    </div>
                    <div class="party">
                        <h3>👤 الطرف الثاني (العميل)</h3>
                        <p><strong>الاسم:</strong> ${booking.customerName}</p>
                        ${booking.nationalId ? `<p><strong>رقم الهوية:</strong> ${booking.nationalId}</p>` : ''}
                        <p><strong>الجوال:</strong> ${booking.customerPhone}</p>
                        ${booking.customerEmail ? `<p><strong>البريد:</strong> ${booking.customerEmail}</p>` : ''}
                    </div>
                </div>

                <div class="section">
                    <h2>تفاصيل الحجز</h2>
                    <p>يقر الطرف الثاني بحجز الغرفة رقم <strong>${booking.roomNumber}</strong> من نوع <strong>${room ? room.type : 'غرفة عادية'}</strong> لدى الطرف الأول، وذلك للمدة من ${formatDate(booking.checkIn)} إلى ${formatDate(booking.checkOut)}.</p>
                    <p><strong>المبلغ الإجمالي:</strong> ${booking.totalPrice} ريال سعودي</p>
                </div>

                <div class="section">
                    <h2>شروط وأحكام الحجز</h2>
                    <ul>
                        <li><strong>وقت تسجيل الدخول:</strong> من الساعة 3:00 مساءً</li>
                        <li><strong>وقت تسجيل الخروج:</strong> حتى الساعة 12:00 ظهراً</li>
                        <li><strong>سياسة الإلغاء:</strong> يجب إلغاء الحجز قبل 24 ساعة على الأقل من موعد الدخول لاسترداد المبلغ كاملاً</li>
                        <li><strong>التأخر في الخروج:</strong> في حالة التأخر عن موعد الخروج، سيتم احتساب يوم إضافي</li>
                        <li><strong>المسؤولية:</strong> العميل مسؤول عن أي أضرار تلحق بالغرفة أو محتوياتها</li>
                        <li><strong>سياسة الزوار:</strong> يُسمح بالزوار في الاستقبال فقط خلال ساعات النهار</li>
                        <li><strong>الدفع:</strong> يجب سداد كامل المبلغ عند تسجيل الدخول</li>
                        <li><strong>الهدوء:</strong> يُرجى احترام راحة النزلاء الآخرين والحفاظ على الهدوء بعد الساعة 11:00 مساءً</li>
                        <li><strong>التدخين:</strong> التدخين ممنوع داخل الغرف، ويُسمح به في الأماكن المخصصة فقط</li>
                        <li><strong>المفقودات:</strong> الفندق غير مسؤول عن أي مفقودات شخصية، يُرجى استخدام الخزنة المتوفرة</li>
                    </ul>
                </div>

                <div class="section">
                    <h2>التزامات الطرفين</h2>
                    <p><strong>يلتزم الطرف الأول (الفندق) بـ:</strong></p>
                    <ul>
                        <li>توفير الغرفة المحجوزة نظيفة ومجهزة بالكامل</li>
                        <li>تقديم الخدمات الفندقية المتفق عليها</li>
                        <li>الحفاظ على خصوصية العميل</li>
                    </ul>
                    <p><strong>يلتزم الطرف الثاني (العميل) بـ:</strong></p>
                    <ul>
                        <li>سداد كامل المبلغ المتفق عليه</li>
                        <li>الحفاظ على ممتلكات الفندق</li>
                        <li>احترام قوانين ولوائح الفندق</li>
                    </ul>
                </div>

                <div class="signature-section">
                    <div class="signature-box">
                        <p><strong>توقيع الطرف الأول</strong></p>
                        <p>(إدارة الفندق)</p>
                        <div class="signature-line"></div>
                    </div>
                    <div class="signature-box">
                        <p><strong>توقيع الطرف الثاني</strong></p>
                        <p>(${booking.customerName})</p>
                        <div class="signature-line"></div>
                    </div>
                </div>

                <div class="footer">
                    <p>هذا العقد ملزم للطرفين ويُعتبر ساري المفعول من تاريخ التوقيع</p>
                    <p>تم إصدار هذا العقد إلكترونياً من نظام إدارة الفندق</p>
                </div>

                <button class="print-btn" onclick="window.print()">🖨️ طباعة العقد</button>
            </div>
        </body>
        </html>
    `);
    contractWindow.document.close();
};

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
