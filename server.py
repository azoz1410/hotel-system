from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATABASE = 'hotel.db'

# إنشاء قاعدة البيانات
def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # جدول الغرف
    c.execute('''CREATE TABLE IF NOT EXISTS rooms
                 (number INTEGER PRIMARY KEY,
                  type TEXT NOT NULL,
                  status TEXT NOT NULL,
                  price INTEGER NOT NULL)''')
    
    # جدول السجلات
    c.execute('''CREATE TABLE IF NOT EXISTS logs
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  action TEXT NOT NULL,
                  room INTEGER,
                  timestamp TEXT NOT NULL,
                  details TEXT)''')
    
    conn.commit()
    conn.close()
    print('✅ تم إنشاء قاعدة البيانات: hotel.db')

# دالة للحصول على اتصال قاعدة البيانات
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# إضافة سجل
def add_log(action, room, details):
    conn = get_db()
    c = conn.cursor()
    timestamp = datetime.now().isoformat()
    c.execute('INSERT INTO logs (action, room, timestamp, details) VALUES (?, ?, ?, ?)',
              (action, room, timestamp, details))
    conn.commit()
    conn.close()

# الصفحة الرئيسية
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# تقديم الملفات الثابتة
@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

# الحصول على جميع الغرف
@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM rooms ORDER BY number')
        rooms = [dict(row) for row in c.fetchall()]
        conn.close()
        return jsonify({'success': True, 'rooms': rooms})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# الحصول على غرفة محددة
@app.route('/api/rooms/<int:room_number>', methods=['GET'])
def get_room(room_number):
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM rooms WHERE number = ?', (room_number,))
        room = c.fetchone()
        conn.close()
        
        if room:
            return jsonify({'success': True, 'room': dict(room)})
        else:
            return jsonify({'success': False, 'error': 'الغرفة غير موجودة'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# إضافة غرفة جديدة
@app.route('/api/rooms', methods=['POST'])
def add_room():
    try:
        data = request.json
        conn = get_db()
        c = conn.cursor()
        
        c.execute('INSERT INTO rooms (number, type, status, price) VALUES (?, ?, ?, ?)',
                  (data['number'], data['type'], data['status'], data['price']))
        
        conn.commit()
        conn.close()
        
        add_log('add', data['number'], f"تم إضافة الغرفة {data['number']}")
        
        return jsonify({'success': True, 'message': 'تم إضافة الغرفة بنجاح'})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'error': 'رقم الغرفة موجود بالفعل'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# تحديث غرفة
@app.route('/api/rooms/<int:room_number>', methods=['PUT'])
def update_room(room_number):
    try:
        data = request.json
        conn = get_db()
        c = conn.cursor()
        
        c.execute('''UPDATE rooms 
                     SET type = ?, status = ?, price = ?
                     WHERE number = ?''',
                  (data['type'], data['status'], data['price'], room_number))
        
        conn.commit()
        conn.close()
        
        add_log('update', room_number, f"تم تحديث الغرفة {room_number}")
        
        return jsonify({'success': True, 'message': 'تم تحديث الغرفة بنجاح'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# حذف غرفة
@app.route('/api/rooms/<int:room_number>', methods=['DELETE'])
def delete_room(room_number):
    try:
        conn = get_db()
        c = conn.cursor()
        
        c.execute('DELETE FROM rooms WHERE number = ?', (room_number,))
        
        conn.commit()
        conn.close()
        
        add_log('delete', room_number, f"تم حذف الغرفة {room_number}")
        
        return jsonify({'success': True, 'message': 'تم حذف الغرفة بنجاح'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# الحصول على الغرف حسب الحالة
@app.route('/api/rooms/status/<status>', methods=['GET'])
def get_rooms_by_status(status):
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM rooms WHERE status = ? ORDER BY number', (status,))
        rooms = [dict(row) for row in c.fetchall()]
        conn.close()
        return jsonify({'success': True, 'rooms': rooms})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# الحصول على الإحصائيات
@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        conn = get_db()
        c = conn.cursor()
        
        c.execute('SELECT COUNT(*) as total FROM rooms')
        total = c.fetchone()['total']
        
        c.execute("SELECT COUNT(*) as available FROM rooms WHERE status = 'available'")
        available = c.fetchone()['available']
        
        c.execute("SELECT COUNT(*) as occupied FROM rooms WHERE status = 'occupied'")
        occupied = c.fetchone()['occupied']
        
        c.execute("SELECT COUNT(*) as maintenance FROM rooms WHERE status = 'maintenance'")
        maintenance = c.fetchone()['maintenance']
        
        c.execute('SELECT COUNT(*) as total_logs FROM logs')
        total_logs = c.fetchone()['total_logs']
        
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': {
                'total': total,
                'available': available,
                'occupied': occupied,
                'maintenance': maintenance,
                'totalLogs': total_logs
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# الحصول على السجلات
@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        limit = request.args.get('limit', 50, type=int)
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM logs ORDER BY id DESC LIMIT ?', (limit,))
        logs = [dict(row) for row in c.fetchall()]
        conn.close()
        return jsonify({'success': True, 'logs': logs})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    if not os.path.exists(DATABASE):
        print('📦 إنشاء قاعدة البيانات لأول مرة...')
        init_db()
    else:
        print('✅ قاعدة البيانات موجودة: hotel.db')
    
    print('🚀 تشغيل السيرفر على http://localhost:5000')
    app.run(debug=True, port=5000)
