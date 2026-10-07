const mongoose = require('mongoose');

// Tạo kết nối riêng biệt cho tài khoản CHỈ ĐỌC (Read-Only Account: 23IT285_read)
const readConnection = mongoose.createConnection(process.env.MONGO_URI_READ);

readConnection.on('connected', () => {
  console.log('✅ [Database Cloud] Kết nối tài khoản ĐỌC (Read Connection: 23IT285_read) thành công!');
});

readConnection.on('error', (err) => {
  console.error('❌ [Database Cloud] Lỗi kết nối tài khoản ĐỌC:', err.message);
});

// Tạo kết nối riêng biệt cho tài khoản CHỈ GHI (Write-Only Account: 23IT285_write)
const writeConnection = mongoose.createConnection(process.env.MONGO_URI_WRITE);

writeConnection.on('connected', () => {
  console.log('✅ [Database Cloud] Kết nối tài khoản GHI (Write Connection: 23IT285_write) thành công!');
});

writeConnection.on('error', (err) => {
  console.error('❌ [Database Cloud] Lỗi kết nối tài khoản GHI:', err.message);
});

module.exports = {
  readConnection,
  writeConnection
};
