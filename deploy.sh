#!/bin/bash

echo "🚀 نشر Cloud Functions لنظام الفندق"
echo "======================================"
echo ""

# التحقق من Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت"
    echo "📦 يرجى تثبيت Node.js من: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js مثبت: $(node -v)"
echo ""

# التحقق من Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "📦 Firebase CLI غير مثبت، جاري التثبيت..."
    npm install -g firebase-tools
    
    if [ $? -ne 0 ]; then
        echo "❌ فشل تثبيت Firebase CLI"
        exit 1
    fi
    
    echo "✅ تم تثبيت Firebase CLI"
fi

echo "✅ Firebase CLI مثبت"
echo ""

# التحقق من تسجيل الدخول
echo "🔐 جاري التحقق من تسجيل الدخول..."
firebase projects:list &> /dev/null

if [ $? -ne 0 ]; then
    echo "🔑 يرجى تسجيل الدخول إلى Firebase..."
    firebase login
    
    if [ $? -ne 0 ]; then
        echo "❌ فشل تسجيل الدخول"
        exit 1
    fi
fi

echo "✅ تم تسجيل الدخول بنجاح"
echo ""

# تثبيت Dependencies
echo "📦 جاري تثبيت Dependencies..."
cd functions

if [ ! -f "package.json" ]; then
    echo "❌ ملف package.json غير موجود في مجلد functions"
    exit 1
fi

npm install

if [ $? -ne 0 ]; then
    echo "❌ فشل تثبيت Dependencies"
    exit 1
fi

echo "✅ تم تثبيت Dependencies بنجاح"
echo ""

# العودة للمجلد الرئيسي
cd ..

# نشر Functions
echo "🚀 جاري نشر Cloud Functions..."
echo "⏱️  قد يستغرق هذا 2-3 دقائق..."
echo ""

firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✅ تم نشر Cloud Functions بنجاح!"
    echo "======================================"
    echo ""
    echo "📝 Functions المنشورة:"
    echo "  1. sendWhatsApp - إرسال رسائل WhatsApp/SMS"
    echo "  2. verifyTwilioCredentials - التحقق من بيانات Twilio"
    echo "  3. saveVerificationCode - حفظ أكواد التحقق"
    echo "  4. verifyCode - التحقق من الأكواد"
    echo ""
    echo "🎯 الخطوة التالية:"
    echo "  1. افتح صفحة إعدادات API"
    echo "  2. أدخل بيانات Twilio"
    echo "  3. جرب 'اختبار الإرسال'"
    echo ""
    echo "🔗 URLs:"
    echo "  https://us-central1-hotel-system-f50a4.cloudfunctions.net/sendWhatsApp"
    echo ""
else
    echo ""
    echo "======================================"
    echo "❌ فشل نشر Cloud Functions"
    echo "======================================"
    echo ""
    echo "💡 نصائح لحل المشكلة:"
    echo "  1. تأكد من اتصالك بالإنترنت"
    echo "  2. تحقق من صلاحياتك في Firebase Console"
    echo "  3. تأكد من اختيار المشروع الصحيح"
    echo ""
    echo "🔗 لمزيد من المساعدة:"
    echo "  firebase --help"
    echo ""
    exit 1
fi
