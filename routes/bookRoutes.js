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
// 1. LUỒNG ĐỌC (READ FLOW) - DÙNG TÀI KHOẢN ĐỌC (23IT285_read)
// ==========================================
router.get('/', async (req, res) => {
  try {
    // Stateless Session: Cập nhật biến đếm lượt truy cập trong session lưu trên MongoDB Atlas
    req.session.views = (req.session.views || 0) + 1;

    console.log(`📖 [Read Flow] Đang lấy danh sách sách qua BookRead (Tài khoản Đọc: 23IT285_read)`);

    // Truy vấn dữ liệu chỉ dùng kết nối Đọc
    const books = await BookRead.find().sort({ createdAt: -1 }).lean();

    // Lấy thông báo từ session (nếu có)
    const successMessage = req.session.successMessage;
    const errorMessage = req.session.errorMessage;
    req.session.successMessage = null;
    req.session.errorMessage = null;

    res.render('index', {
      books,
      studentName: STUDENT_NAME,
      studentId: STUDENT_ID,
      vatRate: VAT_RATE,
      requiredPrefix: REQUIRED_PREFIX,
      sessionViews: req.session.views,
      sessionId: req.sessionID,
      successMessage,
      errorMessage
    });
  } catch (error) {
    console.error('❌ [Read Flow] Lỗi khi đọc dữ liệu:', error.message);
    res.status(500).render('index', {
      books: [],
      studentName: STUDENT_NAME,
      studentId: STUDENT_ID,
      vatRate: VAT_RATE,
      requiredPrefix: REQUIRED_PREFIX,
      errorMessage: `Lỗi truy vấn cơ sở dữ liệu: ${error.message}`
    });
  }
});

// ==========================================
// 2. LUỒNG GHI (WRITE FLOW) - DÙNG TÀI KHOẢN GHI (23IT285_write)
// ==========================================
router.post('/books', async (req, res) => {
  try {
    const { code, title, author, price } = req.body;

    // THUẬT TOÁN CÁ NHÂN HÓA 1: Kiểm tra tiền tố mã sản phẩm (Bắt buộc là 3 số cuối MSSV)
    if (!code || !code.trim().startsWith(REQUIRED_PREFIX)) {
      console.warn(`⚠️ [Validation] Từ chối xử lý: Mã sách '${code}' không bắt đầu bằng tiền tố '${REQUIRED_PREFIX}'`);
      req.session.errorMessage = `Từ chối xử lý! Mã sản phẩm bắt buộc phải có tiền tố là 3 số cuối MSSV của bạn (${REQUIRED_PREFIX}). Ví dụ: ${REQUIRED_PREFIX}-BOOK01`;
      return res.redirect('/');
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      req.session.errorMessage = 'Giá sách không hợp lệ! Vui lòng nhập số dương.';
      return res.redirect('/');
    }

    // THUẬT TOÁN CÁ NHÂN HÓA 2: Tính thuế suất động VAT = (Chữ số cuối MSSV + 6)%
    // Tự động tính giá sau thuế trước khi lưu xuống đám mây
    const priceWithVAT = Math.round(numPrice * (1 + VAT_RATE / 100));

    console.log(`✍️ [Write Flow] Đang lưu sách mới qua BookWrite (Tài khoản Ghi: 23IT285_write)`);
    console.log(`   - Mã: ${code} | Giá gốc: ${numPrice.toLocaleString()} VNĐ | VAT: ${VAT_RATE}% | Sau thuế: ${priceWithVAT.toLocaleString()} VNĐ`);

    // Lưu trực tiếp xuống cơ sở dữ liệu thông qua BookWrite
    await BookWrite.create({
      code: code.trim(),
      title: title ? title.trim() : '',
      author: author ? author.trim() : '',
      price: numPrice,
      vatRate: VAT_RATE,
      priceWithVAT: priceWithVAT
    });

    req.session.successMessage = `Thêm sách thành công! Mã: "${code}" | Giá sau thuế (${VAT_RATE}% VAT): ${priceWithVAT.toLocaleString('vi-VN')} VNĐ`;
    res.redirect('/');
  } catch (error) {
    console.error('❌ [Write Flow] Lỗi khi thêm sách:', error.message);
    req.session.errorMessage = `Lỗi khi lưu sách: ${error.message}`;
    res.redirect('/');
  }
});

module.exports = router;
