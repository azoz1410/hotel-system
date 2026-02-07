#!/bin/bash

# سكريبت تحديث قواعد Firebase تلقائياً

echo "🔄 جاري تحديث قواعد Firebase..."

# تحقق من تثبيت Firebase CLI
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI غير مثبت"
    echo "📦 لتثبيته، قم بتشغيل: npm install -g firebase-tools"
    exit 1
fi

# تحديث قواعد قاعدة البيانات
echo "📋 تحديث قواعد Realtime Database..."
firebase deploy --only database

if [ $? -eq 0 ]; then
    echo "✅ تم تحديث قواعد Firebase بنجاح!"
    echo ""
    echo "📝 التغييرات:"
    echo "  - إضافة مسار tenants/ للسماح بإعدادات متعددة للفنادق"
    echo "  - إضافة مسار verifications/ لحفظ أكواد التحقق"
    echo ""
else
    echo "❌ فشل تحديث القواعد"
    echo "⚠️ يرجى تحديثها يدوياً من Firebase Console"
    exit 1
fi
