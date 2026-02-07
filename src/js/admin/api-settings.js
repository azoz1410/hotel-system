// إعدادات API للفندق
let tenantId = null;
let currentSettings = {};

// الحصول على معرف الفندق (Tenant ID)
function getTenantId() {
    // في نظام SaaS، يمكن الحصول على Tenant ID من:
    // 1. subdomain (hotel1.system.com)
    // 2. المستخدم الحالي
    // 3. localStorage
    
    const user = firebase.auth().currentUser;
    if (user) {
        // استخدام UID المستخدم كـ Tenant ID (يمكن تغييره حسب نظامك)
        return user.uid;
    }
    
    // أو استخدام subdomain
    const subdomain = window.location.hostname.split('.')[0];
    if (subdomain && subdomain !== 'localhost' && subdomain !== '127') {
        return subdomain;
    }
    
    // fallback: استخدام localStorage
    return localStorage.getItem('tenantId') || 'default-hotel';
}

// تحميل الإعدادات
async function loadSettings() {
    tenantId = getTenantId();
    console.log('🏨 Tenant ID:', tenantId);
    
    try {
        const snapshot = await database.ref(`tenants/${tenantId}/settings`).once('value');
        const settings = snapshot.val();
        
        if (settings) {
            currentSettings = settings;
            populateForm(settings);
            showToast('✅ تم تحميل الإعدادات', 'success');
        } else {
            console.log('ℹ️ لا توجد إعدادات محفوظة، استخدام القيم الافتراضية');
        }
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
        showToast('❌ خطأ في تحميل الإعدادات', 'error');
    }
}

// ملء النموذج بالبيانات المحفوظة
function populateForm(settings) {
    // إعدادات WhatsApp/SMS
    if (settings.whatsapp) {
        document.getElementById('whatsappEnabled').checked = settings.whatsapp.enabled || false;
        document.getElementById('whatsappProvider').value = settings.whatsapp.provider || 'twilio';
        document.getElementById('twilioAccountSid').value = settings.whatsapp.accountSid || '';
        document.getElementById('twilioAuthToken').value = settings.whatsapp.authToken || '';
        document.getElementById('twilioPhoneNumber').value = settings.whatsapp.phoneNumber || '';
        document.getElementById('whatsappMessageTemplate').value = settings.whatsapp.messageTemplate || 'مرحباً! كود التحقق الخاص بك من {hotel} هو: {code}\nالرجاء إدخال هذا الكود خلال 5 دقائق.';
    }
    
    // إعدادات البريد الإلكتروني
    if (settings.email) {
        document.getElementById('emailEnabled').checked = settings.email.enabled || false;
        document.getElementById('emailProvider').value = settings.email.provider || 'emailjs';
        document.getElementById('emailjsServiceId').value = settings.email.serviceId || '';
        document.getElementById('emailjsTemplateId').value = settings.email.templateId || '';
        document.getElementById('emailjsPublicKey').value = settings.email.publicKey || '';
        document.getElementById('emailSenderName').value = settings.email.senderName || '';
        document.getElementById('emailSenderEmail').value = settings.email.senderEmail || '';
        document.getElementById('emailSubject').value = settings.email.subject || 'كود التحقق من البريد الإلكتروني';
    }
    
    // معلومات الفندق
    if (settings.hotel) {
        document.getElementById('hotelName').value = settings.hotel.name || '';
        document.getElementById('hotelPhone').value = settings.hotel.phone || '';
        document.getElementById('hotelEmail').value = settings.hotel.email || '';
    }
}

// حفظ إعدادات WhatsApp
document.getElementById('whatsappSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const whatsappSettings = {
        enabled: document.getElementById('whatsappEnabled').checked,
        provider: document.getElementById('whatsappProvider').value,
        accountSid: document.getElementById('twilioAccountSid').value.trim(),
        authToken: document.getElementById('twilioAuthToken').value.trim(),
        phoneNumber: document.getElementById('twilioPhoneNumber').value.trim(),
        messageTemplate: document.getElementById('whatsappMessageTemplate').value,
        updatedAt: new Date().toISOString(),
        updatedBy: firebase.auth().currentUser?.email || 'admin'
    };
    
    try {
        await database.ref(`tenants/${tenantId}/settings/whatsapp`).set(whatsappSettings);
        currentSettings.whatsapp = whatsappSettings;
        showToast('✅ تم حفظ إعدادات الجوال بنجاح!', 'success');
        
        // إضافة سجل
        await logsRef.push({
            action: 'whatsapp_settings_updated',
            timestamp: new Date().toISOString(),
            userId: firebase.auth().currentUser?.uid || 'admin',
            tenantId: tenantId,
            details: 'تم تحديث إعدادات WhatsApp/SMS'
        });
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        showToast('❌ خطأ في حفظ الإعدادات: ' + error.message, 'error');
    }
});

