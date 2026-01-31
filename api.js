// واجهة برمجة التطبيقات للاتصال بقاعدة البيانات
const API_BASE_URL = 'http://localhost:5000/api';

class HotelAPI {
    // الحصول على جميع الغرف
    async getAllRooms() {
        try {
            const response = await fetch(`${API_BASE_URL}/rooms`);
            const data = await response.json();
            if (data.success) {
                return data.rooms;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ خطأ في جلب الغرف:', error);
            throw error;
        }
    }

    // الحصول على غرفة محددة
    async getRoom(roomNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/rooms/${roomNumber}`);
            const data = await response.json();
            if (data.success) {
                return data.room;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ خطأ في جلب الغرفة:', error);
            throw error;
        }
    }

    // إضافة غرفة جديدة
    async addRoom(room) {
        try {
            const response = await fetch(`${API_BASE_URL}/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(room)
            });
            const data = await response.json();
            if (data.success) {
                console.log('✅ تم إضافة الغرفة بنجاح');
                return data;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ خطأ في إضافة الغرفة:', error);
            throw error;
        }
    }

    // تحديث غرفة
    async updateRoom(room) {
        try {
            const response = await fetch(`${API_BASE_URL}/rooms/${room.number}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(room)
            });
            const data = await response.json();
            if (data.success) {
                console.log('✅ تم تحديث الغرفة بنجاح');
                return data;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ خطأ في تحديث الغرفة:', error);
            throw error;
        }
    }

    // حذف غرفة
    async deleteRoom(roomNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/rooms/${roomNumber}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                console.log('✅ تم حذف الغرفة بنجاح');
                return data;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ خطأ في حذف الغرفة:', error);
            throw error;
        }
    }

    // الحصول على الغرف حسب الحالة
    async getRoomsByStatus(status) {
        try {
            const response = await fetch(`${API_BASE_URL}/rooms/status/${status}`);
            const data = await response.json();
            if (data.success) {
                return data.rooms;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ خطأ في جلب الغرف حسب الحالة:', error);
            throw error;
        }
    }

    // الحصول على الإحصائيات
    async getStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/stats`);
            const data = await response.json();
            if (data.success) {
                return data.stats;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ خطأ في جلب الإحصائيات:', error);
            throw error;
        }
    }

    // الحصول على السجلات
    async getLogs(limit = 50) {
        try {
            const response = await fetch(`${API_BASE_URL}/logs?limit=${limit}`);
            const data = await response.json();
            if (data.success) {
                return data.logs;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ خطأ في جلب السجلات:', error);
            throw error;
        }
    }
}

// إنشاء مثيل واحد من API
const hotelAPI = new HotelAPI();
