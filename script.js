// تكوين Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCe5FOdJQZHM5Ii3MJcqPlvVj957oupsqI",
    authDomain: "gymapp-40351.firebaseapp.com",
    projectId: "gymapp-40351",
    storageBucket: "gymapp-40351.firebasestorage.app",
    messagingSenderId: "577751207806",
    appId: "1:577751207806:web:0c655b820b1427db796d2f",
    measurementId: "G-9JL2J919D3"
};

// تهيئة Firebase
let app;
try {
    app = firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
    showToast('خطأ في تهيئة التطبيق', 'error');
}

const db = firebase.firestore();
const membersCollection = db.collection('members');
const auth = firebase.auth();

// دالة عرض الإشعارات
function showToast(message, type = 'info') {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: 'center',
        backgroundColor: 
            type === 'success' ? '#22c55e' : 
            type === 'error' ? '#ef4444' : 
            type === 'warning' ? '#eab308' : '#2563eb',
        className: "rtl-toast",
    }).showToast();
}

// تسجيل الدخول كمجهول
async function initializeAuth() {
    try {
        await auth.signInAnonymously();
        console.log("تم تسجيل الدخول بنجاح");
        showToast('تم تسجيل الدخول بنجاح', 'success');
        listenForMemberUpdates();
    } catch (error) {
        console.error("خطأ في تسجيل الدخول:", error);
        showToast('فشل تسجيل الدخول: ' + error.message, 'error');
        // إعادة المحاولة بعد 3 ثواني
        setTimeout(initializeAuth, 3000);
    }
}

// التعامل مع الكاميرا
let stream = null;

async function startCamera() {
    const video = document.getElementById('cameraPreview');
    const captureBtn = document.getElementById('captureBtn');
    
    try {
        // إيقاف أي stream سابق
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        video.srcObject = stream;
        video.style.display = 'block';
        captureBtn.style.display = 'block';
        await video.play();
        
        showToast('تم تشغيل الكاميرا بنجاح', 'success');
    } catch (err) {
        console.error("Error accessing camera:", err);
        showToast('فشل في الوصول للكاميرا. تأكد من السماح بالوصول.', 'error');
    }
}

// التقاط الصورة
document.getElementById('captureBtn').addEventListener('click', () => {
    const video = document.getElementById('cameraPreview');
    const canvas = document.getElementById('photoCanvas');
    const context = canvas.getContext('2d');

    // تعيين أبعاد الكانفاس لتطابق الفيديو
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // رسم الإطار الحالي من الفيديو على الكانفاس
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // تحويل الصورة إلى Base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // إيقاف تشغيل الكاميرا وإخفاء عناصر الواجهة
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    video.style.display = 'none';
    document.getElementById('captureBtn').style.display = 'none';
    
    showToast('تم التقاط الصورة بنجاح', 'success');
    
    // تخزين الصورة للاستخدام لاحقاً
    window.capturedImage = imageData;
});

// معالجة اختيار الصورة من المعرض
document.getElementById('memberGallery').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            window.capturedImage = event.target.result;
            showToast('تم اختيار الصورة بنجاح', 'success');
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

// تحديث قائمة الأعضاء والإحصائيات
function updateMembersList() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterValue = document.getElementById('memberFilter').value;
    const memberCards = document.querySelectorAll('.member-card');
    
    let totalActive = 0;
    let totalExpiring = 0;
    let totalVisible = 0;
    
    memberCards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const phone = card.querySelector('p').textContent.toLowerCase();
        const status = card.querySelector('.status-active, .status-expired, .status-warning');
        
        const isActive = status.classList.contains('status-active');
        const isExpiring = status.classList.contains('status-warning');
        
        const matchesSearch = name.includes(searchTerm) || phone.includes(searchTerm);
        const matchesFilter = filterValue === 'all' ||
                            (filterValue === 'active' && isActive) ||
                            (filterValue === 'expired' && status.classList.contains('status-expired'));
        
        if (matchesSearch && matchesFilter) {
            card.style.display = '';
            totalVisible++;
            if (isActive) totalActive++;
            if (isExpiring) totalExpiring++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // تحديث الإحصائيات
    document.getElementById('totalMembers').textContent = totalVisible;
    document.getElementById('activeMembers').textContent = totalActive;
    document.getElementById('expiringMembers').textContent = totalExpiring;
}

// تحديث الإحصائيات عند البحث أو الفلترة
document.getElementById('searchInput').addEventListener('input', updateMembersList);
document.getElementById('memberFilter').addEventListener('change', updateMembersList);

// استدعاء وظيفة تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    const today = new Date();
    document.getElementById('memberStartDate').value = today.toISOString().split('T')[0];
});

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log("Service Worker Registered"))
        .catch(err => console.error("Service Worker Registration Failed:", err));
}
