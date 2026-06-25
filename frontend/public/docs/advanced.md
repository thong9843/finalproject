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

## 📂 2. Import dữ liệu bằng AI
Để giảm thiểu thời gian nhập liệu thủ công khi nhận được các file Excel/CSV thô từ đối tác bên ngoài:
1.  Truy cập menu **"Công cụ khác"** ➔ Chọn **"Import dữ liệu AI"**.
2.  Tải lên tệp Excel/CSV chứa danh sách doanh nghiệp đối tác.
3.  **Ánh xạ cột (Mapping):** Lựa chọn các cột trong file Excel tương ứng với trường thông tin hệ thống (Tên công ty, Người đại diện, Điện thoại, Email, Địa chỉ...).
4.  **Xem trước dữ liệu (Preview):** Hệ thống hiển thị bảng dữ liệu xem trước, tự động phát hiện và gộp các dòng trùng tên doanh nghiệp.
5.  **Xử lý bằng AI:** Trợ lý AI (Gemini) sẽ đọc dữ liệu thô, tự động phân tích cấu trúc địa chỉ (tách riêng Tòa nhà/Đường, Quận, Tỉnh) và thông tin liên hệ của đại diện để ghi vào cơ sở dữ liệu một cách chuẩn hóa nhất.

![Giao diện tải tệp tin và ánh xạ cột dữ liệu trong công cụ AI Import](https://firebasestorage.googleapis.com/v0/b/quan-ly-doanh-nghiep-vlu.firebasestorage.app/o/docs%2Fadvances%2Faiimport.mp4?alt=media&token=8791ddbf-e96d-4430-9f83-3f60571eea4e)

---

## 📁 3. Quản lý File & Dọn rác Firebase
Hệ thống tích hợp trình quản lý tệp tin trực quan cho mỗi khoa:
*   **Cấu trúc thư mục:** Tự động tạo thư mục con lưu trữ tài liệu riêng biệt cho từng Doanh nghiệp và từng MOU.
*   **Thao tác:** Hỗ trợ tạo thư mục mới, tải trực tiếp các tệp tin scan hợp đồng, tài liệu, hình ảnh sự kiện.
*   **Dọn dẹp file rác:** Quản trị viên hệ thống có thể dọn dẹp các tệp tin rác không được liên kết với bất kỳ Doanh nghiệp, MOU, Nhiệm vụ hay Ghi chú nào để giải phóng dung lượng lưu trữ trên Firebase.

![Trình quản lý tệp tin và cây thư mục tài liệu theo doanh nghiệp](https://firebasestorage.googleapis.com/v0/b/quan-ly-doanh-nghiep-vlu.firebasestorage.app/o/docs%2FQu%E1%BA%A3n%20l%C3%BD%20file.png?alt=media&token=48c42f55-9982-40f8-82e1-023c5305ebaa)

---

## 📜 4. Nhật ký hoạt động & Lịch sử thay đổi (History Log)
Để đảm bảo tính minh bạch và an toàn dữ liệu, mọi thao tác thay đổi dữ liệu đều được ghi vết:
*   **Nhật ký hệ thống:** Lưu lại lịch sử hành động (CREATE - Tạo mới, UPDATE - Cập nhật, DELETE - Xóa, RESTORE - Khôi phục), tên tài khoản thực hiện, thời gian thực hiện và tên đối tượng bị thay đổi.
*   **So sánh chi tiết thay đổi:** Người dùng có thể click chọn xem chi tiết để xem sự thay đổi giá trị của dữ liệu (Giá trị cũ ➔ Giá trị mới) dưới dạng định dạng JSON chi tiết để dễ dàng đối soát khi xảy ra tranh chấp hoặc lỗi nhập liệu.

![Nhật ký hệ thống và chi tiết so sánh giá trị JSON](https://firebasestorage.googleapis.com/v0/b/quan-ly-doanh-nghiep-vlu.firebasestorage.app/o/docs%2Fadvances%2Fhistory.png?alt=media&token=b007cc24-ff6b-43cd-9688-73ceb48e06ef)
