// نظام التحقق من رقم الجوال والبريد الإلكتروني
// يستخدم في نموذج الحجز العام للتحقق من هوية العميل

// تخزين الأكواد المؤقتة
const verificationCodes = new Map();

// الحصول على معرف الفندق (Tenant ID)
function getTenantId() {
    // في نظام SaaS، يتم الحصول على Tenant ID من:
    // 1. URL parameter (?hotel=xxx)
    // 2. subdomain
    // 3. localStorage
    
    const urlParams = new URLSearchParams(window.location.search);
    const hotelParam = urlParams.get('hotel');
    if (hotelParam) {
        localStorage.setItem('tenantId', hotelParam);
        return hotelParam;
    }
    
    const subdomain = window.location.hostname.split('.')[0];
    if (subdomain && subdomain !== 'localhost' && subdomain !== '127') {
        return subdomain;
    }
    
    return localStorage.getItem('tenantId') || 'default-hotel';
}

// تحميل إعدادات الفندق
async function loadTenantSettings() {
    const tenantId = getTenantId();
    
    try {
        const snapshot = await database.ref(`tenants/${tenantId}/settings`).once('value');
        return snapshot.val();
    } catch (error) {
        console.error('خطأ في تحميل إعدادات الفندق:', error);
        return null;
    }
}

// توليد كود التحقق
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// حفظ كود التحقق في Firebase
async function saveVerificationCode(identifier, code, type) {
    const tenantId = getTenantId();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 دقائق
    
    const verificationData = {
        code: code,
        type: type, // 'phone' or 'email'
        identifier: identifier,
        expiresAt: expiresAt,
        createdAt: new Date().toISOString(),
        verified: false,
        attempts: 0
    };
    
    try {
        // حفظ في Firebase تحت tenant
        const codeRef = await database.ref(`tenants/${tenantId}/verifications`).push(verificationData);
        return codeRef.key;
    } catch (error) {
        console.error('خطأ في حفظ كود التحقق:', error);
        throw error;
    }
}

// إرسال كود التحقق عبر WhatsApp (Twilio)
async function sendWhatsAppVerification(phoneNumber, settings) {
    const code = generateVerificationCode();
    const hotelName = settings.hotel?.name || 'الفندق';
    
    const message = settings.whatsapp.messageTemplate
        .replace('{code}', code)
        .replace('{hotel}', hotelName);
    
    try {
        // حفظ الكود في Firebase
        const codeId = await saveVerificationCode(phoneNumber, code, 'phone');
        
        // إرسال عبر Twilio (يتطلب Cloud Function)
        const response = await fetch('YOUR_CLOUD_FUNCTION_URL/sendWhatsApp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: phoneNumber,
                from: settings.whatsapp.phoneNumber,
                message: message,
                accountSid: settings.whatsapp.accountSid,
                authToken: settings.whatsapp.authToken,
                tenantId: getTenantId()
            })
        });
        
        if (!response.ok) {
            throw new Error('فشل إرسال الرسالة');
        }
        
        return {
            success: true,
            codeId: codeId,
            message: 'تم إرسال كود التحقق إلى رقم الجوال'
        };
        
    } catch (error) {
        console.error('خطأ في إرسال WhatsApp:', error);
        throw error;
    }
}

// إرسال كود التحقق عبر البريد الإلكتروني (EmailJS)
async function sendEmailVerification(email, settings) {
    const code = generateVerificationCode();
    const hotelName = settings.hotel?.name || 'الفندق';
    
    try {
        // حفظ الكود في Firebase
        const codeId = await saveVerificationCode(email, code, 'email');
        
        // تحميل EmailJS SDK إذا لم يكن محملاً
        if (typeof emailjs === 'undefined') {
            await loadEmailJSLib();
        }
        
        // تهيئة EmailJS
        emailjs.init(settings.email.publicKey);
        
        // إرسال البريد
        const templateParams = {
            to_email: email,
            code: code,
            hotel_name: hotelName,
            subject: settings.email.subject || 'كود التحقق',
            from_name: settings.email.senderName || hotelName,
            reply_to: settings.email.senderEmail
        };
        
        await emailjs.send(
            settings.email.serviceId,
            settings.email.templateId,
            templateParams
        );
        
        return {
            success: true,
            codeId: codeId,
            message: 'تم إرسال كود التحقق إلى البريد الإلكتروني'
        };
        
    } catch (error) {
        console.error('خطأ في إرسال البريد:', error);
        throw error;
    }
}

