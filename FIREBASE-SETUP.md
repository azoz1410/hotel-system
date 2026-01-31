# 🔥 إعداد Firebase للنظام

## الخطوات:

### 1️⃣ إنشاء مشروع Firebase

1. اذهب إلى: https://console.firebase.google.com
2. اضغط "Add project" أو "إضافة مشروع"
3. أدخل اسم المشروع: `hotel-system`
4. اتبع الخطوات حتى النهاية

### 2️⃣ تفعيل Realtime Database

1. في لوحة تحكم Firebase، اختر "Realtime Database"
2. اضغط "Create Database" أو "إنشاء قاعدة بيانات"
3. اختر الموقع (القريب منك)
4. اختر "Start in **test mode**" للبداية
5. اضغط "Enable"

### 3️⃣ الحصول على إعدادات المشروع

1. اذهب إلى ⚙️ Project Settings
2. في قسم "Your apps"، اختر "Web" (`</>`)
3. أدخل اسم التطبيق: `Hotel System`
4. انسخ الكود الموجود في `firebaseConfig`

### 4️⃣ تحديث الإعدادات

افتح ملف `firebase-config.js` واستبدل الإعدادات:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 5️⃣ ضبط قواعد الأمان (مهم!)

في Realtime Database → Rules، استبدل القواعد بـ:

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true
    },
    "logs": {
      ".read": true,
      ".write": true
    }
  }
}
```

⚠️ **ملاحظة**: هذه القواعد للتطوير فقط. للإنتاج، استخدم Authentication.

### 6️⃣ اختبار النظام

1. افتح `index.html` في المتصفح
2. افتح `admin.html` وأضف غرفة
3. ارجع لـ `index.html` - ستظهر الغرفة مباشرة! ✨

---

## 🎉 المميزات

✅ **تحديث فوري** - أي تغيير يظهر لجميع المستخدمين مباشرة
✅ **مركزية البيانات** - قاعدة بيانات واحدة للجميع
✅ **مجاني** - حتى 1GB و 100K اتصالات يومياً
✅ **موثوق** - من Google
✅ **سريع** - تحديثات في الوقت الفعلي

---

## 🚀 رفع على GitHub Pages

بعد إعداد Firebase:

```bash
git add .
git commit -m "🔥 Integrate Firebase Realtime Database"
git push origin main
```

ثم فعّل GitHub Pages وسيعمل النظام مباشرة!
