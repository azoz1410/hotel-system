// قاعدة بيانات NoSQL محلية باستخدام IndexedDB
class HotelDatabase {
    constructor() {
        this.dbName = 'HotelManagementDB';
        this.version = 1;
        this.db = null;
    }

    // تهيئة قاعدة البيانات
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('خطأ في فتح قاعدة البيانات:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;

                // إنشاء مخزن الغرف
                if (!this.db.objectStoreNames.contains('rooms')) {
                    const roomStore = this.db.createObjectStore('rooms', { keyPath: 'number' });
                    roomStore.createIndex('status', 'status', { unique: false });
                    roomStore.createIndex('type', 'type', { unique: false });
                    roomStore.createIndex('price', 'price', { unique: false });
                    console.log('📦 تم إنشاء مخزن الغرف');
                }

                // إنشاء مخزن السجلات
                if (!this.db.objectStoreNames.contains('logs')) {
                    const logStore = this.db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
                    logStore.createIndex('timestamp', 'timestamp', { unique: false });
                    logStore.createIndex('action', 'action', { unique: false });
                    console.log('📦 تم إنشاء مخزن السجلات');
                }
            };
        });
    }

    // إضافة غرفة جديدة
    async addRoom(room) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms', 'logs'], 'readwrite');
            const roomStore = transaction.objectStore('rooms');
            const logStore = transaction.objectStore('logs');

            const request = roomStore.add(room);

            request.onsuccess = () => {
                // تسجيل العملية
                logStore.add({
                    action: 'add',
                    room: room.number,
                    timestamp: new Date().toISOString(),
                    details: `تم إضافة الغرفة ${room.number}`
                });
                console.log('✅ تم إضافة الغرفة:', room.number);
                resolve(room);
            };

            request.onerror = () => {
                console.error('❌ خطأ في إضافة الغرفة:', request.error);
                reject(request.error);
            };
        });
    }

    // تحديث غرفة
    async updateRoom(room) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms', 'logs'], 'readwrite');
            const roomStore = transaction.objectStore('rooms');
            const logStore = transaction.objectStore('logs');

            const request = roomStore.put(room);

            request.onsuccess = () => {
                // تسجيل العملية
                logStore.add({
                    action: 'update',
                    room: room.number,
                    timestamp: new Date().toISOString(),
                    details: `تم تحديث الغرفة ${room.number}`
                });
                console.log('✅ تم تحديث الغرفة:', room.number);
                resolve(room);
            };

            request.onerror = () => {
                console.error('❌ خطأ في تحديث الغرفة:', request.error);
                reject(request.error);
            };
        });
    }

    // حذف غرفة
    async deleteRoom(roomNumber) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms', 'logs'], 'readwrite');
            const roomStore = transaction.objectStore('rooms');
            const logStore = transaction.objectStore('logs');

            const request = roomStore.delete(roomNumber);

            request.onsuccess = () => {
                // تسجيل العملية
                logStore.add({
                    action: 'delete',
                    room: roomNumber,
                    timestamp: new Date().toISOString(),
                    details: `تم حذف الغرفة ${roomNumber}`
                });
                console.log('✅ تم حذف الغرفة:', roomNumber);
                resolve(roomNumber);
            };

            request.onerror = () => {
                console.error('❌ خطأ في حذف الغرفة:', request.error);
                reject(request.error);
            };
        });
    }

    // الحصول على غرفة بالرقم
    async getRoom(roomNumber) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms'], 'readonly');
            const roomStore = transaction.objectStore('rooms');
            const request = roomStore.get(roomNumber);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('❌ خطأ في جلب الغرفة:', request.error);
                reject(request.error);
            };
        });
    }

    // الحصول على جميع الغرف
    async getAllRooms() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms'], 'readonly');
            const roomStore = transaction.objectStore('rooms');
            const request = roomStore.getAll();

            request.onsuccess = () => {
                console.log('📋 تم جلب الغرف:', request.result.length);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('❌ خطأ في جلب الغرف:', request.error);
                reject(request.error);
            };
        });
    }

    // الحصول على الغرف حسب الحالة
    async getRoomsByStatus(status) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms'], 'readonly');
            const roomStore = transaction.objectStore('rooms');
            const index = roomStore.index('status');
            const request = index.getAll(status);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('❌ خطأ في جلب الغرف حسب الحالة:', request.error);
                reject(request.error);
            };
        });
    }

    // الحصول على الغرف حسب النوع
    async getRoomsByType(type) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms'], 'readonly');
            const roomStore = transaction.objectStore('rooms');
            const index = roomStore.index('type');
            const request = index.getAll(type);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('❌ خطأ في جلب الغرف حسب النوع:', request.error);
                reject(request.error);
            };
        });
    }

    // الحصول على السجلات
    async getLogs(limit = 50) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['logs'], 'readonly');
            const logStore = transaction.objectStore('logs');
            const request = logStore.getAll();

            request.onsuccess = () => {
                const logs = request.result.slice(-limit).reverse();
                resolve(logs);
            };

            request.onerror = () => {
                console.error('❌ خطأ في جلب السجلات:', request.error);
                reject(request.error);
            };
        });
    }

    // مسح جميع البيانات (إعادة تعيين)
    async clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms', 'logs'], 'readwrite');
            const roomStore = transaction.objectStore('rooms');
            const logStore = transaction.objectStore('logs');

            const roomRequest = roomStore.clear();
            const logRequest = logStore.clear();

            transaction.oncomplete = () => {
                console.log('🗑️ تم مسح جميع البيانات');
                resolve();
            };

            transaction.onerror = () => {
                console.error('❌ خطأ في مسح البيانات:', transaction.error);
                reject(transaction.error);
            };
        });
    }

    // إضافة بيانات افتراضية (للاختبار فقط - يجب استدعاؤها يدوياً)
    async seedDefaultData() {
        const defaultRooms = [
            { number: 101, type: 'غرفة مفردة', status: 'available', price: 150 },
            { number: 102, type: 'غرفة مفردة', status: 'occupied', price: 150 },
            { number: 103, type: 'غرفة مزدوجة', status: 'available', price: 250 },
            { number: 104, type: 'غرفة مزدوجة', status: 'available', price: 250 },
            { number: 105, type: 'جناح', status: 'occupied', price: 500 },
            { number: 201, type: 'غرفة مفردة', status: 'available', price: 150 },
            { number: 202, type: 'غرفة مفردة', status: 'available', price: 150 },
            { number: 203, type: 'غرفة مزدوجة', status: 'occupied', price: 250 },
            { number: 204, type: 'غرفة مزدوجة', status: 'available', price: 250 },
            { number: 205, type: 'جناح', status: 'available', price: 500 },
            { number: 301, type: 'غرفة مفردة', status: 'available', price: 150 },
            { number: 302, type: 'غرفة مفردة', status: 'maintenance', price: 150 },
            { number: 303, type: 'غرفة مزدوجة', status: 'available', price: 250 },
            { number: 304, type: 'غرفة مزدوجة', status: 'available', price: 250 },
            { number: 305, type: 'جناح', status: 'occupied', price: 500 },
        ];

        console.log('📦 إضافة البيانات الافتراضية للاختبار...');
        for (const room of defaultRooms) {
            try {
                await this.addRoom(room);
            } catch (error) {
                console.log(`⚠️ الغرفة ${room.number} موجودة بالفعل`);
            }
        }
        console.log('✅ تم إضافة البيانات الافتراضية');
    }

    // إحصائيات قاعدة البيانات
    async getStats() {
        const rooms = await this.getAllRooms();
        const logs = await this.getLogs();

        const stats = {
            total: rooms.length,
            available: rooms.filter(r => r.status === 'available').length,
            occupied: rooms.filter(r => r.status === 'occupied').length,
            maintenance: rooms.filter(r => r.status === 'maintenance').length,
            totalLogs: logs.length,
            lastUpdate: logs.length > 0 ? logs[0].timestamp : null
        };

        return stats;
    }
}

// إنشاء مثيل واحد من قاعدة البيانات
const hotelDB = new HotelDatabase();

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hotelDB;
}