// التحقق من الكود المدخل
async function verifyCode(identifier, enteredCode) {
    const tenantId = getTenantId();
    
    try {
        // البحث عن الكود في Firebase
        const snapshot = await database.ref(`tenants/${tenantId}/verifications`)
            .orderByChild('identifier')
            .equalTo(identifier)
            .limitToLast(1)
            .once('value');
        
        if (!snapshot.exists()) {
            return {
                success: false,
                message: 'لم يتم العثور على كود التحقق'
            };
        }
        
        const verifications = snapshot.val();
        const verificationKey = Object.keys(verifications)[0];
        const verification = verifications[verificationKey];
        
        // التحقق من انتهاء الصلاحية
        if (new Date(verification.expiresAt) < new Date()) {
            return {
                success: false,
                message: 'انتهت صلاحية كود التحقق. يرجى طلب كود جديد'
            };
        }
        
        // التحقق من عدد المحاولات
        if (verification.attempts >= 3) {
            return {
                success: false,
                message: 'تجاوزت الحد الأقصى من المحاولات. يرجى طلب كود جديد'
            };
        }
        
        // التحقق من الكود
        if (verification.code === enteredCode) {
            // تحديث حالة التحقق
            await database.ref(`tenants/${tenantId}/verifications/${verificationKey}`).update({
                verified: true,
                verifiedAt: new Date().toISOString()
            });
            
            return {
                success: true,
                message: 'تم التحقق بنجاح!'
            };
        } else {
            // زيادة عدد المحاولات
            await database.ref(`tenants/${tenantId}/verifications/${verificationKey}`).update({
                attempts: verification.attempts + 1
            });
            
            return {
                success: false,
                message: `كود غير صحيح. المحاولات المتبقية: ${2 - verification.attempts}`
            };
        }
        
    } catch (error) {
        console.error('خطأ في التحقق من الكود:', error);
        return {
            success: false,
            message: 'حدث خطأ أثناء التحقق'
        };
    }
}

// التحقق من حالة التحقق
async function isVerified(identifier) {
    const tenantId = getTenantId();
    
    try {
        const snapshot = await database.ref(`tenants/${tenantId}/verifications`)
            .orderByChild('identifier')
            .equalTo(identifier)
            .limitToLast(1)
            .once('value');
        
        if (!snapshot.exists()) {
            return false;
        }
        
        const verifications = snapshot.val();
        const verification = Object.values(verifications)[0];
        
        return verification.verified === true;
        
    } catch (error) {
        console.error('خطأ في التحقق من الحالة:', error);
        return false;
    }
}

// تحميل EmailJS SDK
function loadEmailJSLib() {
    return new Promise((resolve, reject) => {
        if (typeof emailjs !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// دالة رئيسية للتحقق من الجوال أو البريد
async function initiateVerification(identifier, type) {
    try {
        const settings = await loadTenantSettings();
        
        if (!settings) {
            throw new Error('لم يتم العثور على إعدادات الفندق');
        }
        
        if (type === 'phone') {
            if (!settings.whatsapp || !settings.whatsapp.enabled) {
                throw new Error('نظام التحقق من الجوال غير مفعل');
            }
            return await sendWhatsAppVerification(identifier, settings);
        } else if (type === 'email') {
            if (!settings.email || !settings.email.enabled) {
                throw new Error('نظام التحقق من البريد غير مفعل');
            }
            return await sendEmailVerification(identifier, settings);
        } else {
            throw new Error('نوع التحقق غير صحيح');
        }
        
    } catch (error) {
        console.error('خطأ في بدء التحقق:', error);
        throw error;
    }
}

// تصدير الدوال للاستخدام العام
window.VerificationSystem = {
    initiateVerification,
    verifyCode,
    isVerified,
    getTenantId
};

console.log('✅ نظام التحقق جاهز');
