# 🚀 نشر Cloud Functions

## ما تم إنشاؤه:

✅ **Cloud Functions** كاملة لإرسال WhatsApp/SMS
✅ تكامل مع Twilio API
✅ نظام التحقق من الأكواد
✅ معالجة الأخطاء المتقدمة

---

## 📋 خطوات النشر:

### 1️⃣ تثبيت Dependencies

```bash
cd /Users/aziz5g/Desktop/hotel-system/functions
npm install
```

### 2️⃣ تسجيل الدخول إلى Firebase

```bash
firebase login
```

### 3️⃣ نشر Functions

```bash
cd /Users/aziz5g/Desktop/hotel-system
firebase deploy --only functions
```

سيستغرق النشر 2-3 دقائق...

---

## 🎯 بعد النشر:

1. ✅ سيعمل زر "اختبار الإرسال" مباشرة
2. ✅ سيتم إرسال رسائل WhatsApp/SMS فعلية
3. ✅ نظام التحقق في نموذج الحجز سيعمل

---

## 📝 Cloud Functions المُنشأة:

### 1. `sendWhatsApp`
- إرسال رسائل WhatsApp/SMS عبر Twilio
- **URL:** `https://us-central1-hotel-system-f50a4.cloudfunctions.net/sendWhatsApp`

### 2. `verifyTwilioCredentials`
- التحقق من صحة بيانات Twilio
- **URL:** `https://us-central1-hotel-system-f50a4.cloudfunctions.net/verifyTwilioCredentials`

### 3. `saveVerificationCode`
- حفظ أكواد التحقق في Firebase
- **URL:** `https://us-central1-hotel-system-f50a4.cloudfunctions.net/saveVerificationCode`

### 4. `verifyCode`
- التحقق من الكود المدخل
- **URL:** `https://us-central1-hotel-system-f50a4.cloudfunctions.net/verifyCode`

---

## 💰 التكلفة:

**Firebase Functions:**
- 2 مليون استدعاء/شهر: **مجاني**
- بعد ذلك: $0.40 لكل مليون استدعاء

**Twilio:**
- ~$0.01 لكل رسالة SMS/WhatsApp

---

## ⚙️ إذا لم يكن Firebase CLI مثبتاً:

```bash
npm install -g firebase-tools
```

---

## 🧪 اختبار بعد النشر:

1. افتح صفحة **إعدادات API**
2. أدخل بيانات Twilio
3. احفظ الإعدادات
4. انقر **"اختبار الإرسال"**
5. أدخل رقم جوال (بصيغة دولية: +966...)
6. يجب أن تصلك رسالة فعلية! ✅

---

## 📞 حل المشاكل:

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### "Permission denied"
```bash
firebase login
```

### "Deployment failed"
تأكد من:
- اتصالك بالإنترنت
- صلاحيات المشروع في Firebase Console
- أن المشروع الصحيح محدد: `hotel-system-f50a4`

---

**جاهز للنشر؟** قم بتنفيذ الأوامر أعلاه! 🚀
