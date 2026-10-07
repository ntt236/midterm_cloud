const mongoose = require('mongoose');
const { readConnection, writeConnection } = require('../config/database');

const bookSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã sách không được để trống'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Tên sách không được để trống'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Tác giả không được để trống'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Giá gốc không được để trống'],
    min: [0, 'Giá sách phải lớn hơn hoặc bằng 0']
  },
  vatRate: {
    type: Number,
    required: true
  },
  priceWithVAT: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Model gắn với kết nối Đọc (Chỉ thực hiện find, query)
const BookRead = readConnection.model('Book', bookSchema);

// Model gắn với kết nối Ghi (Chỉ thực hiện create, insert)
const BookWrite = writeConnection.model('Book', bookSchema);

module.exports = {
  bookSchema,
  BookRead,
  BookWrite
};
