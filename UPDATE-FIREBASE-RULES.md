# تحديث قواعد Firebase

## لإصلاح مشكلة حفظ الثيم، اتبع الخطوات التالية:

### الخطوات:

1. **افتح Firebase Console**
   - اذهب إلى: https://console.firebase.google.com
   - اختر مشروعك

2. **انتقل إلى Realtime Database**
   - من القائمة الجانبية، اختر `Realtime Database`
   - اختر تبويب `Rules`

3. **حدّث القواعد**
   - انسخ محتوى ملف `firebase-rules.json` من المشروع
   - الصقه في محرر القواعد
   - أو انسخ الكود التالي مباشرة:

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": "auth != null",
      ".indexOn": ["status", "type", "number"]
    },
    "bookings": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$bookingId": {
        ".validate": "newData.hasChildren(['roomNumber', 'customerName', 'customerPhone', 'checkIn', 'checkOut', 'totalPrice', 'status', 'createdAt'])",
        "roomNumber": {
          ".validate": "newData.isNumber()"
        },
        "customerName": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "customerPhone": {
          ".validate": "newData.isString() && newData.val().matches(/^05[0-9]{8}$/)"
        },
        "checkIn": {
          ".validate": "newData.isString()"
        },
        "checkOut": {
          ".validate": "newData.isString()"
        },
        "totalPrice": {
          ".validate": "newData.isNumber() && newData.val() > 0"
        },
        "status": {
          ".validate": "newData.isString() && (newData.val() == 'pending' || newData.val() == 'confirmed' || newData.val() == 'cancelled' || newData.val() == 'completed')"
        }
      },
      ".indexOn": ["roomNumber", "status", "checkIn", "checkOut"]
    },
    "customers": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$customerId": {
        ".validate": "newData.hasChildren(['name', 'phone', 'email'])",
        "name": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "phone": {
          ".validate": "newData.isString() && newData.val().matches(/^05[0-9]{8}$/)"
        },
        "email": {
          ".validate": "newData.isString()"
        }
      },
      ".indexOn": ["phone", "email"]
    },
    "logs": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$logId": {
        ".validate": "newData.hasChildren(['action', 'timestamp', 'userId'])"
      },
      ".indexOn": ["timestamp", "action"]
    },
    "stats": {
      ".read": true,
      ".write": "auth != null"
    },
    "settings": {
      ".read": true,
      ".write": "auth != null",
      "theme": {
        ".validate": "newData.isString() && (newData.val() == 'default' || newData.val() == 'dark' || newData.val() == 'ocean')"
      }
    }
  }
}
```

4. **انشر القواعد**
   - اضغط على زر `Publish` أو `نشر`
   - انتظر حتى تظهر رسالة التأكيد

5. **جرّب مرة أخرى**
   - ارجع لصفحة المدير
   - حاول تغيير الثيم
   - يجب أن يعمل الآن بدون مشاكل! ✅

---

## ملاحظة مهمة:

القاعدة الجديدة `settings` تسمح بـ:
- ✅ **القراءة**: لجميع المستخدمين (حتى يرى الزوار الثيم)
- ✅ **الكتابة**: للمستخدمين المسجلين فقط (المدير)
- ✅ **التحقق**: يقبل فقط القيم: `default`, `dark`, `ocean`
