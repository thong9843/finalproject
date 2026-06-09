# Quản lý Sinh viên Thực tập (HS)

Phân hệ Sinh viên hỗ trợ Khoa quản lý toàn diện quá trình đi thực tập, kiến tập của sinh viên tại các doanh nghiệp đối tác.

---

## 🔍 Tra cứu và Lọc danh sách sinh viên
*   **Tìm kiếm nhanh:** Tìm kiếm sinh viên theo **Họ và tên** hoặc **Mã số sinh viên (MSSV)**.
*   **Bộ lọc nâng cao:**
    *   *Ngành học & Lớp học:* Lọc sinh viên theo lớp sinh hoạt hoặc chuyên ngành.
    *   *Doanh nghiệp thực tập:* Lọc sinh viên đang làm việc tại một doanh nghiệp cụ thể.
    *   *Giảng viên hướng dẫn:* Lọc danh sách sinh viên do giảng viên phụ trách chấm điểm và theo dõi.
    *   *Trạng thái thực tập:* Lọc theo tiến độ gồm: `Chờ phân công`, `Đang thực tập`, `Hoàn thành`, `Đã nghỉ`.

[hình ảnh: Danh sách sinh viên thực tập và bộ lọc thông tin]

---

## ➕ Thêm mới và Chỉnh sửa Sinh viên
1.  Nhấp nút **"Thêm sinh viên"** (chỉ hiển thị với Admin và Faculty Manager).
2.  Nhập đầy đủ thông tin biểu mẫu bao gồm:
    *   `MSSV` *(Bắt buộc)*: Mã số sinh viên của trường VLU.
    *   `Họ và tên` *(Bắt buộc)*.
    *   `Email` (Email Office 365 sinh viên: `@vlu.edu.vn`).
    *   `Ngành học` và `Lớp` sinh hoạt.
    *   `GPA`: Điểm trung bình học tập tích lũy.
    *   `Giảng viên hướng dẫn`: Giảng viên phụ trách hướng dẫn thực tập.
    *   `Công ty thực tập`: Doanh nghiệp tiếp nhận sinh viên làm việc.
    *   `Vị trí thực tập` (Ví dụ: Thực tập sinh NodeJS, Thực tập sinh Designer).
    *   `Trạng thái`: Trạng thái thực tập (Chờ phân công, Đang thực tập, Hoàn thành, Đã nghỉ).
    *   `Ngày bắt đầu` và `Ngày kết thúc`: Thời gian diễn ra đợt thực tập.
    *   `Khoa quản lý` (Chỉ hiện khi Admin tạo).
3.  Nhấn **"Lưu"**. Để sửa thông tin, click nút **"Chỉnh sửa"** (biểu tượng bút chì) trên dòng tương ứng của sinh viên.

[hình ảnh: Hộp thoại phân công/cập nhật sinh viên thực tập]

---

## 👥 Phân công thực tập & Theo dõi tiến độ
*   **Quy trình phân công:** Cán bộ chọn sinh viên có trạng thái "Chờ phân công", cập nhật thông tin *Công ty thực tập*, *Giảng viên hướng dẫn*, *Vị trí thực tập* và chuyển trạng thái sang "Đang thực tập".
*   **Ghi chú dán (Sticky Notes):** Trong trang chi tiết sinh viên, giảng viên hướng dẫn có thể tạo các ghi chú dán nhanh để theo dõi tình hình làm việc, ý thức kỷ luật hoặc tiến độ nộp báo cáo hàng tuần của sinh viên.
*   **Xuất Excel:** Nhấn nút **"Xuất Excel"** để tải danh sách sinh viên thực tập đã lọc ra tệp Excel phục vụ báo cáo khoa hoặc hội đồng thực tập.

---

## 🗑️ Xóa mềm và Khôi phục sinh viên
*   Khi xóa sinh viên, hệ thống sẽ đưa sinh viên vào trạng thái **Xóa mềm** để bảo toàn lịch sử thống kê hoạt động trước đây.
*   Để phục hồi sinh viên đã xóa: Chọn **"Hiển thị đã xóa"** trong Bộ lọc ➔ Tìm sinh viên cần khôi phục ➔ Click nút **"Khôi phục"**.
