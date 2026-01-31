#!/bin/bash

echo "🚀 بدء تشغيل نظام إدارة الفندق..."
echo ""
echo "📦 تثبيت المتطلبات..."
pip3 install -r requirements.txt

echo ""
echo "🗄️ تشغيل السيرفر..."
echo "📍 الموقع: http://localhost:5000"
echo "📁 قاعدة البيانات: hotel.db"
echo ""
echo "⚠️ اضغط Ctrl+C لإيقاف السيرفر"
echo ""

python3 server.py
