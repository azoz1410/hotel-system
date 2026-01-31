// بيانات الغرف (نفس البيانات من app.js)
let rooms = [
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

// ترجمة حالات الغرف
const statusTranslations = {
    available: 'متاحة',
    occupied: 'محجوزة',
    maintenance: 'صيانة'
};

// متغير لتتبع الغرفة قيد التعديل
let editingRoomNumber = null;

// عرض الغرف في الجدول
function displayRoomsTable() {
    const tbody = document.getElementById('roomsTableBody');
    tbody.innerHTML = '';

    rooms.forEach(room => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${room.number}</strong></td>
            <td>${room.type}</td>
            <td><span class="status-badge status-${room.status}">${statusTranslations[room.status]}</span></td>
            <td>${room.price} ريال</td>
            <td>
                <button class="action-btn btn-edit" onclick="editRoom(${room.number})">✏️ تعديل</button>
                <button class="action-btn btn-delete" onclick="deleteRoom(${room.number})">🗑️ حذف</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// إضافة أو تعديل غرفة
document.getElementById('roomForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const roomNumber = parseInt(document.getElementById('roomNumber').value);
    const roomType = document.getElementById('roomType').value;
    const roomStatus = document.getElementById('roomStatus').value;
    const roomPrice = parseInt(document.getElementById('roomPrice').value);

    if (editingRoomNumber !== null) {
        // تعديل غرفة موجودة
        const roomIndex = rooms.findIndex(r => r.number === editingRoomNumber);
        if (roomIndex !== -1) {
            rooms[roomIndex] = {
                number: roomNumber,
                type: roomType,
                status: roomStatus,
                price: roomPrice
            };
            alert('✅ تم تعديل الغرفة بنجاح!');
            editingRoomNumber = null;
        }
    } else {
        // إضافة غرفة جديدة
        const existingRoom = rooms.find(r => r.number === roomNumber);
        if (existingRoom) {
            alert('❌ رقم الغرفة موجود بالفعل!');
            return;
        }

        rooms.push({
            number: roomNumber,
            type: roomType,
            status: roomStatus,
            price: roomPrice
        });
        alert('✅ تم إضافة الغرفة بنجاح!');
    }

    // حفظ البيانات في localStorage
    saveData();
    
    // إعادة تحميل الجدول
    displayRoomsTable();
    
    // إعادة تعيين النموذج
    this.reset();
});

// تعديل غرفة
function editRoom(roomNumber) {
    const room = rooms.find(r => r.number === roomNumber);
    if (room) {
        document.getElementById('roomNumber').value = room.number;
        document.getElementById('roomType').value = room.type;
        document.getElementById('roomStatus').value = room.status;
        document.getElementById('roomPrice').value = room.price;
        
        editingRoomNumber = roomNumber;
        
        // تمرير النموذج إلى الأعلى
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// حذف غرفة
function deleteRoom(roomNumber) {
    if (confirm(`هل أنت متأكد من حذف الغرفة رقم ${roomNumber}؟`)) {
        rooms = rooms.filter(r => r.number !== roomNumber);
        saveData();
        displayRoomsTable();
        alert('✅ تم حذف الغرفة بنجاح!');
    }
}

// حفظ البيانات في localStorage
function saveData() {
    localStorage.setItem('hotelRooms', JSON.stringify(rooms));
}

// تحميل البيانات من localStorage
function loadData() {
    const savedData = localStorage.getItem('hotelRooms');
    if (savedData) {
        rooms = JSON.parse(savedData);
    }
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    displayRoomsTable();
    console.log('✅ لوحة التحكم جاهزة');
});
