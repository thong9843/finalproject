# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG PHẦN MỀM VLU ENTERPRISE LINK

Tài liệu này được biên soạn nhằm hướng dẫn chi tiết các cán bộ Quản lý Khoa, Giảng viên điều phối và Quản trị viên hệ thống tại Trường Đại học Văn Lang (VLU) cách thức vận hành và sử dụng phần mềm **VLU Enterprise Link**.

---

## 📋 MỤC LỤC
1. [Giới thiệu Phần mềm VLU Enterprise Link](#1-giới-thiệu-phần-mềm-vlu-enterprise-link)
2. [Danh sách các Tài khoản Hệ thống](#2-danh-sách-các-tài-khoản-hệ-thống)
3. [Hướng dẫn Sử dụng các Chức năng Cốt lõi](#3-hướng-dẫn-sử-dụng-các-chức-năng-cốt-lõi)
   - [3.1. Trang tổng quan (Dashboard)](#31-trang-tổng-quan-dashboard)
   - [3.2. Quản lý Hồ sơ Doanh nghiệp (Enterprises)](#32-quản-lý-hồ-sơ-doanh-nghiệp-enterprises)
   - [3.3. Quản lý Hợp đồng Hợp tác (MOU)](#33-quản-lý-hợp-đồng-hợp-tác-mou)
   - [3.4. Quản lý Hoạt động Liên kết (Activities)](#34-quản-lý-hoạt-động-liên-kết-activities)
   - [3.5. Quản lý Sinh viên Thực tập (Students)](#35-quản-lý-sinh-viên-thực-tập-students)
   - [3.6. Đánh giá chất lượng Doanh nghiệp (Ratings)](#36-đánh-giá-chất-lượng-doanh-nghiệp-ratings)
   - [3.7. Công cụ dữ liệu nâng cao (AI, Bulk & Duplicate Tools)](#37-công-cụ-dữ-liệu-nâng-cao-ai-bulk--duplicate-tools)
   - [3.8. Bảng công việc Kanban & Ghi chú (Kanban & Notes)](#38-bảng-công-việc-kanban--ghi-chú-kanban--notes)
   - [3.9. Quản lý Thư mục Tài liệu (File Manager)](#39-quản-lý-thư-mục-tài-liệu-file-manager)
   - [3.10. Nhật ký hoạt động & Lịch sử thay đổi (History Log)](#310-nhật-ký-hoạt-động--lịch-sử-thay-đổi-history-log)

---

## 1. Giới thiệu Phần mềm VLU Enterprise Link

**VLU Enterprise Link** là hệ thống quản lý quan hệ doanh nghiệp (CRM) chuyên biệt, được thiết kế để kết nối và tối ưu hóa sự hợp tác giữa **Trường Đại học Văn Lang (VLU)** và các doanh nghiệp đối tác. Hệ thống đóng vai trò cầu nối số hóa, hỗ trợ đắc lực cho các Khoa đào tạo và Ban Quan hệ Doanh nghiệp của nhà trường trong các nghiệp vụ sau:

*   **Quản lý đối tác tập trung:** Lưu trữ thông tin chi tiết về doanh nghiệp, thông tin người đại diện chính, địa chỉ trụ sở/chi nhánh, lĩnh vực chuyên môn và quy mô hoạt động.
*   **Bảo toàn và bảo mật dữ liệu theo Khoa:** Cơ chế phân quyền thông minh cho phép mỗi Khoa quản lý độc lập tệp dữ liệu doanh nghiệp và các hoạt động hợp tác của mình, trong khi Ban Giám hiệu/Admin có thể giám sát toàn cục để hỗ trợ định hướng vĩ mô.
*   **Quản lý vòng đời hợp tác:** Theo dõi sát sao quá trình ký kết Biên bản ghi nhớ hợp tác (MOU), các hoạt động thực tế phát sinh (Hội thảo, Tham quan, Tài trợ học bổng) cho tới kết quả thực tập thực tế của sinh viên.
*   **Hỗ trợ ra quyết định thông minh:** Công cụ đánh giá chất lượng doanh nghiệp đa chiều giúp Khoa sàng lọc và duy trì các đối tác uy tín; tích hợp công cụ AI tự động hóa việc chuẩn hóa dữ liệu từ file Excel thô.

---

## 2. Danh sách các Tài khoản Hệ thống

Hệ thống hỗ trợ 3 phân vai người dùng chính với quyền hạn tương ứng:

1.  **System Admin (Quản trị viên Hệ thống):** Toàn quyền kiểm soát, cấu hình danh mục ngành nghề/quy mô doanh nghiệp, gộp dữ liệu trùng lặp toàn hệ thống và giám sát tất cả các khoa.
2.  **Faculty Manager (Quản lý Khoa):** Quản lý toàn quyền dữ liệu của Khoa mình phụ trách (tạo doanh nghiệp, ký MOU, phê duyệt hoạt động, phân công sinh viên, dùng bảng Kanban phối hợp công việc).
3.  **Lecturer (Giảng viên / Điều phối viên):** Xem dữ liệu doanh nghiệp, theo dõi tiến độ thực tập của nhóm sinh viên được phân công hướng dẫn và quản lý các ghi chú công việc cá nhân.

> [!IMPORTANT]
> **THÔNG TIN ĐĂNG NHẬP MẶC ĐỊNH CHO MÔI TRƯỜNG KHẢO SÁT/MOCK DATA:**
> *   **Tài khoản Quản trị viên (Admin):**
>     *   **Email:** `admin@vlu.edu.vn`
>     *   **Mật khẩu:** `admin123`
> *   **Mật khẩu mặc định cho tất cả các tài khoản Khoa:** `admin123` hoặc `123456`

### Danh sách Email tài khoản của 22 Khoa đào tạo:

| STT | Tên Khoa | Mã Khoa | Email Quản lý Khoa (`FACULTY_MANAGER`) | Email Giảng viên (`LECTURER`) |
|---|---|---|---|---|
| 1 | Khoa Công nghệ Thông tin | **IT** | `manager.it@vlu.edu.vn` | `lecturer.it@vlu.edu.vn` |
| 2 | Khoa Quản trị Kinh doanh | **BA** | `manager.ba@vlu.edu.vn` | `lecturer.ba@vlu.edu.vn` |
| 3 | Khoa Quan hệ Công chúng | **PR** | `manager.pr@vlu.edu.vn` | `lecturer.pr@vlu.edu.vn` |
| 4 | Khoa Kiến trúc | **ARCH** | `manager.arch@vlu.edu.vn` | `lecturer.arch@vlu.edu.vn` |
| 5 | Khoa Mỹ thuật | **FA** | `manager.fa@vlu.edu.vn` | `lecturer.fa@vlu.edu.vn` |
| 6 | Khoa Thiết kế Công nghiệp | **ID** | `manager.id@vlu.edu.vn` | `lecturer.id@vlu.edu.vn` |
| 7 | Khoa Thiết kế Đồ họa | **GD** | `manager.gd@vlu.edu.vn` | `lecturer.gd@vlu.edu.vn` |
| 8 | Khoa Thiết kế Nội thất | **INT** | `manager.int@vlu.edu.vn` | `lecturer.int@vlu.edu.vn` |
| 9 | Khoa Thiết kế Thời trang | **FASH** | `manager.fash@vlu.edu.vn` | `lecturer.fash@vlu.edu.vn` |
| 10 | Khoa Kỹ thuật Công trình | **CE** | `manager.ce@vlu.edu.vn` | `lecturer.ce@vlu.edu.vn` |
| 11 | Khoa Kỹ thuật Cơ - Điện tử | **ME** | `manager.me@vlu.edu.vn` | `lecturer.me@vlu.edu.vn` |
| 12 | Khoa Kinh tế | **ECO** | `manager.eco@vlu.edu.vn` | `lecturer.eco@vlu.edu.vn` |
| 13 | Khoa Marketing | **MARK** | `manager.mark@vlu.edu.vn` | `lecturer.mark@vlu.edu.vn` |
| 14 | Khoa Tài chính - Kế toán | **FIN** | `manager.fin@vlu.edu.vn` | `lecturer.fin@vlu.edu.vn` |
| 15 | Khoa Du lịch | **TOUR** | `manager.tour@vlu.edu.vn` | `lecturer.tour@vlu.edu.vn` |
| 16 | Khoa Khách sạn - Nhà hàng | **HOTEL** | `manager.hotel@vlu.edu.vn` | `lecturer.hotel@vlu.edu.vn` |
| 17 | Khoa Luật | **LAW** | `manager.law@vlu.edu.vn` | `lecturer.law@vlu.edu.vn` |
| 18 | Khoa Ngoại ngữ | **ENG** | `manager.eng@vlu.edu.vn` | `lecturer.eng@vlu.edu.vn` |
| 19 | Khoa Truyền thông & Báo chí | **COMM** | `manager.comm@vlu.edu.vn` | `lecturer.comm@vlu.edu.vn` |
| 20 | Khoa Tâm lý học | **PSY** | `manager.psy@vlu.edu.vn` | `lecturer.psy@vlu.edu.vn` |
| 21 | Khoa Điều dưỡng | **NURS** | `manager.nurs@vlu.edu.vn` | `lecturer.nurs@vlu.edu.vn` |
| 22 | Khoa Dược | **PHARM** | `manager.pharm@vlu.edu.vn` | `lecturer.pharm@vlu.edu.vn` |

---

## 3. Hướng dẫn Sử dụng các Chức năng Cốt lõi

### 3.1. Trang tổng quan (Dashboard)
Sau khi đăng nhập thành công, hệ thống hiển thị ngay trang **Dashboard** tóm tắt số liệu trực quan của đơn vị:
*   **Khối Thống kê:** Hiển thị 4 thẻ chỉ số nhanh: Tổng số Doanh nghiệp liên kết, Số MOU đã ký, Số hoạt động đang chạy và số Sinh viên thực tập hiện tại.
*   **Biểu đồ Phân bổ Trạng thái:** Biểu đồ tròn biểu thị tỷ lệ doanh nghiệp theo các bước liên kết (Ví dụ: 30% Tiềm năng, 20% Đang đàm phán, 40% Đã ký kết hợp tác...).
*   **Biểu đồ Tiến trình Hoạt động & Sinh viên:** Hỗ trợ Khoa nắm bắt được biến động số lượng sinh viên tham gia thực tập và tần suất tổ chức hoạt động theo các mốc thời gian trong năm học.
*   **Danh sách Đơn vị Phối hợp Chặt chẽ:** Đề xuất danh sách các doanh nghiệp đang có số lượng sinh viên thực tập cao nhất hoặc số hoạt động tích cực nhất để Khoa tối ưu hóa chăm sóc đối tác.

---

### 3.2. Quản lý Hồ sơ Doanh nghiệp (Enterprises)
Đây là phân hệ cốt lõi để quản lý danh sách và hồ sơ chi tiết của các doanh nghiệp đối tác.

*   **Tra cứu và Lọc dữ liệu:**
    *   Sử dụng thanh tìm kiếm để tìm nhanh doanh nghiệp theo Tên hoặc Mã số thuế.
    *   Lọc nhanh theo Quy mô hoạt động (Tập đoàn/Global, SME, Startup) hoặc Lĩnh vực (Phần mềm & Outsource, Giải pháp CNTT, Marketing, Khác...) và Trạng thái.
*   **Thêm mới doanh nghiệp:**
    1.  Nhấn nút **"Thêm doanh nghiệp"** ở góc phải màn hình.
    2.  Điền các thông tin bắt buộc: **Tên doanh nghiệp** và **Mã số thuế**.
    3.  Chọn Quy mô và Lĩnh vực chuyên môn tương ứng.
    4.  Nhấp **"Lưu"** để hoàn tất hoặc tiếp tục cập nhật các thông tin chi tiết khác.
*   **Quản lý Địa chỉ và Người đại diện (Thông tin chi tiết):**
    *   **Địa chỉ:** Một doanh nghiệp có thể có nhiều chi nhánh. Hệ thống cho phép thêm nhiều địa chỉ (Số nhà/Đường, Quận/Huyện, Tỉnh/Thành phố) và tích chọn 1 địa chỉ làm **"Địa chỉ chính"**.
    *   **Người đại diện:** Hỗ trợ lưu trữ thông tin của nhiều nhân sự phía đối tác (Danh xưng, Họ tên, Chức vụ, Số điện thoại, Email liên hệ). Đánh dấu **"Đại diện chính"** cho người nhận thông tin MOU/Liên hệ thường trực.
*   **Quy trình cập nhật trạng thái đối tác:**
    Cán bộ có thể cập nhật trạng thái của doanh nghiệp theo các bước chuyển tiếp thực tế:
    `Tiềm năng` ➔ `Liên hệ` ➔ `Đàm phán` ➔ `Đề xuất` ➔ `Đã ký hợp tác` ➔ `Đang triển khai` ➔ `Đã hoàn thành` / `Đã tạm ngưng`.

---

### 3.3. Quản lý Hợp đồng Hợp tác (MOU)
Quản lý các bản ghi biên bản ghi nhớ hợp tác (MOU) chính thức đã ký kết giữa nhà trường và doanh nghiệp.

*   **Thông tin lưu trữ trên một bản ghi MOU:**
    *   **Mã MOU:** Được sinh tự động hoặc nhập thủ công theo quy tắc quản lý của khoa/trường (Ví dụ: `MOU-IT-2026-001`).
    *   **Doanh nghiệp ký kết:** Chọn từ danh sách doanh nghiệp đã có trên hệ thống.
    *   **Ngày ký kết & Thời hạn:** Xác định thời gian bắt đầu và kết thúc hiệu lực hợp tác.
    *   **Đầu mối liên hệ:** Người phụ trách liên lạc phía đối tác và phía VLU.
    *   **Nội dung & Phạm vi hợp tác:** Ghi rõ điều khoản thỏa thuận (Đào tạo, Tuyển dụng, Tài trợ...).
    *   **Kế hoạch cụ thể (Nhiệm vụ năm học & Bước tiếp theo):** Hỗ trợ đôn đốc triển khai, tránh tình trạng "MOU ngủ quên".
    *   **File đính kèm:** Nhập đường dẫn thư mục lưu trữ file scan MOU gốc hoặc liên kết tài liệu số hóa trên hệ thống lưu trữ đám mây.
*   **Tạo mới MOU:** Chọn tab MOU ➔ Nhấp **"Thêm mới MOU"** ➔ Điền biểu mẫu thông tin chi tiết ➔ Nhấp **"Lưu"**.

---

### 3.4. Quản lý Hoạt động Liên kết (Activities)
Nơi khởi tạo, quản lý và vận hành các hoạt động hợp tác cụ thể phát sinh từ quan hệ doanh nghiệp.

*   **Phân loại hoạt động:** Hội thảo & Đào tạo, Tuyển dụng & Thực tập, Tham quan doanh nghiệp, Tài trợ & Học bổng, Kiểm định & Đánh giá, Ký kết MOU.
*   **Tạo mới hoạt động:**
    1.  Nhập Tên hoạt động và liên kết tới Doanh nghiệp đồng tổ chức.
    2.  Điền nội dung chi tiết hoạt động, phân công **Người phụ trách** phía khoa.
    3.  Chọn loại hình hoạt động, chọn **Đối tượng đích** hướng đến (Ví dụ: Sinh viên năm 3, Sinh viên năm 4).
    4.  Nhập Thời gian bắt đầu, kết thúc và thời gian cụ thể trong ngày.
*   **Trạng thái hoạt động:** Hoạt động trải qua 4 bước: `Đề xuất` ➔ `Phê duyệt nội bộ` ➔ `Đã triển khai` ➔ `Đã kết thúc`.
*   **Lịch hoạt động (Calendar View):** Giúp xem tổng quát lịch trình tổ chức các sự kiện dưới dạng lịch tuần/tháng, tránh trùng lặp thời gian hoặc quá tải lịch trình của Khoa.

---

### 3.5. Quản lý Sinh viên Thực tập (Students)
Quản lý quá trình đưa sinh viên đi kiến tập, thực tập thực tế tại doanh nghiệp đối tác.

*   **Thông tin sinh viên:** Mã số sinh viên, Họ tên, Lớp sinh hoạt, Ngành, Điểm trung bình học tập (GPA), Vị trí thực tập (Ví dụ: Lập trình viên NodeJS, Chuyên viên Content Marketing...).
*   **Phân công thực tập:**
    *   Chọn sinh viên từ danh sách ➔ Nhấp **"Phân công"**.
    *   Liên kết sinh viên với doanh nghiệp tiếp nhận và Hoạt động tuyển dụng tương ứng.
    *   Gán Giảng viên hướng dẫn (Advisor) phụ trách theo dõi sinh viên tại doanh nghiệp đó.
*   **Trạng thái thực tập:** Cập nhật tiến độ của sinh viên theo các trạng thái: `Chờ phân công` ➔ `Đang thực tập` ➔ `Hoàn thành` ➔ `Đã nghỉ`.
*   **Xuất báo cáo:** Cho phép lọc danh sách sinh viên thực tập theo trạng thái hoặc theo doanh nghiệp để xuất dữ liệu phục vụ báo cáo hội đồng.

---

### 3.6. Đánh giá chất lượng Doanh nghiệp (Ratings)
Chức năng này giúp tích lũy phản hồi thực tế từ phía Giảng viên hướng dẫn và Sinh viên để chấm điểm chất lượng doanh nghiệp đối tác.

*   **Cơ chế đánh giá:** Chấm điểm theo thang đo từ 1 đến 5 sao cho 5 tiêu chí:
    1.  **Chỉ số Hướng dẫn (Guidance):** Mức độ quan tâm, chỉ bảo của mentor doanh nghiệp đối với sinh viên.
    2.  **Cơ sở vật chất (Facilities):** Trang thiết bị làm việc, môi trường văn phòng.
    3.  **Cơ hội phát triển (Opportunities):** Khả năng học hỏi kỹ năng mới, cơ hội được tuyển dụng chính thức.
    4.  **Phối hợp thông tin (Coordination):** Doanh nghiệp phối hợp tốt với Khoa trong báo cáo tiến độ và xử lý phát sinh.
    5.  **Điểm tổng quan (Overall).**
*   **Ghi chú nội bộ (Internal Note):** Ghi nhận những lưu ý bảo mật (Ví dụ: *"Doanh nghiệp hay bắt sinh viên làm thêm giờ không lương"* hoặc *"Doanh nghiệp hỗ trợ học bổng rất nhiệt tình, khuyến khích gửi thêm sinh viên xuất sắc"*). Thông tin này chỉ hiển thị trong nội bộ khoa.

---

### 3.7. Công cụ dữ liệu nâng cao (AI, Bulk & Duplicate Tools)
Để giảm thiểu thời gian nhập liệu thủ công và dọn dẹp hệ thống, VLU Enterprise Link trang bị 3 công cụ xử lý thông minh nằm tại góc công cụ quản lý dữ liệu:

#### 📂 Nhập dữ liệu thông minh bằng AI (AI Import Tool)
Khi có file danh sách đối tác nhận được từ các nguồn bên ngoài, bạn không cần gõ lại từng dòng:
1.  **Upload File:** Kéo thả file Excel/CSV danh sách doanh nghiệp vào khung upload.
2.  **Ghép cột (Mapping):** Khớp các cột tương ứng trong file Excel với trường dữ liệu của hệ thống (Tên doanh nghiệp, Người đại diện, Điện thoại, Email, Địa chỉ, Danh sách hoạt động).
3.  **Xem trước (Preview):** Hệ thống tự động gộp các dòng trùng tên doanh nghiệp và chuẩn bị dữ liệu thô gửi lên AI.
4.  **Xử lý bằng AI:** Trợ lý AI (Gemini) sẽ đọc dữ liệu thô, tự động bóc tách phân tích cấu trúc địa chỉ (Đường, Quận, Tỉnh), thông tin liên hệ đại diện và ghi nhận toàn bộ hoạt động cũ tự động đưa vào cơ sở dữ liệu.

#### 🔗 Xử lý dữ liệu trùng lặp (Duplicate Merger)
Trường hợp nhiều giảng viên nhập trùng tên doanh nghiệp làm loãng dữ liệu:
*   Hệ thống quét tự động các bản ghi trùng tên hoặc trùng mã số thuế.
*   **Tính năng Gộp (Merge):** Cho phép gộp các bản ghi trùng vào một bản ghi gốc duy nhất.
*   *Đặc biệt:* Toàn bộ dữ liệu liên đới gồm MOU, Hoạt động liên kết, Sinh viên đang thực tập của tất cả các khoa từ các bản ghi trùng sẽ tự động chuyển sang liên kết với bản ghi gốc trước khi xoá bản ghi thừa, đảm bảo tuyệt đối không mất mát dữ liệu của bất kỳ đơn vị nào.

#### ⚙️ Thao tác hàng loạt (Bulk Data Tool)
Cho phép tick chọn nhiều doanh nghiệp cùng lúc để xử lý nhanh:
*   Chuyển trạng thái hợp tác hàng loạt (Ví dụ: Chuyển 20 doanh nghiệp từ `Đàm phán` sang `Đã ký hợp tác`).
*   Chuyển quyền quản lý sang khoa khác (Ví dụ: Chuyển các doanh nghiệp công nghệ dùng chung từ khoa Cơ - Điện tử sang khoa CNTT quản lý chính).
*   Xoá mềm hàng loạt doanh nghiệp không còn hoạt động liên kết.

---

### 3.8. Bảng công việc Kanban & Ghi chú (Kanban & Notes)
Hỗ trợ quản lý công việc và phối hợp công tác doanh nghiệp ngay trong nội bộ Khoa.

*   **Bảng công việc Kanban:**
    *   Trực quan hoá công việc qua 4 cột: `Cần làm` ➔ `Đang thực hiện` ➔ `Đang kiểm tra` ➔ `Đã hoàn thành`.
    *   Mỗi thẻ công việc chứa: Tiêu đề, Mô tả, Mức độ ưu tiên (Thấp, Trung bình, Cao), Hạn chót và người được giao việc (Assignee).
    *   Kéo thả các thẻ công việc qua lại các cột để cập nhật trạng thái nhanh chóng.
*   **Ghi chú dán (Sticky Notes):**
    *   Tạo các mảnh ghi chú nhanh với các tuỳ chọn màu sắc khác nhau (Vàng, Xanh, Hồng...).
    *   Phù hợp để ghi lại số điện thoại nhanh, ý tưởng cuộc họp hoặc lịch hẹn đột xuất với doanh nghiệp.

---

### 3.9. Quản lý Thư mục Tài liệu (File Manager)
Hệ thống tích hợp trình quản lý tệp tin trực quan cho mỗi Khoa:
*   Cấu trúc cây thư mục phân chia rõ ràng theo từng Doanh nghiệp và theo từng MOU.
*   Hỗ trợ tạo thư mục con, tải lên trực tiếp tài liệu scan (PDF, DOCX, Hình ảnh sự kiện...).
*   Người dùng có thể sao chép liên kết tệp để gán trực tiếp vào các hoạt động hoặc biên bản MOU tương ứng trên hệ thống để tiện tra cứu sau này.

---

### 3.10. Nhật ký hoạt động & Lịch sử thay đổi (History Log)
Để đảm bảo tính minh bạch và an toàn dữ liệu:
*   Mọi thao tác Thêm, Sửa, Xoá, Khôi phục của người dùng đều được ghi lại.
*   **Chi tiết ghi nhận:** Hành động thực hiện, Thời gian thực hiện, Tài khoản thực hiện, Tên đối tượng tác động (Doanh nghiệp, Sinh viên...).
*   Hỗ trợ xem chi tiết sự thay đổi giá trị của dữ liệu (Giá trị cũ ➔ Giá trị mới) dưới dạng định dạng JSON chi tiết để dễ dàng đối soát khi xảy ra tranh chấp dữ liệu.

---
*VLU Enterprise Link - Kết nối bền vững, kiến tạo tương lai.*
