# Hướng dẫn sử dụng các công cụ nâng cao

*(Chức năng dành cho ADMIN và FACULTY_MANAGER)*

---

## 🤖 1. Trợ lý ảo AI Chatbot (VLU AI Assistant)
Trợ lý ảo thông minh hỗ trợ tương tác và khai thác dữ liệu trực tiếp trong hệ thống:
1.  **Hộp thoại Trò chuyện (Chatbot Widget):** Bấm vào biểu tượng Robot trên thanh Header để mở hộp thoại trò chuyện trực tiếp từ bất kỳ trang nào.
2.  **Hỏi đáp thông tin:** Hỗ trợ truy vấn nhanh các số liệu thống kê bằng ngôn ngữ tự nhiên (Ví dụ: *"Có bao nhiêu doanh nghiệp thuộc khoa CNTT?"*, *"Thống kê số sinh viên thực tập tại công ty X"*).
3.  **Phân tích hình ảnh:** Tải tệp ảnh lên (như ảnh biên bản, ảnh sự kiện, hóa đơn...) để nhờ AI phân tích, đọc chữ hoặc tóm tắt nội dung.
4.  **Tích hợp ghi chú:** Chuyển đổi câu trả lời hoặc kết quả gợi ý của AI trực tiếp thành các thẻ ghi chú dán (Sticky Note) nhiều màu sắc trong không gian làm việc cá nhân chỉ bằng một cú click.

![Giao diện trợ lý ảo AI Chatbot trong hệ thống](https://firebasestorage.googleapis.com/v0/b/quan-ly-doanh-nghiep-vlu.firebasestorage.app/o/docs%2Fchatbot%2FChatbot.png?alt=media&token=e144a71b-a71b-4d95-9465-f2561c53b00e)

---

## 🔗 2. Xử lý dữ liệu trùng lặp (Duplicate Merger)
Công cụ dọn dẹp hệ thống dành riêng cho tài khoản Admin khi phát hiện nhiều cán bộ nhập trùng tên doanh nghiệp hoặc mã số thuế:
1.  Truy cập **"Công cụ khác"** ➔ Chọn **"Xử lý dữ liệu trùng lặp"**.
2.  Hệ thống hiển thị danh sách các bản ghi bị trùng tên hoặc trùng mã số thuế.
3.  Bấm nút **"Gộp (Merge)"**: Chọn một bản ghi chính xác làm bản ghi gốc.
4.  **Cơ chế gộp an toàn:** Hệ thống tự động chuyển toàn bộ các dữ liệu liên đới gồm biên bản MOU, hoạt động liên kết, và sinh viên đang thực tập từ các bản ghi trùng lặp sang liên kết với bản ghi gốc đã chọn, sau đó mới tiến hành xóa các bản ghi thừa, đảm bảo tuyệt đối không làm mất dữ liệu của bất kỳ khoa nào.

![Giao diện dọn dẹp và gộp doanh nghiệp trùng lặp](https://firebasestorage.googleapis.com/v0/b/quan-ly-doanh-nghiep-vlu.firebasestorage.app/o/docs%2Fadvances%2Fdulieutrunglap.png?alt=media&token=18344037-5e63-4543-8049-5a4d54b6ec0d)

---

## ⚙️ 3. Thao tác dữ liệu hàng loạt (Bulk Data Tool)
Công cụ xử lý nhanh lượng lớn doanh nghiệp (Chỉ dành cho ADMIN):
1.  Truy cập **"Công cụ khác"** ➔ Chọn **"Xử lý dữ liệu hàng loạt"**.
2.  Tick chọn các doanh nghiệp cần xử lý trong danh sách.
3.  Lựa chọn hành động xử lý hàng loạt:
    *   *Đổi trạng thái hàng loạt:* Chuyển cùng lúc nhiều doanh nghiệp sang trạng thái "Đã ký hợp tác" hoặc "Đang triển khai".
    *   *Chuyển quyền quản lý Khoa:* Chuyển giao quyền quản lý các doanh nghiệp được chọn sang cho khoa khác phụ trách.
    *   *Xóa mềm hàng loạt:* Xóa nhanh các doanh nghiệp không còn liên kết hoạt động.

![Giao diện thao tác thay đổi dữ liệu hàng loạt](https://firebasestorage.googleapis.com/v0/b/quan-ly-doanh-nghiep-vlu.firebasestorage.app/o/docs%2Fadvances%2Fdulieuhangloat.png?alt=media&token=a7b6244b-a753-46de-b5fe-d8023223d036)

---

## 📁 4. Quản lý Thư mục Tài liệu (File Manager)
Hệ thống tích hợp trình quản lý tệp tin trực quan cho mỗi khoa:
*   **Cấu trúc thư mục:** Tự động tạo thư mục con lưu trữ tài liệu riêng biệt cho từng Doanh nghiệp và từng MOU.
*   **Thao tác:** Hỗ trợ tạo thư mục mới, tải trực tiếp các tệp tin scan hợp đồng, tài liệu, hình ảnh sự kiện.
*   **Thùng rác tài liệu:** Các file xóa đi sẽ được đưa vào thùng rác riêng của File Manager để hỗ trợ khôi phục hoặc xóa vĩnh viễn nhằm giải phóng dung lượng lưu trữ.

![Trình quản lý tệp tin và cây thư mục tài liệu theo doanh nghiệp](https://firebasestorage.googleapis.com/v0/b/quan-ly-doanh-nghiep-vlu.firebasestorage.app/o/docs%2FQu%E1%BA%A3n%20l%C3%BD%20file.png?alt=media&token=48c42f55-9982-40f8-82e1-023c5305ebaa)

---

## 📜 5. Nhật ký hoạt động & Lịch sử thay đổi (History Log)
Để đảm bảo tính minh bạch và an toàn dữ liệu, mọi thao tác thay đổi dữ liệu đều được ghi vết:
*   **Nhật ký hệ thống:** Lưu lại lịch sử hành động (CREATE - Tạo mới, UPDATE - Cập nhật, DELETE - Xóa, RESTORE - Khôi phục), tên tài khoản thực hiện, thời gian thực hiện và tên đối tượng bị thay đổi.
*   **So sánh chi tiết thay đổi:** Người dùng có thể click chọn xem chi tiết để xem sự thay đổi giá trị của dữ liệu (Giá trị cũ ➔ Giá trị mới) dưới dạng định dạng JSON chi tiết để dễ dàng đối soát khi xảy ra tranh chấp hoặc lỗi nhập liệu.

![Nhật ký hệ thống và chi tiết so sánh giá trị JSON](https://firebasestorage.googleapis.com/v0/b/quan-ly-doanh-nghiep-vlu.firebasestorage.app/o/docs%2Fadvances%2Fhistory.png?alt=media&token=b007cc24-ff6b-43cd-9688-73ceb48e06ef)