// حفظ إعدادات البريد الإلكتروني
document.getElementById('emailSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const emailSettings = {
        enabled: document.getElementById('emailEnabled').checked,
        provider: document.getElementById('emailProvider').value,
        serviceId: document.getElementById('emailjsServiceId').value.trim(),
        templateId: document.getElementById('emailjsTemplateId').value.trim(),
        publicKey: document.getElementById('emailjsPublicKey').value.trim(),
        senderName: document.getElementById('emailSenderName').value.trim(),
        senderEmail: document.getElementById('emailSenderEmail').value.trim(),
        subject: document.getElementById('emailSubject').value,
        updatedAt: new Date().toISOString(),
        updatedBy: firebase.auth().currentUser?.email || 'admin'
    };
    
    try {
        await database.ref(`tenants/${tenantId}/settings/email`).set(emailSettings);
        currentSettings.email = emailSettings;
        showToast('✅ تم حفظ إعدادات البريد بنجاح!', 'success');
        
        // إضافة سجل
        await logsRef.push({
            action: 'email_settings_updated',
            timestamp: new Date().toISOString(),
            userId: firebase.auth().currentUser?.uid || 'admin',
            tenantId: tenantId,
            details: 'تم تحديث إعدادات البريد الإلكتروني'
        });
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        showToast('❌ خطأ في حفظ الإعدادات: ' + error.message, 'error');
    }
});

// حفظ معلومات الفندق
document.getElementById('hotelInfoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const hotelInfo = {
        name: document.getElementById('hotelName').value.trim(),
        phone: document.getElementById('hotelPhone').value.trim(),
        email: document.getElementById('hotelEmail').value.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: firebase.auth().currentUser?.email || 'admin'
    };
    
    try {
        await database.ref(`tenants/${tenantId}/settings/hotel`).set(hotelInfo);
        currentSettings.hotel = hotelInfo;
        showToast('✅ تم حفظ معلومات الفندق بنجاح!', 'success');
        
        // إضافة سجل
        await logsRef.push({
            action: 'hotel_info_updated',
            timestamp: new Date().toISOString(),
            userId: firebase.auth().currentUser?.uid || 'admin',
            tenantId: tenantId,
            details: 'تم تحديث معلومات الفندق'
        });
    } catch (error) {
        console.error('خطأ في حفظ المعلومات:', error);
        showToast('❌ خطأ في حفظ المعلومات: ' + error.message, 'error');
    }
});

// تبديل إظهار/إخفاء كلمة المرور
window.togglePasswordVisibility = function(inputId) {
    const input = document.getElementById(inputId);
    const button = event.currentTarget;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
};

// اختبار إرسال WhatsApp
window.testWhatsApp = async function() {
    const phoneNumber = prompt('أدخل رقم الجوال للاختبار (بصيغة دولية، مثال: +966501234567):');
    
    if (!phoneNumber) return;
    
    const whatsappSettings = currentSettings.whatsapp;
    
    if (!whatsappSettings || !whatsappSettings.enabled) {
        showToast('❌ يجب تفعيل وحفظ إعدادات الجوال أولاً', 'error');
        return;
    }
    
    if (!whatsappSettings.accountSid || !whatsappSettings.authToken || !whatsappSettings.phoneNumber) {
        showToast('❌ يرجى إكمال جميع حقول إعدادات Twilio', 'error');
        return;
    }
    
    showToast('⏳ جاري إرسال رسالة اختبار...', 'info');
    
    try {
        const testCode = Math.floor(100000 + Math.random() * 900000).toString();
        const message = whatsappSettings.messageTemplate
            .replace('{code}', testCode)
            .replace('{hotel}', currentSettings.hotel?.name || 'الفندق');
        
        // هنا يجب استدعاء Cloud Function أو Backend API
        // لأن Twilio يتطلب Server-side authentication
        showToast('⚠️ ملاحظة: لإتمام الاختبار، تحتاج إلى إعداد Cloud Function', 'warning');
        console.log('Test Message:', message);
        console.log('To:', phoneNumber);
        console.log('From:', whatsappSettings.phoneNumber);
        
    } catch (error) {
        console.error('خطأ في الاختبار:', error);
        showToast('❌ خطأ في إرسال الرسالة الاختبارية', 'error');
    }
};

// اختبار إرسال البريد
window.testEmail = async function() {
    const emailAddress = prompt('أدخل البريد الإلكتروني للاختبار:');
    
    if (!emailAddress) return;
    
    const emailSettings = currentSettings.email;
    
    if (!emailSettings || !emailSettings.enabled) {
        showToast('❌ يجب تفعيل وحفظ إعدادات البريد أولاً', 'error');
        return;
    }
    
    if (!emailSettings.serviceId || !emailSettings.templateId || !emailSettings.publicKey) {
        showToast('❌ يرجى إكمال جميع حقول إعدادات EmailJS', 'error');
        return;
    }
    
    showToast('⏳ جاري إرسال بريد اختبار...', 'info');
    
    try {
        // تحميل EmailJS SDK
        if (typeof emailjs === 'undefined') {
            await loadEmailJS();
        }
        
        emailjs.init(emailSettings.publicKey);
        
        const testCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        const templateParams = {
            to_email: emailAddress,
            code: testCode,
            hotel_name: currentSettings.hotel?.name || 'الفندق',
            subject: emailSettings.subject || 'كود التحقق'
        };
        
        await emailjs.send(
            emailSettings.serviceId,
            emailSettings.templateId,
            templateParams
        );
        
        showToast('✅ تم إرسال بريد اختبار بنجاح!', 'success');
        
    } catch (error) {
        console.error('خطأ في الاختبار:', error);
        showToast('❌ خطأ في إرسال البريد: ' + error.text || error.message, 'error');
    }
};

// تحميل EmailJS SDK
function loadEmailJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// التهيئة
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 جاري تحميل إعدادات API...');
    
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadSettings();
        } else {
            showToast('❌ يجب تسجيل الدخول أولاً', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    });
    
    console.log('✅ صفحة إعدادات API جاهزة');
});
