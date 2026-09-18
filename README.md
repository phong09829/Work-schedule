# ⏱️ FocusFlow - Ứng Dụng Quản Lý Thời Gian & Pomodoro Toàn Diện

> **Tác giả:** [phong09829](https://github.com/phong09829)  
> **Dự án:** Web Time Management App (SPA) với ReactJS, TailwindCSS, Chart.js & Web Audio API.

---

## 🌟 Các Tính Năng Nổi Bật

- 📊 **Dashboard & Analytics**: Thống kê số việc đã làm, số giờ tập trung, chuỗi streak 🔥 và biểu đồ năng suất 7 ngày với Chart.js.
- 📋 **Bảng Việc Kanban Thông Minh**: Kéo thả (Drag & Drop) qua 3 trạng thái: *Cần Làm*, *Đang Làm*, *Hoàn Thành*. Đầy đủ Tag/Category, Priority (Cao, Vừa, Thấp) và Deadline.
- ⏱️ **Đồng Hồ Pomodoro Tích Hợp**: 3 chế độ (Focus 25p, Short Break 5p, Long Break 15p), chuông báo Synth Web Audio API, tự động chuyển vòng và gắn trực tiếp vào công việc đang làm.
- 🎨 **Giao Diện UI/UX Hiện Đại**: Hỗ trợ Dark Mode / Light Mode, thiết kế Glassmorphism, hiệu ứng Confetti 🎉 và Responsive 100% trên PC & Mobile.
- 💾 **Lưu Trữ & Khôi Phục Dữ Liệu**: Tự động lưu vào `LocalStorage`, hỗ trợ xuất (Export) và nhập (Import) file `.json` sao lưu.

---

## 🚀 Triển Khai & Cài Đặt

### 1. Chạy trực tiếp (Local)
Mở file `index.html` trên trình duyệt hoặc chạy server nội bộ:
```bash
python -m http.server 5173
```
Truy cập: `http://localhost:5173`

### 2. Triển khai lên Vercel / Netlify
- Đã có sẵn cấu hình `vercel.json` và `netlify.toml` phục vụ định tuyến Single Page Application.
- Nhập repository từ GitHub vào Vercel/Netlify để deploy tự động trong 1 click.
