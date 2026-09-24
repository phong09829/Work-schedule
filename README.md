# ⏱️ FocusFlow - Lịch Trình, Google Calendar 2-Way Sync & Pomodoro Toàn Diện

> **Tác giả:** [phong09829](https://github.com/phong09829)  
> **Repository:** [Work-schedule](https://github.com/phong09829/Work-schedule.git)  
> **Dự án:** Web Lịch Trình, Quản Lý Thời Gian & Đồng Bộ Google Calendar 2 Chiều với ReactJS, Google Identity Services, Google Calendar API v3, TailwindCSS, Chart.js & Web Audio API.

---

## 🌟 Các Tính Năng Nổi Bật

### 1. 🔐 Đăng Nhập Google OAuth 2.0 & Bảo Mật
- Tích hợp chuẩn **Google Identity Services (GIS)** với luồng xác thực OAuth 2.0 an toàn.
- Lưu trữ access token và thông tin profile (Avatar, Tên, Email) an toàn trong ứng dụng.
- Tự động kiểm tra hạn token, hỗ trợ đăng xuất và làm mới quyền truy cập.

### 2. 🔄 Đồng Bộ Google Calendar 2 Chiều Thời Gian Thực
- Sử dụng **Google Calendar API v3** chính thức.
- **Thao tác 2 chiều tức thì**: Mọi sự kiện **Thêm, Sửa, Xóa** trên web đều tự động đồng bộ ngay lập tức với Google Calendar của tài khoản vừa đăng nhập, và ngược lại.
- Nút **"Đồng bộ Google"** với hiệu ứng xoay thời gian thực, tự động lấy toàn bộ sự kiện từ Google Calendar về bảng lịch.
- Tự động liên kết công việc (Task Kanban) có deadline sang Lịch Trình Google Calendar.

### 3. 📅 Giao Diện & Tiện Ích Lịch Giống Google Schedule
- **Chế độ xem đa dạng**:
  - 📆 **Xem Tháng (Month View)**: Lưới 42 ô chuẩn xác, hiển thị huy hiệu sự kiện, màu sắc theo danh mục, hỗ trợ kéo thả sự kiện giữa các ngày.
  - 🕒 **Xem Tuần (Week View)**: Timeline 24 giờ với thanh chỉ thị thời gian thực (Live red line), hiển thị sự kiện theo khung giờ chính xác.
  - ☀️ **Xem Ngày (Day View)**: Chi tiết từng khung giờ trong ngày, hỗ trợ bấm vào bất kỳ giờ nào để tạo lịch nhanh.
  - 📝 **Lịch Biểu (Schedule / Agenda View)**: Danh sách sự kiện trực quan theo ngày (Hôm nay, Ngày mai...), tích hợp nút tham gia Google Meet và chạy Pomodoro trong 1 click.
- **Xử lý múi giờ chuẩn xác**: Hỗ trợ chuẩn ISO-8601 với Timezone offset (GMT+7 `Asia/Ho_Chi_Minh`) tương thích hoàn hảo với Google Calendar API.

### 4. 📋 Bảng Việc Kanban & ⏱️ Đồng Hồ Pomodoro
- Bảng việc Kanban kéo thả: *Cần Làm*, *Đang Làm*, *Hoàn Thành*.
- Pomodoro 3 chế độ (Focus 25p, Short Break 5p, Long Break 15p) kèm âm thanh chuông báo Web Audio API synthesizer và hiệu ứng pháo hoa Confetti 🎉.
- Kết nối sự kiện lịch trình và công việc trực tiếp vào vòng lặp tập trung Focus.

### 5. 📊 Dashboard Thống Kê Năng Suất & Sao Lưu JSON
- Biểu đồ cột Chart.js 7 ngày, tỷ lệ hoàn thành mục tiêu, chuỗi streak 🔥.
- Hỗ trợ xuất (Export) và nhập (Import) dữ liệu sao lưu `.json`.
- Giao diện Glassmorphism hiện đại hỗ trợ Dark Mode / Light Mode và 100% Responsive trên Mobile & Desktop.

---

## 🚀 Hướng Dẫn Cài Đặt & Cấu Hình Google OAuth

### 1. Tạo Google OAuth Client ID trên Google Cloud Console
1. Truy cập [Google Cloud Console](https://console.cloud.google.com).
2. Tạo 1 Project mới (hoặc chọn Project sẵn có).
3. Vào mục **APIs & Services** > **Library**, tìm kiếm và **Bật (Enable) Google Calendar API**.
4. Vào **APIs & Services** > **Credentials** > **Create Credentials** > chọn **OAuth Client ID** (loại **Web application**).
5. Trong mục **Authorized JavaScript origins**, thêm URL trang web của bạn (ví dụ: `http://localhost:5173`, `http://localhost:3000` hoặc domain Vercel/Netlify của bạn).
6. Sao chép **Client ID** (dạng `...apps.googleusercontent.com`).

### 2. Đăng Nhập & Kích Hoạt Đồng Bộ trên Ứng Dụng
1. Mở ứng dụng, bấm vào nút **"Google Sync"** hoặc **"Cài đặt OAuth"**.
2. Dán Google Client ID vào ô nhập và bấm **Lưu**.
3. Bấm **"Đăng Nhập Với Google & Bật Đồng Bộ"** và cấp quyền truy cập Google Calendar.
4. Xong! Mọi thao tác thêm/sửa/xóa trên web sẽ đồng bộ 2 chiều với Google Calendar của bạn.

---

## 💻 Chạy Ứng Dụng Trực Tiếp (Local)

Mở file `index.html` trực tiếp bằng trình duyệt hoặc khởi chạy qua bất kỳ static server nào:
```bash
# Sử dụng Python
python -m http.server 5173

# Hoặc sử dụng Node/Vite (nếu có Node.js)
npm run dev
```
Truy cập: `http://localhost:5173`

---

## 🌐 Triển Khai (Deployment)
- Đã cấu hình sẵn `vercel.json` và `netlify.toml` cho triển khai SPA.
- Tương thích tốt với GitHub Pages, Vercel, Netlify.
