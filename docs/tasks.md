# Bảng công việc (Task - Kanban Board)

Bảng công việc Kanban giúp cán bộ trong khoa điều phối công việc liên quan đến sự nghiệp hợp tác doanh nghiệp, chuẩn bị sự kiện một cách khoa học và cộng tác trực quan.

---

## 📋 Giao diện bảng Kanban và Thao tác kéo thả
Bảng Kanban phân loại công việc thành 4 cột trạng thái:
`Cần làm` ➔ `Đang thực hiện` ➔ `Đang kiểm tra` ➔ `Đã hoàn thành`

*   **Kéo thả (Drag and Drop):** Nhấp giữ thẻ nhiệm vụ và kéo thả qua lại giữa các cột trạng thái để cập nhật tiến độ công việc ngay lập tức.
*   **Khay thả nổi nhanh (Floating Drop Targets):** Khi người dùng bắt đầu kéo thẻ, một khay nổi màu đen chứa 4 vùng trạng thái sẽ tự động xuất hiện ở cuối màn hình. Bạn có thể thả thẻ nhiệm vụ trực tiếp vào các vùng này để chuyển trạng thái nhanh (rất thuận tiện trên các màn hình nhỏ).
*   **Chế độ di động:** Trên thiết bị di động, bảng tự động hiển thị thanh Tabs switch. Người dùng chỉ cần ấn nút tên trạng thái (ví dụ: *Đang thực hiện*) để xem các nhiệm vụ thuộc trạng thái đó mà không bị tràn màn hình.

[hình ảnh: Bảng công việc Kanban với 4 cột trạng thái]

---

## ➕ Tạo mới và Chỉnh sửa Nhiệm vụ
Bấm nút **"Thêm nhiệm vụ"** tại bảng Kanban để mở biểu mẫu:
*   `Tiêu đề nhiệm vụ` *(Bắt buộc - Ví dụ: Gửi scan MOU cho FPT Software)*.
*   `Trạng thái` và `Độ ưu tiên` (Cao, Trung bình, Thấp).
*   `Ngày hết hạn` (Hạn chót hoàn thành nhiệm vụ).
*   `Giao cho giảng viên/nhân viên` (Chọn nhân sự trong khoa thực hiện).
*   `Mô tả & chi tiết công việc`: 
    *   **Soạn thảo liên kết thông minh (MentionEditor):** Khi gõ kí tự `@` trong mô tả, hệ thống sẽ hiện danh sách đề xuất. Bạn có thể chọn liên kết nhanh đến một **Doanh nghiệp**, **Hoạt động**, **MOU** hoặc **Sinh viên** cụ thể.
    *   Thanh chọn nhanh ở chân biểu mẫu: Cung cấp các nút bấm `@ Doanh nghiệp`, `@ Hoạt động`, `@ MOU`, `@ Sinh viên` và nút `Đính kèm File/Audio/Ảnh` để tải tài liệu lên đính kèm vào nhiệm vụ.

[hình ảnh: Biểu mẫu tạo nhiệm vụ mới với MentionEditor hỗ trợ gõ @]
[hình ảnh: Khay thả nhanh Floating Quick Drop Target Shelf khi kéo thả thẻ nhiệm vụ]

---

## ⚡ Menu ngữ cảnh chuột phải (Context Menu)
Click chuột phải vào thẻ nhiệm vụ hoặc nhấn biểu tượng 3 chấm ở góc dưới thẻ để hiển thị menu nhanh:
*   **Thảo luận với AI (RobotOutlined):** Mở cửa sổ chat riêng với trợ lý AI (Gemini) để hỏi đáp, soạn thảo email mời đối tác, hoặc lên kế hoạch thực hiện nhiệm vụ này.
*   **Chỉnh sửa:** Mở biểu mẫu chỉnh sửa thông tin nhiệm vụ.
*   **Xóa nhiệm vụ:** Xóa thẻ nhiệm vụ khỏi bảng Kanban.
*   **Chuyển trạng thái:** Menu con hiển thị danh sách các trạng thái để chuyển nhanh không cần kéo thả.
