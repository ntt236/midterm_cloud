# Hệ Thống Quản Lý Sách Cloud (Cloud Book Management)
**Môn học:** Điện toán đám mây - Kiểm tra Giữa kì  
**Sinh viên thực hiện:** Nguyễn Thanh Triều  
**Mã số sinh viên (MSSV):** 23IT285  

---

## 1. Kiến trúc Bảo mật Cơ sở dữ liệu Cloud (Least Privilege)
- **Cơ sở dữ liệu:** `DB_23IT285` trên dịch vụ đám mây MongoDB Atlas.
- **Áp dụng nguyên tắc đặc quyền tối thiểu (Least Privilege):**
  - **Tài khoản Đọc (`23IT285_read`):** Chỉ có đặc quyền `read` trên database `DB_23IT285`. Dùng riêng biệt cho luồng truy vấn danh sách sách (Read Flow). Mọi hành vi cố gắng ghi (insert/update/delete) từ tài khoản này đều bị MongoDB từ chối.
  - **Tài khoản Ghi (`23IT285_write`):** Có đặc quyền ghi trên database `DB_23IT285`. Dùng riêng biệt cho luồng thêm sách mới (Write Flow).

---

## 2. Logic Backend & Kiến trúc Stateless
- **Đa luồng kết nối đồng thời (Multi-Connection):**
  - Sử dụng `mongoose.createConnection()` khởi tạo độc lập 2 kết nối tới MongoDB Atlas:
    - `readConnection`: Gắn với URI của tài khoản `23IT285_read`.
    - `writeConnection`: Gắn với URI của tài khoản `23IT285_write`.
  - Tự động điều hướng luồng nghiệp vụ:
    - Xem danh sách sách (`GET /`): Định tuyến sang model `BookRead`.
    - Thêm sách mới (`POST /books`): Định tuyến sang model `BookWrite`.
- **Stateless Session (Kiến trúc phân tán không trạng thái):**
  - Tuyệt đối không lưu Session trong RAM máy chủ.
  - Cấu hình `express-session` kết hợp `connect-mongo` để lưu trữ tập trung Session ID và dữ liệu phiên người dùng trực tiếp xuống Cloud MongoDB Atlas (Collection `sessions`).
  - Đảm bảo hệ thống có thể Auto-scaling (thêm/bớt máy chủ) trên Cloud mà người dùng không bị mất phiên làm việc.
- **Thuật toán cá nhân hóa:**
  - **Bộ lọc tiền tố mã sách:** Mã sách bắt buộc phải có tiền tố là 3 số cuối MSSV (**`285`**). Ví dụ: `285-JS01`, `285-CLOUD`. Nếu không có tiền tố này, hệ thống lập tức từ chối xử lý và phát cảnh báo lỗi.
  - **Thuế suất VAT động:** Tính theo công thức `VAT = (Chữ số cuối MSSV + 6)% = (5 + 6)% = 11%`.
  - **Giá sau thuế:** Tính toán tự động `Giá sau thuế = Giá gốc * (1 + 11%)` trước khi lưu xuống database và render ra giao diện Handlebars.
  - **Footer giao diện:** Hiển thị bắt buộc Họ tên (Nguyễn Thanh Triều), MSSV (23IT285) và Mức VAT áp dụng (11%).

---

## 3. Cấu hình Biến môi trường (.env)
File `.env` được bảo mật bằng `.gitignore` và không bao giờ được commit lên GitHub:
```env
PORT=3000
STUDENT_NAME=Nguyễn Thanh Triều
STUDENT_ID=23IT285

MONGO_URI_READ=mongodb+srv://23IT285_read:ntt236@cluster0.meu96pm.mongodb.net/DB_23IT285?retryWrites=true&w=majority&appName=Cluster0
MONGO_URI_WRITE=mongodb+srv://23IT285_write:ntt236@cluster0.meu96pm.mongodb.net/DB_23IT285?retryWrites=true&w=majority&appName=Cluster0
MONGO_URI_SESSION=mongodb+srv://nguyenthanhtrieu236_db_user:ntt236@cluster0.meu96pm.mongodb.net/DB_23IT285?retryWrites=true&w=majority&appName=Cluster0

SESSION_SECRET=midterm_cloud_secret_key_23IT285_stateless
```

---

## 4. Quy trình Git & Kiểm soát DevOps
Mã nguồn được phát triển tuân thủ quy trình Git Flow với 2 nhánh tính năng (feature branches) và gộp nhánh bằng cờ `--no-ff` để bảo toàn lịch sử nút gộp:
1. Nhánh `feature/database`: Triển khai kiến trúc kết nối đa luồng Read/Write và Book Model.
2. Nhánh `feature/session`: Triển khai Stateless Session qua `connect-mongo`, template Handlebars và các route xử lý.
3. Gộp cả 2 nhánh về nhánh `main` với lệnh:
   ```bash
   git checkout main
   git merge --no-ff feature/database -m "Merge branch 'feature/database' into main: Tích hợp kiến trúc đa kết nối Read/Write Database"
   git merge --no-ff feature/session -m "Merge branch 'feature/session' into main: Tích hợp kiến trúc Stateless Session trên MongoDB Atlas"
   ```

---

## 5. Hướng dẫn Triển khai PaaS (Render)
1. Đẩy mã nguồn lên kho chứa GitHub ở chế độ **Private**.
2. Thêm Giảng viên chấm bài vào danh sách **Collaborators** trên GitHub repo.
3. Tạo **Web Service** mới trên [Render.com](https://render.com) liên kết với repo GitHub này.
4. Cấu hình các thông số:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Cấu hình toàn bộ các biến môi trường trong mục **Environment Variables** trên Render:
   - `STUDENT_NAME`: `Nguyễn Thanh Triều`
   - `STUDENT_ID`: `23IT285`
   - `MONGO_URI_READ`: `<Chuỗi kết nối đọc>`
   - `MONGO_URI_WRITE`: `<Chuỗi kết nối ghi>`
   - `MONGO_URI_SESSION`: `<Chuỗi kết nối session>`
   - `SESSION_SECRET`: `<Secret key>`
