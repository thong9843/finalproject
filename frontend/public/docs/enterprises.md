# Quản lý Doanh nghiệp (Cty)

Phân hệ Doanh nghiệp giúp lưu trữ, tìm kiếm, cập nhật thông tin và đánh giá các đối tác liên kết của Khoa.

---

## 🔍 Tra cứu và Lọc danh sách Doanh nghiệp
Giao diện danh sách cung cấp các công cụ tìm kiếm và lọc dữ liệu mạnh mẽ để quản lý hiệu quả tệp đối tác:
*   **Thanh tìm kiếm:** Cho phép tìm kiếm nhanh doanh nghiệp theo **Tên doanh nghiệp** hoặc **Mã số thuế**.
*   **Bộ lọc nâng cao:**
    *   *Quy mô:* Lọc theo các Tier (Tier 1 - Tập đoàn/Global, Tier 2 - SME, Tier 3 - Startup/Micro).
    *   *Lĩnh vực:* Lọc theo danh mục ngành nghề (Phần mềm, Tài chính, Xây dựng, Marketing...).
    *   *Khu vực:* Lọc các doanh nghiệp có chi nhánh tại TP.HCM (checkbox "Có tại TP.HCM").
    *   *Trạng thái hợp tác:* Lọc doanh nghiệp theo trạng thái (Tiềm năng, Liên hệ, Đàm phán, Đề xuất, Đã ký hợp tác, Đang triển khai, Đã hoàn thành, Đã tạm ngưng).

[hình ảnh: Danh sách doanh nghiệp đối tác và thanh công cụ tìm kiếm, lọc]

---

## ➕ Thêm mới và Chỉnh sửa Doanh nghiệp
*(Chức năng dành cho ADMIN và FACULTY_MANAGER)*
1.  Nhấn nút **"Thêm doanh nghiệp"** ở phía trên bên phải màn hình.
2.  Điền các thông tin trong form:
    *   `Tên Doanh nghiệp` *(Bắt buộc)*: Nhập đầy đủ tên pháp nhân.
    *   `Mã số thuế` *(Nên nhập)*: Mã số thuế doanh nghiệp để tránh nhập trùng dữ liệu.
    *   `Quy mô` (Tier 1, Tier 2, Tier 3).
    *   `Lĩnh vực / Ngành nghề` (Chọn một hoặc nhiều lĩnh vực liên quan).
    *   `Bộ môn phân loại` (Bộ môn trực thuộc khoa trực tiếp phụ trách hợp tác).
    *   `Trạng thái` (Mặc định khi tạo mới là *Tiềm năng*).
    *   `Có tại TP.HCM?` (Tích chọn nếu doanh nghiệp hoạt động tại TP.HCM).
    *   `Khoa quản lý` (Trường này chỉ hiển thị khi tài khoản Admin tạo để gán cho khoa tương ứng).
3.  Nhấn **"Lưu"** để hoàn tất. Để chỉnh sửa, click biểu tượng **Chỉnh sửa** (bút chì) ở cột hành động trên dòng doanh nghiệp tương ứng.

[hình ảnh: Biểu mẫu thêm mới/cập nhật thông tin Doanh nghiệp]

---

## 🏢 Quản lý nhiều Địa chỉ và Người đại diện
Hệ thống hỗ trợ cấu hình động thông tin chi tiết của doanh nghiệp:
*   **Địa chỉ chi nhánh (Addresses):** Một doanh nghiệp có thể có nhiều cơ sở. Cho phép thêm nhiều địa chỉ khác nhau gồm các thông tin: *Tòa nhà/Đường*, *Quận/Huyện*, *Tỉnh/Thành phố*, *Quốc gia*. Cán bộ chọn 1 địa chỉ để tick làm **"Địa chỉ chính"**.
*   **Danh sách người đại diện (Representatives):** Cho phép lưu trữ thông tin của nhiều nhân sự phía đối tác gồm: *Danh xưng (Anh/Chị/Mr/Ms)*, *Họ và tên*, *Chức vụ*, *Số điện thoại*, *Email*. Người dùng chọn 1 nhân sự làm **"Đại diện chính"** để liên hệ khi có sự kiện.

---

## ⭐ Đánh giá chất lượng Doanh nghiệp (Ratings)
Giúp Khoa tổng hợp phản hồi để sàng lọc và duy trì quan hệ với các đối tác uy tín:
*   **Tiêu chí chấm điểm:** Đánh giá từ 1 đến 5 sao theo 5 tiêu chí cụ thể:
    1.  *Chỉ số Hướng dẫn (Guidance):* Chất lượng mentor của doanh nghiệp hướng dẫn sinh viên.
    2.  *Cơ sở vật chất (Facilities):* Trang thiết bị làm việc, vệ sinh, không gian làm việc.
    3.  *Cơ hội phát triển (Opportunities):* Cơ hội học hỏi thực tế, khả năng nhận làm nhân viên chính thức.
    4.  *Phối hợp thông tin (Coordination):* Mức độ phối hợp với Khoa khi gửi báo cáo, giải quyết sự cố.
    5.  *Điểm tổng quan (Overall).*
*   **Ghi chú nội bộ (Internal Note):** Các nhận xét nhạy cảm, lưu ý bảo mật về doanh nghiệp chỉ hiển thị trong nội bộ khoa.

[hình ảnh: Chi tiết doanh nghiệp và bảng đánh giá chất lượng Ratings]

---

## 🗑️ Xóa mềm và Khôi phục doanh nghiệp
*   Khi xóa một doanh nghiệp, hệ thống sẽ ẩn doanh nghiệp đó khỏi danh sách hoạt động (**Xóa mềm**) để tránh mất mát dữ liệu liên đới (MOU, hoạt động, sinh viên cũ).
*   Để khôi phục doanh nghiệp đã xóa: Bật tùy chọn **"Hiển thị đã xóa"** trong Bộ lọc ➔ Tìm doanh nghiệp cần khôi phục ➔ Click nút **"Khôi phục"**.
