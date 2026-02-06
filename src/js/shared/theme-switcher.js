/**
 * Theme Switcher System
 * نظام التبديل بين الثيمات - يتحكم به المدير فقط
 */

const ThemeSwitcher = {
    // قائمة الثيمات المتاحة
    themes: {
        'default': {
            name: 'الثيم الافتراضي',
            file: 'themes/default.css',
            icon: '🎨'
        },
        'dark': {
            name: 'الثيم الداكن',
            file: 'themes/dark.css',
            icon: '🌙'
        },
        'ocean': {
            name: 'ثيم المحيط',
            file: 'themes/ocean.css',
            icon: '🌊'
        },
        'professional': {
            name: 'الثيم الاحترافي',
            file: 'themes/professional.css',
            icon: '👔'
        }
    },

    // الثيم الحالي
    currentTheme: 'default',

    // تهيئة النظام
    init() {
        // الانتظار حتى يتم تحميل Firebase
        this.waitForFirebase();
    },

    // الانتظار حتى يتم تحميل Firebase
    waitForFirebase() {
        if (typeof firebase !== 'undefined' && firebase.database) {
            this.loadThemeFromFirebase();
        } else {
            // إعادة المحاولة بعد 100ms
            setTimeout(() => this.waitForFirebase(), 100);
        }
    },

    // تحميل الثيم من Firebase
    loadThemeFromFirebase() {
        firebase.database().ref('settings/theme').on('value', (snapshot) => {
            const theme = snapshot.val() || 'default';
            this.loadTheme(theme);
        }, (error) => {
            console.error('❌ خطأ في تحميل الثيم:', error);
            // في حالة الخطأ، استخدام الثيم الافتراضي
            this.loadTheme('default');
        });
    },

    // تحميل ثيم معين
    loadTheme(themeName) {
        if (!this.themes[themeName]) {
            console.error(`Theme "${themeName}" not found`);
            return;
        }

        // إزالة أي ثيم سابق
        const existingThemeLink = document.getElementById('theme-stylesheet');
        if (existingThemeLink) {
            existingThemeLink.remove();
        }

        // إضافة الثيم الجديد
        const link = document.createElement('link');
        link.id = 'theme-stylesheet';
        link.rel = 'stylesheet';
        link.href = this.themes[themeName].file;
        document.head.appendChild(link);

        // حفظ الثيم الحالي
        this.currentTheme = themeName;
    }
};

// تهيئة النظام عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeSwitcher.init());
} else {
    ThemeSwitcher.init();
}

// تصدير للاستخدام العام
window.ThemeSwitcher = ThemeSwitcher;
