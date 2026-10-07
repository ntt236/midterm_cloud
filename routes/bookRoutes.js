const express = require('express');
const router = express.Router();
const { BookRead, BookWrite } = require('../models/Book');

const STUDENT_NAME = process.env.STUDENT_NAME || 'Nguyễn Thanh Triều';
const STUDENT_ID = process.env.STUDENT_ID || '23IT285';

// 3 số cuối MSSV dùng làm tiền tố bắt buộc cho mã sách
const REQUIRED_PREFIX = STUDENT_ID.slice(-3); // "285"

// Chữ số cuối MSSV dùng để tính VAT: VAT = (Chữ số cuối + 6)%
const LAST_DIGIT = parseInt(STUDENT_ID.slice(-1), 10); // 5
const VAT_RATE = LAST_DIGIT + 6; // 11%

// ==========================================
// 1. PAGE 1: LUỒNG ĐỌC (READ PAGE) - USER: 23IT285_read
// ==========================================
router.get('/', async (req, res) => {
  try {
    // Stateless Session: Cập nhật biến đếm lượt truy cập trên MongoDB Atlas
    req.session.views = (req.session.views || 0) + 1;

    console.log(`📖 [Read Flow] Truy vấn danh sách sách qua BookRead (Tài khoản Đọc: 23IT285_read)`);

    // Chỉ thực hiện truy vấn bằng kết nối Đọc
    const books = await BookRead.find().sort({ createdAt: -1 }).lean();

    const successMessage = req.session.successMessage;
    const errorMessage = req.session.errorMessage;
    req.session.successMessage = null;
    req.session.errorMessage = null;

    res.render('read', {
      books,
      studentName: STUDENT_NAME,
      studentId: STUDENT_ID,
      vatRate: VAT_RATE,
      requiredPrefix: REQUIRED_PREFIX,
      sessionViews: req.session.views,
      isReadTab: true,
      successMessage,
      errorMessage
    });
  } catch (error) {
    console.error('❌ [Read Flow] Lỗi khi đọc dữ liệu:', error.message);
    res.status(500).render('read', {
      books: [],
      studentName: STUDENT_NAME,
      studentId: STUDENT_ID,
      vatRate: VAT_RATE,
      requiredPrefix: REQUIRED_PREFIX,
      isReadTab: true,
      errorMessage: `Lỗi truy vấn cơ sở dữ liệu: ${error.message}`
    });
  }
});

// Alias cho trang đọc
router.get('/read', (req, res) => {
  res.redirect('/');
});

// ==========================================
// 2. PAGE 2: LUỒNG GHI (WRITE PAGE) - USER: 23IT285_write
// ==========================================
router.get('/write', (req, res) => {
  req.session.views = (req.session.views || 0) + 1;

  const successMessage = req.session.successMessage;
  const errorMessage = req.session.errorMessage;
  req.session.successMessage = null;
  req.session.errorMessage = null;

  res.render('write', {
    studentName: STUDENT_NAME,
    studentId: STUDENT_ID,
    vatRate: VAT_RATE,
    requiredPrefix: REQUIRED_PREFIX,
    sessionViews: req.session.views,
    isWriteTab: true,
    successMessage,
    errorMessage
  });
});

// Xử lý Gửi Form Thêm Sách (Luồng Ghi)
router.post('/write', async (req, res) => {
  try {
    const { code, title, author, price } = req.body;

    // THUẬT TOÁN 1: Kiểm tra tiền tố mã sản phẩm (Bắt buộc là 3 số cuối MSSV)
    if (!code || !code.trim().startsWith(REQUIRED_PREFIX)) {
      console.warn(`⚠️ [Validation] Từ chối: Mã '${code}' không bắt đầu bằng '${REQUIRED_PREFIX}'`);
      req.session.errorMessage = `Từ chối xử lý! Mã sản phẩm bắt buộc phải có tiền tố là 3 số cuối MSSV (${REQUIRED_PREFIX}). Ví dụ: ${REQUIRED_PREFIX}-BOOK01`;
      return res.redirect('/write');
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      req.session.errorMessage = 'Giá sách không hợp lệ! Vui lòng nhập số dương.';
      return res.redirect('/write');
    }

    // THUẬT TOÁN 2: Tính thuế VAT = (Chữ số cuối + 6)% = 11%
    const priceWithVAT = Math.round(numPrice * (1 + VAT_RATE / 100));

    console.log(`✍️ [Write Flow] Lưu sách mới qua BookWrite (Tài khoản Ghi: 23IT285_write)`);
    console.log(`   - Mã: ${code} | Giá gốc: ${numPrice} | VAT: ${VAT_RATE}% | Sau thuế: ${priceWithVAT}`);

    // Chỉ thực hiện ghi bằng kết nối Ghi
    await BookWrite.create({
      code: code.trim(),
      title: title ? title.trim() : '',
      author: author ? author.trim() : '',
      price: numPrice,
      vatRate: VAT_RATE,
      priceWithVAT: priceWithVAT
    });

    req.session.successMessage = `Thêm sách thành công! Mã: "${code}" | Giá sau thuế (${VAT_RATE}% VAT): ${priceWithVAT.toLocaleString('vi-VN')} VNĐ`;
    
    // Thêm xong chuyển về trang Xem Danh Sách để kiểm tra kết quả
    res.redirect('/');
  } catch (error) {
    console.error('❌ [Write Flow] Lỗi khi thêm sách:', error.message);
    req.session.errorMessage = `Lỗi khi lưu sách: ${error.message}`;
    res.redirect('/write');
  }
});

// Tương thích thêm route cũ /books nếu có request gửi vào
router.post('/books', (req, res, next) => {
  req.url = '/write';
  router.handle(req, res, next);
});

module.exports = router;
