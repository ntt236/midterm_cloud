// Thiết lập Public DNS để đảm bảo Node.js phân giải SRV của MongoDB Atlas mượt mà trên Windows
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Bỏ qua nếu môi trường không cho phép thay đổi DNS
}

require('dotenv').config();
const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. CẤU HÌNH TEMPLATE ENGINE (HANDLEBARS)
// ==========================================
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  helpers: {
    formatCurrency: function (value) {
      if (!value && value !== 0) return '0 VNĐ';
      return Number(value).toLocaleString('vi-VN') + ' VNĐ';
    },
    eq: function (a, b) {
      return a === b;
    }
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 2. MIDDLEWARES CƠ BẢN
// ==========================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 3. KIẾN TRÚC STATELESS SESSION (MONGODB ATLAS)
// Tuyệt đối không lưu Session trong RAM máy chủ.
// Cấu hình lưu trữ tập trung Session trực tiếp xuống Cloud MongoDB Atlas.
// ==========================================
const sessionMongoUri = process.env.MONGO_URI_SESSION || process.env.MONGO_URI_WRITE;

let sessionStore;
try {
  sessionStore = MongoStore.create({
    mongoUrl: sessionMongoUri,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // Hết hạn sau 1 ngày (24 giờ)
    autoRemove: 'disabled', // Ngăn lỗi nếu quyền Atlas hạn chế tạo index tự động
    touchAfter: 24 * 3600
  });

  sessionStore.on('error', (err) => {
    console.error('⚠️ [Stateless Session Store Warning]:', err.message);
  });
} catch (err) {
  console.error('⚠️ [Stateless Session Store Init Error]:', err.message);
}

app.use(session({
  name: 'cloud_book_sid',
  secret: process.env.SESSION_SECRET || 'midterm_cloud_secret_key_23IT285',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 giờ
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // Bật secure cookie khi deploy HTTPS (Render)
  }
}));

// ==========================================
// 4. ĐIỀU HƯỚNG ROUTES (READ / WRITE)
// ==========================================
const bookRoutes = require('./routes/bookRoutes');
app.use('/', bookRoutes);

// Khởi động máy chủ
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Hệ thống Quản Lý Sách Cloud đã khởi động!`);
  console.log(`📍 Địa chỉ: http://localhost:${PORT}`);
  console.log(`👤 Sinh viên: ${process.env.STUDENT_NAME || 'Nguyễn Thanh Triều'} - MSSV: ${process.env.STUDENT_ID || '23IT285'}`);
  console.log(`⚙️  Kiến trúc: Multi-connection Least Privilege & Stateless Session`);
  console.log(`====================================================`);
});
