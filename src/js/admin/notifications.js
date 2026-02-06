let allNotifications = [];
let currentFilter = 'all';

// ترجمة أنواع الإشعارات
const notificationTypes = {
    booking_created: { icon: '📋', text: 'حجز جديد' },
    booking_modified: { icon: '✏️', text: 'تعديل حجز' },
    checkout_requested: { icon: '🚪', text: 'طلب خروج' },
    booking_cancelled: { icon: '❌', text: 'إلغاء حجز' }
};

// تحميل الإشعارات
function loadNotifications() {
    notificationsRef.orderByChild('timestamp').on('value', (snapshot) => {
        allNotifications = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                allNotifications.push({
                    id: key,
                    ...data[key]
                });
            });
        }
        
        // ترتيب الإشعارات (الأحدث أولاً)
        allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        displayNotifications();
        updateUnreadCount();
    });
}

// عرض الإشعارات
function displayNotifications() {
    const listDiv = document.getElementById('notificationsList');
    
    let filteredNotifications = allNotifications;
    
    if (currentFilter === 'unread') {
        filteredNotifications = allNotifications.filter(n => !n.read);
    } else if (currentFilter !== 'all') {
        filteredNotifications = allNotifications.filter(n => n.type === currentFilter);
    }
    
    if (filteredNotifications.length === 0) {
        listDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔕</div>
                <p>لا توجد إشعارات</p>
            </div>
        `;
        return;
    }
    
    listDiv.innerHTML = '';
    
    filteredNotifications.forEach(notification => {
        const typeInfo = notificationTypes[notification.type] || { icon: '📌', text: 'إشعار' };
        const card = document.createElement('div');
        card.className = `notification-card ${!notification.read ? 'unread' : ''} ${notification.priority === 'high' ? 'priority-high' : ''}`;
        card.onclick = () => markAsRead(notification.id);
        
        card.innerHTML = `
            <div class="notification-header">
                <div class="notification-type">
                    <span class="notification-icon">${typeInfo.icon}</span>
                    <span>${typeInfo.text}</span>
                    ${!notification.read ? '<span style="color: #ee5a6f; font-weight: bold;">●</span>' : ''}
                </div>
                <span class="notification-time">${formatTimeAgo(notification.timestamp)}</span>
            </div>
            
            <div class="notification-message">
                ${notification.message}
            </div>
            
            <div class="notification-details">
                ${notification.roomNumber ? `<span>🛏️ غرفة ${notification.roomNumber}</span>` : ''}
                ${notification.customerName ? `<span>👤 ${notification.customerName}</span>` : ''}
                ${notification.bookingId ? `<span>📋 ${notification.bookingId.substring(0, 8).toUpperCase()}</span>` : ''}
            </div>
            
            <div class="notification-actions">
                ${!notification.read ? `
                    <button class="notification-btn btn-mark-read" onclick="event.stopPropagation(); markAsRead('${notification.id}')">
                        ✓ تحديد كمقروء
                    </button>
                ` : ''}
                ${notification.bookingId ? `
                    <button class="notification-btn btn-view" onclick="event.stopPropagation(); viewBooking('${notification.bookingId}')">
                        👁️ عرض الحجز
                    </button>
                ` : ''}
                <button class="notification-btn btn-delete" onclick="event.stopPropagation(); deleteNotification('${notification.id}')">
                    🗑️ حذف
                </button>
            </div>
        `;
        
        listDiv.appendChild(card);
    });
}

// تحديث عداد غير المقروءة
function updateUnreadCount() {
    const unreadCount = allNotifications.filter(n => !n.read).length;
    document.getElementById('unreadCount').textContent = unreadCount > 0 ? 
        `${unreadCount} غير مقروء` : 'لا توجد إشعارات جديدة';
}

// تحديد إشعار كمقروء
async function markAsRead(notificationId) {
    try {
        await notificationsRef.child(notificationId).update({ read: true });
    } catch (error) {
        console.error('خطأ في تحديث الإشعار:', error);
    }
}

// تحديد الكل كمقروء
async function markAllAsRead() {
    try {
        const updates = {};
        allNotifications.forEach(notification => {
            if (!notification.read) {
                updates[`${notification.id}/read`] = true;
            }
        });
        
        await notificationsRef.update(updates);
        showToast('✅ تم تحديد جميع الإشعارات كمقروءة', 'success');
    } catch (error) {
        console.error('خطأ في التحديث:', error);
        showToast('❌ حدث خطأ أثناء التحديث', 'error');
    }
}

// حذف إشعار
async function deleteNotification(notificationId) {
    if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
        return;
    }
    
    try {
        await notificationsRef.child(notificationId).remove();
        showToast('✅ تم حذف الإشعار', 'success');
    } catch (error) {
        console.error('خطأ في الحذف:', error);
        showToast('❌ حدث خطأ أثناء الحذف', 'error');
    }
}

// عرض الحجز
function viewBooking(bookingId) {
    window.location.href = `bookings.html?booking=${bookingId}`;
}

// تصفية الإشعارات
function filterNotifications(filter) {
    currentFilter = filter;
    
    // تحديث الأزرار
    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayNotifications();
}

// تنسيق الوقت
function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    
    return time.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
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

// التهيئة
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 جاري تحميل الإشعارات...');
    loadNotifications();
    console.log('✅ نظام الإشعارات جاهز');
});
