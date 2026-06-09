# Quản lý Hoạt động Liên kết (Hoạt động)

Phân hệ Hoạt động giúp Khoa và doanh nghiệp đối tác phối hợp tổ chức các sự kiện như tuyển dụng, thực tập, kiến tập, hội thảo công nghệ, tài trợ học bổng...

---

## 🔍 Chế độ hiển thị và Bộ lọc hoạt động
Giao diện hoạt động hỗ trợ 2 chế độ hiển thị tùy chọn:
1.  **Grid View (Dạng thẻ):** Trực quan hóa hoạt động dưới dạng card màu sắc, có biểu tượng theo loại hình hoạt động, hiển thị số lượng sinh viên tham gia và trạng thái hoạt động.
2.  **List View (Dạng bảng):** Dạng bảng Excel giúp so sánh nhiều trường dữ liệu và hỗ trợ checkbox để thao tác hàng loạt.

*   **Tìm kiếm:** Tìm theo tên hoạt động hoặc tên doanh nghiệp đồng tổ chức.
*   **Bộ lọc nâng cao:**
    *   *Khoảng thời gian:* Chọn ngày bắt đầu và kết thúc sự kiện bằng RangePicker.
    *   *Trạng thái:* Đề xuất, Phê duyệt nội bộ, Đã triển khai, Đã kết thúc.
    *   *Loại hoạt động:* Tuyển dụng & Thực tập, Hội thảo & Đào tạo, Tài trợ & Học bổng, Tham quan doanh nghiệp, Kiểm định & Đánh giá, Ký kết MOU, Khác.
    *   *Đối tượng hướng tới:* Sinh viên năm 1, 2, 3, 4, Mới tốt nghiệp, Giảng viên, Tất cả sinh viên.

[hình ảnh: Danh sách hoạt động liên kết dưới dạng lưới thẻ]

---

## ➕ Thêm mới và Chỉnh sửa Hoạt động
*(Chức năng dành cho ADMIN và FACULTY_MANAGER)*
1.  Nhấp nút **"Thêm hoạt động"**.
2.  Điền biểu mẫu bao gồm các thông tin:
    *   `Tên Hoạt động` *(Bắt buộc)*: Nhập tên chương trình.
    *   `Doanh nghiệp liên kết` *(Bắt buộc)*: Doanh nghiệp phối hợp tổ chức (chọn từ danh sách).
    *   `Loại hình hoạt động` (Cho phép chọn nhiều loại hình).
    *   `Đối tượng hướng tới` (Chọn các đối tượng sinh viên/giảng viên đích).
    *   `Ngày bắt đầu` *(Bắt buộc)* và `Ngày kết thúc` đợt hoạt động.
    *   `Giờ bắt đầu` và `Giờ kết thúc` (Cấu hình khung giờ chạy chương trình).
    *   `Ngày hợp tác` và `Mô tả nội dung hoạt động` (Nhập tóm tắt chương trình).
    *   `Trạng thái`: Mặc định là *Đề xuất*.
3.  Nhấp **"Lưu hoạt động"** để hoàn tất.

[hình ảnh: Biểu mẫu thêm mới hoạt động liên kết]

---

## ⚡ Cập nhật trạng thái nhanh và Thao tác hàng loạt
*   **Cập nhật trạng thái tại chỗ:** Người dùng có thể click vào ô Dropdown trạng thái ngay dưới chân của card hoạt động hoặc trong cột trạng thái của bảng để chuyển nhanh trạng thái (Ví dụ: Từ *Đề xuất* sang *Phê duyệt nội bộ*) mà không cần mở modal chỉnh sửa.
*   **Thao tác hàng loạt (Bulk Actions) trên List View:** Khi tick chọn nhiều hoạt động bằng checkbox, một thanh công cụ nổi xuất hiện ở cuối màn hình giúp:
    *   *Thay đổi trạng thái hàng loạt:* Chuyển nhanh toàn bộ hoạt động đã chọn sang trạng thái mới.
    *   *Xóa hàng loạt:* Xóa mềm toàn bộ hoạt động đã chọn.

---

## 📅 Lịch hoạt động (Calendar View)
*   Bật tab **"Lịch sự kiện"** trên menu chính của hệ thống.
*   Hiển thị tất cả các hoạt động liên kết của khoa dưới dạng lịch tuần/lịch tháng trực quan. Giúp Cán bộ điều phối dễ dàng kiểm tra lịch trình, tránh tình trạng chồng chéo thời gian hoặc quá tải hoạt động trong một tuần học.

[hình ảnh: Lịch sự kiện Calendar View trực quan]

---

## 🗑️ Drawer chi tiết & Ghi chú hoạt động
*   Khi click vào card hoạt động, một **Drawer chi tiết** sẽ trượt ra từ bên phải màn hình hiển thị toàn bộ thông tin mô tả hoạt động, danh sách các sinh viên tham gia đợt hoạt động đó, và các file tài liệu liên quan.
*   Cán bộ có thể tạo các **Ghi chú dán (Sticky Notes)** riêng cho hoạt động này trực tiếp bên trong Drawer để lưu lại các lưu ý khẩn cấp khi tổ chức sự kiện.

[hình ảnh: Drawer chi tiết hoạt động và danh sách sinh viên tham gia]
