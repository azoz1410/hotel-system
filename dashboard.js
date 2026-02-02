// متغيرات عامة
let allRooms = [];
let allBookings = [];
let charts = {};

// تحميل البيانات
function loadData() {
    // تحميل الغرف
    roomsRef.on('value', (snapshot) => {
        allRooms = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                allRooms.push(data[key]);
            });
        }

        updateRoomStats();
        updateCharts();
    });

    // تحميل الحجوزات
    bookingsRef.on('value', (snapshot) => {
        allBookings = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                allBookings.push({ id: key, ...data[key] });
            });
        }

        updateBookingStats();
        updateCharts();
    });
}

// تحديث إحصائيات الغرف
function updateRoomStats() {
    const total = allRooms.length;
    const available = allRooms.filter(r => r.status === 'available').length;
    const occupied = allRooms.filter(r => r.status === 'occupied').length;
    
    document.getElementById('totalRooms').textContent = total;
    document.getElementById('availableRooms').textContent = available;
    
    // حساب معدل الإشغال
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    document.getElementById('occupancyRate').textContent = occupancyRate + '%';
    
    // حساب متوسط السعر
    const avgPrice = total > 0 
        ? Math.round(allRooms.reduce((sum, r) => sum + r.price, 0) / total)
        : 0;
    document.getElementById('avgPrice').textContent = avgPrice.toLocaleString();
    
    // نسبة التغيير (افتراضية)
    const availablePercent = total > 0 ? Math.round((available / total) * 100) : 0;
    document.getElementById('availableChange').textContent = `${availablePercent}%`;
}

// تحديث إحصائيات الحجوزات
function updateBookingStats() {
    const total = allBookings.length;
    const confirmed = allBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const revenue = confirmed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
    document.getElementById('totalBookings').textContent = total;
    document.getElementById('totalRevenue').textContent = revenue.toLocaleString();
    
    // نسبة التغيير في الإيرادات (افتراضية)
    const revenueChange = revenue > 0 ? '+12%' : '0%';
    document.getElementById('revenueChange').textContent = revenueChange;
}

// تحديث الرسوم البيانية
function updateCharts() {
    updateRoomStatusChart();
    updateBookingStatusChart();
    updateRoomTypesChart();
    updateRevenueChart();
}

// رسم بياني لحالات الغرف
function updateRoomStatusChart() {
    const ctx = document.getElementById('roomStatusChart');
    
    const available = allRooms.filter(r => r.status === 'available').length;
    const occupied = allRooms.filter(r => r.status === 'occupied').length;
    const maintenance = allRooms.filter(r => r.status === 'maintenance').length;
    
    if (charts.roomStatus) {
        charts.roomStatus.destroy();
    }
    
    charts.roomStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['متاحة', 'محجوزة', 'صيانة'],
            datasets: [{
                data: [available, occupied, maintenance],
                backgroundColor: [
                    'rgba(16, 172, 132, 0.8)',
                    'rgba(238, 90, 111, 0.8)',
                    'rgba(255, 183, 77, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'Inter',
                            size: 12
                        },
                        padding: 15
                    }
                }
            }
        }
    });
}

// رسم بياني لحالات الحجوزات
function updateBookingStatusChart() {
    const ctx = document.getElementById('bookingStatusChart');
    
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const confirmed = allBookings.filter(b => b.status === 'confirmed').length;
    const completed = allBookings.filter(b => b.status === 'completed').length;
    const cancelled = allBookings.filter(b => b.status === 'cancelled').length;
    
    if (charts.bookingStatus) {
        charts.bookingStatus.destroy();
    }
    
    charts.bookingStatus = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['معلقة', 'مؤكدة', 'مكتملة', 'ملغاة'],
            datasets: [{
                label: 'عدد الحجوزات',
                data: [pending, confirmed, completed, cancelled],
                backgroundColor: [
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(23, 162, 184, 0.8)',
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(220, 53, 69, 0.8)'
                ],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            family: 'Inter'
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Inter'
                        }
                    }
                }
            }
        }
    });
}

// رسم بياني لأنواع الغرف
function updateRoomTypesChart() {
    const ctx = document.getElementById('roomTypesChart');
    
    const typeCounts = {};
    allRooms.forEach(room => {
        typeCounts[room.type] = (typeCounts[room.type] || 0) + 1;
    });
    
    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);
    
    if (charts.roomTypes) {
        charts.roomTypes.destroy();
    }
    
    charts.roomTypes = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(237, 100, 166, 0.8)',
                    'rgba(255, 154, 158, 0.8)',
                    'rgba(255, 183, 77, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'Inter',
                            size: 12
                        },
                        padding: 15
                    }
                }
            }
        }
    });
}

// رسم بياني للإيرادات الشهرية
function updateRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    
    // تجميع الإيرادات حسب الشهر
    const monthlyRevenue = {};
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                   'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    allBookings.forEach(booking => {
        if (booking.status === 'confirmed' || booking.status === 'completed') {
            const date = new Date(booking.createdAt);
            const month = months[date.getMonth()];
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + booking.totalPrice;
        }
    });
    
    const labels = Object.keys(monthlyRevenue);
    const data = Object.values(monthlyRevenue);
    
    // إذا لم تكن هناك بيانات، عرض بيانات افتراضية للأشهر الستة الماضية
    if (labels.length === 0) {
        const currentMonth = new Date().getMonth();
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            labels.push(months[monthIndex]);
            data.push(Math.floor(Math.random() * 10000) + 5000);
        }
    }
    
    if (charts.revenue) {
        charts.revenue.destroy();
    }
    
    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'الإيرادات (ريال)',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + ' ر.س';
                        },
                        font: {
                            family: 'Inter'
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Inter'
                        }
                    }
                }
            }
        }
    });
}

// تصدير التقرير
function exportReport() {
    const reportData = {
        generatedAt: new Date().toISOString(),
        summary: {
            totalRooms: allRooms.length,
            availableRooms: allRooms.filter(r => r.status === 'available').length,
            occupiedRooms: allRooms.filter(r => r.status === 'occupied').length,
            totalBookings: allBookings.length,
            totalRevenue: allBookings
                .filter(b => b.status === 'confirmed' || b.status === 'completed')
                .reduce((sum, b) => sum + b.totalPrice, 0)
        },
        rooms: allRooms,
        bookings: allBookings
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `hotel-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('✅ تم تصدير التقرير بنجاح!', 'success');
}

// التهيئة
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 جاري تحميل لوحة الإحصائيات...');
    loadData();
    console.log('✅ لوحة الإحصائيات جاهزة');
});
