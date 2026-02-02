// نظام المصادقة
let currentUser = null;

// التحقق من تسجيل الدخول
firebase.auth().onAuthStateChanged((user) => {
    currentUser = user;
    
    if (user) {
        console.log('✅ المستخدم مسجل دخول:', user.email);
        
        // إذا كنا في صفحة تسجيل الدخول، انتقل للوحة التحكم
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'admin.html';
        }
    } else {
        console.log('❌ المستخدم غير مسجل دخول');
        
        // إذا كنا في صفحة إدارية، ارجع لتسجيل الدخول
        if (window.location.pathname.includes('admin.html')) {
            window.location.href = 'login.html';
        }
    }
});

// تسجيل الدخول
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // تعطيل الزر أثناء المعالجة
        loginBtn.disabled = true;
        loginBtn.textContent = '⏳ جاري تسجيل الدخول...';

        try {
            // تسجيل الدخول
            const persistence = rememberMe 
                ? firebase.auth.Auth.Persistence.LOCAL 
                : firebase.auth.Auth.Persistence.SESSION;
            
            await firebase.auth().setPersistence(persistence);
            await firebase.auth().signInWithEmailAndPassword(email, password);

            // النجاح - سيتم التحويل تلقائياً عبر onAuthStateChanged
            showToast('✅ تم تسجيل الدخول بنجاح!', 'success');

        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            
            let errorMsg = 'حدث خطأ في تسجيل الدخول';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMsg = '❌ البريد الإلكتروني غير مسجل';
                    break;
                case 'auth/wrong-password':
                    errorMsg = '❌ كلمة المرور غير صحيحة';
                    break;
                case 'auth/invalid-email':
                    errorMsg = '❌ البريد الإلكتروني غير صالح';
                    break;
                case 'auth/too-many-requests':
                    errorMsg = '❌ عدد كبير من المحاولات. حاول لاحقاً';
                    break;
                default:
                    errorMsg = '❌ ' + error.message;
            }

            errorMessage.textContent = errorMsg;
            errorMessage.classList.add('show');

            // إعادة تفعيل الزر
            loginBtn.disabled = false;
            loginBtn.textContent = '🔐 تسجيل الدخول';
        }
    });
}

// تسجيل الخروج
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        firebase.auth().signOut()
            .then(() => {
                showToast('✅ تم تسجيل الخروج بنجاح', 'success');
                window.location.href = 'login.html';
            })
            .catch((error) => {
                console.error('خطأ في تسجيل الخروج:', error);
                showToast('❌ حدث خطأ في تسجيل الخروج', 'error');
            });
    }
}

// التحقق من صلاحيات المستخدم
function checkAuth() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                resolve(user);
            } else {
                reject('غير مصرح');
            }
        });
    });
}

// الحصول على المستخدم الحالي
function getCurrentUser() {
    return firebase.auth().currentUser;
}

// التحقق من البريد الإلكتروني
async function sendVerificationEmail() {
    const user = firebase.auth().currentUser;
    if (user && !user.emailVerified) {
        try {
            await user.sendEmailVerification();
            showToast('✅ تم إرسال رابط التحقق إلى بريدك الإلكتروني', 'success');
        } catch (error) {
            console.error('خطأ في إرسال التحقق:', error);
            showToast('❌ فشل إرسال رابط التحقق', 'error');
        }
    }
}

// إعادة تعيين كلمة المرور
async function resetPassword(email) {
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        showToast('✅ تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني', 'success');
    } catch (error) {
        console.error('خطأ في إعادة التعيين:', error);
        showToast('❌ فشل إرسال رابط إعادة التعيين', 'error');
    }
}

// نظام Toast Notifications
function showToast(message, type = 'info') {
    // إزالة Toast القديمة إن وجدت
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) {
        oldToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    // إضافة الأنماط إذا لم تكن موجودة
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
                word-wrap: break-word;
            }

            .toast-success {
                background: linear-gradient(135deg, #10ac84, #1dd1a1);
            }

            .toast-error {
                background: linear-gradient(135deg, #ee5a6f, #f368e0);
            }

            .toast-info {
                background: linear-gradient(135deg, #667eea, #764ba2);
            }

            .toast-warning {
                background: linear-gradient(135deg, #feca57, #ff9ff3);
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes fadeOut {
                to {
                    opacity: 0;
                    transform: translateX(400px);
                }
            }

            @media (max-width: 768px) {
                .toast-notification {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // إزالة Toast بعد 3 ثواني
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// تصدير الدوال للاستخدام في ملفات أخرى
window.authModule = {
    logout,
    checkAuth,
    getCurrentUser,
    sendVerificationEmail,
    resetPassword,
    showToast
};

console.log('✅ نظام المصادقة جاهز');
