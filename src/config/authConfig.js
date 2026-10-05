// =========================================================================================
// 🔑 CẤU HÌNH GOOGLE CLIENT ID (GOOGLE IDENTITY SERVICES)
// =========================================================================================
// 👉 HÃY THAY THẾ CHUỖI DƯỚI ĐÂY BẰNG CLIENT ID CỦA BẠN TỪ GOOGLE CLOUD CONSOLE:
// Ví dụ mẫu: "1234567890-abcdefg123456.apps.googleusercontent.com"
// =========================================================================================

export const GOOGLE_CLIENT_ID = "ĐIỀN_CLIENT_ID_CỦA_BẠN_VÀO_ĐÂY";

// =========================================================================================
// Hướng dẫn lấy Google Client ID:
// 1. Truy cập: https://console.cloud.google.com/apis/credentials
// 2. Tạo một dự án mới hoặc chọn dự án có sẵn.
// 3. Vào "Credentials" -> "Create Credentials" -> "OAuth client ID".
// 4. Chọn Application type: "Web application".
// 5. Thêm "Authorized JavaScript origins":
//    - http://localhost:5173
//    - http://localhost:3000
//    - http://127.0.0.1:5500
//    - (hoặc domain trang web của bạn)
// 6. Copy Client ID và dán vào biến GOOGLE_CLIENT_ID ở trên!
// =========================================================================================
