# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG HỆ THỐNG VLU ENTERPRISE LINK

Tài liệu này hướng dẫn chi tiết cách vận hành và sử dụng phần mềm **VLU Enterprise Link** dành cho Cán bộ Quản lý Khoa, Giảng viên điều phối/hướng dẫn, và Quản trị viên hệ thống tại Trường Đại học Văn Lang (VLU).

---

## 📋 MỤC LỤC
1. [Giới thiệu phần mềm](#1-giới-thiệu-phần-mềm)
2. [Danh sách các tài khoản hệ thống](#2-danh-sách-các-tài-khoản-hệ-thống)
3. [Hướng dẫn chi tiết các chức năng cốt lõi](#3-hướng-dẫn-chi-tiết-các-chức-năng-cốt-lõi)
   - [3.1. Trang chủ (Dashboard)](#31-trang-chủ-dashboard)
   - [3.2. Quản lý Doanh nghiệp (Cty)](#32-quản-lý-doanh-nghiệp-cty)
   - [3.3. Quản lý Sinh viên Thực tập (HS)](#33-quản-lý-sinh-viên-thực-tập-hs)
   - [3.4. Quản lý Hoạt động Liên kết (Hoạt động)](#34-quản-lý-hoạt-động-liên-kết-hoạt-động)
   - [3.5. Quản lý Hợp đồng Hợp tác (MOUs)](#35-quản-lý-hợp-đồng-hợp-tác-mous)
   - [3.6. Bảng công việc (Task - Kanban Board)](#36-bảng-công-việc-task---kanban-board)
   - [3.7. Không gian Ghi chú dán (Ghi chú - Sticky Notes)](#37-không-gian-ghi-chú-dán-ghi-chú---sticky-notes)
4. [Hướng dẫn sử dụng các công cụ nâng cao](#4-hướng-dẫn-sử-dụng-các-công-cụ-nâng-cao)
   - [4.1. Import dữ liệu thông minh bằng AI](#41-import-dữ-liệu-thông-minh-bằng-ai)
   - [4.2. Xử lý dữ liệu trùng lặp (Duplicate Merger)](#42-xử-lý-dữ-liệu-trùng-lặp-duplicate-merger)
   - [4.3. Thao tác dữ liệu hàng loạt (Bulk Data Tool)](#43-thao-tác-dữ-liệu-hàng-loạt-bulk-data-tool)
   - [4.4. Quản lý Thư mục Tài liệu (File Manager)](#44-quản-lý-thư-mục-tài-liệu-file-manager)
   - [4.5. Nhật ký hoạt động & Lịch sử thay đổi (History Log)](#45-nhật-ký-hoạt-động--lịch-sử-thay-đổi-history-log)

---

## 1. Giới thiệu phần mềm

**VLU Enterprise Link** là hệ thống quản lý quan hệ doanh nghiệp (CRM) chuyên biệt, được thiết kế để kết nối, quản lý và tối ưu hóa các hoạt động hợp tác giữa **Trường Đại học Văn Lang (VLU)** và mạng lưới doanh nghiệp đối tác. 

Hệ thống hỗ trợ đắc lực cho các đơn vị trong nhà trường thực hiện các nghiệp vụ:
*   **Bảo toàn và phân quyền dữ liệu theo Khoa:** Mỗi Khoa quản lý độc lập tệp dữ liệu doanh nghiệp, hợp đồng hợp tác, sinh viên và hoạt động của đơn vị mình. Tài khoản Admin (Quản trị viên toàn hệ thống) có quyền giám sát, dọn dẹp và cấu hình chung.
*   **Quản lý đối tác tập trung:** Lưu trữ thông tin chi tiết về doanh nghiệp, phân nhóm quy mô, mảng lĩnh vực và quản lý lịch sử tương tác.
*   **Theo dõi vòng đời hợp tác:** Quản lý từ khâu ký kết Biên bản ghi nhớ (MOU), triển khai các Hoạt động liên kết cụ thể (Hội thảo, Kiến tập, Tuyển dụng...) cho đến quản lý quá trình thực tập thực tế của Sinh viên.
*   **Tương tác thông minh:** Tích hợp Trợ lý AI (Gemini) hỗ trợ bóc tách, chuẩn hóa dữ liệu Excel và chat trực tiếp trong các nhiệm vụ công việc, ghi chú để hỗ trợ cán bộ xử lý thông tin nhanh chóng.

---

## 2. Danh sách các tài khoản hệ thống

Hệ thống phân quyền rõ ràng thành 3 vai trò chính. Dưới đây là danh sách tài khoản thử nghiệm với **mật khẩu đăng nhập mặc định cho tất cả các tài khoản là: `123456`**.

### 2.1. Tài khoản Quản trị viên hệ thống (ADMIN)
Có toàn quyền cấu hình danh mục dữ liệu mẫu, quản lý người dùng, gộp dữ liệu trùng lặp và chuyển giao doanh nghiệp giữa các khoa.
*   **Email đăng nhập:** `admin@vlu.edu.vn`

### 2.2. Danh sách tài khoản của 22 Khoa đào tạo
Mỗi Khoa gồm 2 tài khoản đại diện cho vai trò **Quản lý Khoa (FACULTY_MANAGER)** (toàn quyền quản lý dữ liệu của khoa) và **Giảng viên (LECTURER)** (chỉ xem thông tin, quản lý sinh viên được phân công hướng dẫn và ghi chú cá nhân).

| STT | Tên Khoa đào tạo | Mã Khoa | Email Quản lý Khoa (`FACULTY_MANAGER`) | Email Giảng viên (`LECTURER`) |
| :---: | :--- | :---: | :--- | :--- |
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

[hình ảnh: Giao diện đăng nhập hệ thống VLU Enterprise Link]

---

## 3. Hướng dẫn chi tiết các chức năng cốt lõi

### 3.1. Trang chủ (Dashboard)
Sau khi đăng nhập, hệ thống sẽ đưa người dùng tới giao diện Trang chủ thống kê trực quan số liệu:
*   **Thống kê nhanh (4 thẻ chỉ số):** Số lượng doanh nghiệp liên kết, số biên bản MOU đã ký, số hoạt động đang triển khai và số sinh viên đang đi thực tập thuộc quyền quản lý của Khoa.
*   **Biểu đồ phân bổ Trạng thái đối tác:** Biểu đồ tròn trực quan hóa tỷ lệ doanh nghiệp theo các bước trong quy trình liên kết (Tiềm năng, Đàm phán, Đã ký kết, Đang triển khai...).
*   **Biểu đồ tiến trình Hoạt động & Sinh viên:** Theo dõi biểu đồ cột/đường về xu hướng tổ chức sự kiện và số lượng sinh viên tham gia thực tập qua các tháng trong năm học.
*   **Danh sách Đơn vị phối hợp chặt chẽ:** Đề xuất danh sách các đối tác tích cực nhất (có số lượng sinh viên thực tập cao nhất hoặc nhiều hoạt động nhất) để khoa tập trung chăm sóc tốt hơn.

[hình ảnh: Giao diện Trang chủ Dashboard và các biểu đồ thống kê]

---

### 3.2. Quản lý Doanh nghiệp (Cty)
Phân hệ quản lý hồ sơ và lịch sử hợp tác của các công ty đối tác.

[hình ảnh: Giao diện danh sách doanh nghiệp đối tác]

#### 3.2.1. Tra cứu và lọc dữ liệu doanh nghiệp
*   **Tìm kiếm:** Nhập tên doanh nghiệp hoặc mã số thuế vào thanh tìm kiếm ở đầu trang để tìm nhanh.
*   **Bộ lọc nâng cao:** Hỗ trợ lọc danh sách theo:
    *   **Quy mô:** Tier 1 (Tập đoàn/Global), Tier 2 (SME), Tier 3 (Startup/Micro).
    *   **Lĩnh vực:** Lọc theo ngành nghề (Phần mềm, Marketing, Xây dựng, Pháp lý...).
    *   **Khu vực:** Lọc doanh nghiệp "Có chi nhánh tại TP.HCM" hoặc "Khu vực khác".
    *   **Trạng thái hợp tác:** Tiềm năng, Liên hệ, Đàm phán, Đề xuất, Đã ký hợp tác, Đang triển khai, Đã hoàn thành, Đã tạm ngưng.

#### 3.2.2. Thêm mới và Chỉnh sửa Doanh nghiệp
1.  Nhấn nút **"Thêm doanh nghiệp"** (chỉ dành cho Admin và Faculty Manager).
2.  Điền biểu mẫu thông tin bao gồm:
    *   `Tên Doanh nghiệp` *(Bắt buộc)*.
    *   `Mã số thuế` *(Nên nhập để đối soát trùng)*.
    *   `Quy mô` (Chọn từ danh mục Tier 1, 2, 3).
    *   `Lĩnh vực / Ngành nghề` (Chọn một hoặc nhiều ngành phù hợp).
    *   `Bộ môn phân loại` (Bộ môn trực thuộc khoa phụ trách chính).
    *   `Trạng thái` (Mặc định là *Tiềm năng*).
    *   `Có tại TP.HCM?` (Tích chọn nếu doanh nghiệp ở TP.HCM).
    *   `Khoa quản lý` (Chỉ hiển thị khi tài khoản Admin tạo để gán cho khoa tương ứng).
3.  Nhấn **"Lưu"** để hoàn tất. Để chỉnh sửa, click nút **"Chỉnh sửa"** (biểu tượng bút chì) tại dòng tương ứng của doanh nghiệp trong danh sách.

[hình ảnh: Biểu mẫu thêm mới và cập nhật thông tin Doanh nghiệp]

#### 3.2.3. Quản lý nhiều Địa chỉ và Người đại diện
Hệ thống cho phép lưu trữ cấu trúc động nhiều chi nhánh và nhiều liên hệ nhân sự cho một doanh nghiệp:
*   **Quản lý địa chỉ (Addresses):**
    *   Cho phép thêm nhiều địa chỉ khác nhau (Tòa nhà/Đường, Quận/Huyện, Tỉnh/Thành phố, Quốc gia).
    *   Nhân viên có thể tick chọn một địa chỉ cụ thể làm **"Địa chỉ chính"**.
*   **Quản lý người đại diện (Representatives):**
    *   Cho phép lưu trữ nhiều nhân sự đối tác (Danh xưng, Họ và tên, Chức vụ, Số điện thoại, Email).
    *   Tick chọn một liên hệ làm **"Đại diện chính"** để hệ thống làm đầu mối liên lạc khi gửi email, ký MOU.

#### 3.2.4. Đánh giá chất lượng Doanh nghiệp (Ratings)
Giúp Khoa tổng hợp ý kiến phản hồi từ Giảng viên hướng dẫn và Sinh viên thực tập để chấm điểm đối tác:
*   **Cơ chế đánh giá:** Chấm điểm theo thang từ 1 đến 5 sao cho 5 tiêu chí:
    1.  *Chỉ số Hướng dẫn (Guidance):* Mức độ quan tâm, chỉ dẫn của người hướng dẫn tại doanh nghiệp.
    2.  *Cơ sở vật chất (Facilities):* Trang thiết bị làm việc, môi trường công sở.
    3.  *Cơ hội phát triển (Opportunities):* Cơ hội học tập thực tế và khả năng được tuyển dụng chính thức.
    4.  *Phối hợp thông tin (Coordination):* Mức độ phối hợp giữa doanh nghiệp với Khoa khi xử lý sự cố.
    5.  *Điểm tổng quan (Overall).*
*   **Ghi chú nội bộ (Internal Note):** Ghi chép các thông tin nhạy cảm chỉ hiển thị trong nội bộ Khoa (Ví dụ: *"Doanh nghiệp hỗ trợ phụ cấp tốt nhưng áp lực công việc cao, yêu cầu tăng ca"*).

[hình ảnh: Giao diện đánh giá chất lượng Ratings và ghi chú nội bộ của doanh nghiệp]

#### 3.2.5. Tạo ghi chú trực tiếp cho Doanh nghiệp
Trong trang chi tiết doanh nghiệp, người dùng có thể tạo nhanh các ghi chú dán (Sticky Notes) để lưu lại lịch hẹn hoặc thông tin trao đổi mà không cần sang mục Kanban.

#### 3.2.6. Xóa mềm và Khôi phục Doanh nghiệp
*   Khi xóa doanh nghiệp, hệ thống sẽ thực hiện **Xóa mềm** (đưa vào thùng rác).
*   Người dùng có thể bật chế độ **"Hiển thị đã xóa"** trong bộ lọc để tìm lại doanh nghiệp đã xóa mềm và nhấn nút **"Khôi phục"** để đưa dữ liệu trở lại danh sách hoạt động.

---

### 3.3. Quản lý Sinh viên Thực tập (HS)
Phân hệ hỗ trợ đưa sinh viên đi thực tập, kiến tập tại các doanh nghiệp đối tác của Khoa.

[hình ảnh: Danh sách quản lý sinh viên thực tập và bộ lọc]

#### 3.3.1. Tìm kiếm và Lọc danh sách sinh viên
*   **Tìm kiếm:** Nhập Mã số sinh viên (MSSV) hoặc Họ và tên sinh viên.
*   **Bộ lọc nâng cao:** Lọc theo ngành học, lớp học, doanh nghiệp thực tập, giảng viên hướng dẫn, và trạng thái thực tập (`Chờ phân công`, `Đang thực tập`, `Hoàn thành`, `Đã nghỉ`).

#### 3.3.2. Thêm mới và Cập nhật Sinh viên
1.  Nhấn **"Thêm sinh viên"** và nhập các thông tin:
    *   `MSSV` *(Bắt buộc)* và `Họ và tên` *(Bắt buộc)*.
    *   `Email` (Email sinh viên).
    *   `Ngành học` và `Lớp` sinh hoạt.
    *   `GPA` (Điểm trung bình học tập tích lũy).
    *   `Giảng viên hướng dẫn` (Tên giảng viên phụ trách chấm điểm, theo dõi).
    *   `Công ty thực tập` (Chọn doanh nghiệp tiếp nhận từ danh sách).
    *   `Vị trí thực tập` (Ví dụ: Thực tập sinh Thiết kế, Thực tập sinh Lập trình Web).
    *   `Trạng thái` (Chờ phân công / Đang thực tập / Hoàn thành / Đã nghỉ).
    *   `Ngày bắt đầu` và `Ngày kết thúc` đợt thực tập.
2.  Nhấn **"Lưu"**. Cán bộ có thể chỉnh sửa thông tin này bất kỳ lúc nào bằng nút **"Chỉnh sửa"**.

[hình ảnh: Hộp thoại thêm mới/cập nhật thông tin sinh viên thực tập]

#### 3.3.3. Phân công doanh nghiệp & Tạo ghi chú sinh viên
*   **Phân công nhanh:** Cán bộ quản lý chọn sinh viên đang có trạng thái "Chờ phân công", gán công ty tiếp nhận và cập nhật trạng thái sang "Đang thực tập".
*   **Ghi chú cá nhân:** Trong trang chi tiết của mỗi sinh viên, giảng viên hướng dẫn có thể tạo nhanh các ghi chú dán (Sticky Notes) để ghi lại tiến độ báo cáo tuần của sinh viên đó.
*   **Xuất danh sách Excel:** Nhấn nút **"Xuất Excel"** để xuất danh sách sinh viên cùng thông tin công ty thực tập, giảng viên hướng dẫn phục vụ báo cáo hội đồng đợt thực tập.

---

### 3.4. Quản lý Hoạt động Liên kết (Hoạt động)
Nơi khởi tạo và điều phối các chương trình, sự kiện hợp tác giữa Khoa và doanh nghiệp.

[hình ảnh: Danh sách hoạt động liên kết dưới dạng lưới thẻ]

#### 3.4.1. Chế độ xem danh sách hoạt động
Hệ thống cung cấp 2 chế độ xem linh hoạt:
1.  **Grid View (Dạng thẻ):** Trực quan hóa các hoạt động dưới dạng card màu sắc, hiển thị logo loại hình hoạt động, số lượng sinh viên tham gia và trạng thái hiện tại.
2.  **List View (Dạng bảng):** Dạng bảng Excel truyền thống, hiển thị đầy đủ thông tin trên một dòng, dễ so sánh và hỗ trợ chọn nhiều dòng để thao tác hàng loạt.

#### 3.4.2. Thêm mới và Chỉnh sửa Hoạt động
1.  Nhấn **"Thêm hoạt động"** và điền thông tin:
    *   `Tên hoạt động` *(Bắt buộc)*.
    *   `Doanh nghiệp liên kết` *(Bắt buộc - Chọn từ danh sách doanh nghiệp)*.
    *   `Loại hình hoạt động` (Chọn một hoặc nhiều loại: *Tuyển dụng & Thực tập*, *Hội thảo & Đào tạo*, *Tài trợ & Học bổng*, *Tham quan doanh nghiệp*, *Kiểm định & Đánh giá*, *Ký kết MOU*, *Khác*).
    *   `Đối tượng hướng tới` (Chọn một hoặc nhiều đối tượng: *Sinh viên năm 1, 2, 3, 4, Mới tốt nghiệp, Giảng viên, Tất cả sinh viên*).
    *   `Ngày bắt đầu` *(Bắt buộc)* và `Ngày kết thúc`.
    *   `Giờ bắt đầu` và `Giờ kết thúc` (Cấu hình thời gian cụ thể diễn ra sự kiện).
    *   `Ngày hợp tác` và `Mô tả nội dung hoạt động` (Tóm tắt chương trình).
    *   `Trạng thái` (Chọn: *Đề xuất, Phê duyệt nội bộ, Đã triển khai, Đã kết thúc*).
2.  Nhấn **"Lưu hoạt động"** để hoàn tất.

[hình ảnh: Biểu mẫu thêm mới hoạt động liên kết]

#### 3.4.3. Cập nhật trạng thái nhanh và Thao tác hàng loạt
*   **Cập nhật trạng thái tại chỗ:** Người dùng có thể click vào ô Dropdown trạng thái ngay dưới chân của card hoạt động hoặc trong bảng dữ liệu để chuyển nhanh trạng thái (Ví dụ: Từ *Đề xuất* sang *Phê duyệt nội bộ*) mà không cần mở modal chỉnh sửa.
*   **Thao tác hàng loạt (Bulk Actions):** Chọn nhiều hoạt động bằng checkbox, thanh công cụ nổi ở cuối màn hình sẽ xuất hiện cho phép:
    *   Đổi trạng thái hàng loạt cho tất cả các hoạt động đã chọn.
    *   Xóa hàng loạt các hoạt động đã chọn.
*   **Lịch hoạt động (Calendar View):** Chuyển sang tab **"Lịch sự kiện"** trên menu để theo dõi lịch trình hoạt động của Khoa trực quan theo giao diện lịch ngày/tuần/tháng, tránh trùng lặp ngày tổ chức.

[hình ảnh: Giao diện Lịch sự kiện Calendar View của các hoạt động]

---

### 3.5. Quản lý Hợp đồng Hợp tác (MOUs)
Theo dõi các biên bản ghi nhớ hợp tác (MOU) chính thức đã ký kết giữa nhà trường (hoặc khoa) và doanh nghiệp.

[hình ảnh: Giao diện danh sách các hợp đồng hợp tác MOU]

#### 3.5.1. Các thông tin quản lý trong biên bản MOU
Khi thêm mới biên bản ghi nhớ MOU, người dùng cần điền các thông tin:
*   `Mã biên bản` *(Bắt buộc - Ví dụ: MOU-IT-2026-001)*.
*   `Tên đối tác (Doanh nghiệp)` *(Bắt buộc - Chọn doanh nghiệp từ danh sách)*.
*   `Ngày ký kết` và `Loại tổ chức` (Doanh nghiệp tư nhân, tập đoàn, trường học...).
*   `Hoạt động liên kết` (MOU này phục vụ trực tiếp cho hoạt động liên kết nào đã có).
*   `Đầu mối liên hệ của đối tác` và `Đầu mối liên hệ VLU` (Tên, email, số điện thoại người phụ trách trực tiếp).
*   `Quốc gia đối tác` và `Đơn vị triển khai` (Bộ môn trực thuộc khoa trực tiếp vận hành).
*   `Thư mục làm việc (Link)` và `File đính kèm` (Đường dẫn lưu file scan bản gốc MOU).
*   `Mảng hợp tác` (Ví dụ: Tài trợ học bổng, Đón nhận sinh viên thực tập).
*   `Công tác đã triển khai NH 24-25` và `Bước kế tiếp (Dự kiến)`.
*   `Hoạt động cũ` và `Số liệu liên quan`.

[hình ảnh: Biểu mẫu thêm mới biên bản MOU]

#### 3.5.2. Quản lý tệp đính kèm và xuất báo cáo
*   **File đính kèm:** Người dùng tải bản quét (scan PDF/ảnh) của hợp đồng MOU lên hệ thống tài liệu. Hợp đồng sẽ hiển thị link tải về trực tiếp trong Drawer chi tiết MOU.
*   **Xuất Excel:** Xuất toàn bộ danh sách biên bản MOU kèm thời hạn ký kết, thông tin liên hệ và kế hoạch hành động ra file Excel để báo cáo Ban giám hiệu.

---

### 3.6. Bảng công việc (Task - Kanban Board)
Công cụ hỗ trợ các cán bộ trong khoa giao việc, phối hợp chuẩn bị các sự kiện doanh nghiệp trực quan bằng bảng Kanban.

[hình ảnh: Bảng công việc Kanban với 4 cột trạng thái]

#### 3.6.1. Giao diện bảng Kanban và Thao tác kéo thả
Bảng Kanban chia công việc thành 4 cột trạng thái chuẩn:
`Cần làm` ➔ `Đang thực hiện` ➔ `Đang kiểm tra` ➔ `Đã hoàn thành`
*   **Kéo thả (Drag and Drop):** Bấm giữ thẻ nhiệm vụ và kéo thả sang cột trạng thái mong muốn để cập nhật tiến độ công việc ngay lập tức.
*   **Khay thả nhanh (Floating Drop Targets):** Khi người dùng bắt đầu kéo thẻ, một khay nổi màu đen xuất hiện ở cuối màn hình hiển thị 4 vùng trạng thái. Bạn có thể kéo thả thẻ nhiệm vụ trực tiếp vào khay nổi này để chuyển trạng thái nhanh (tiện lợi trên màn hình nhỏ hoặc thiết bị di động).
*   **Chế độ di động:** Trên thiết bị di động, bảng tự động hiển thị thanh Tabs switch. Người dùng chỉ cần ấn nút tên trạng thái (ví dụ: *Đang thực hiện*) để xem các nhiệm vụ thuộc trạng thái đó mà không bị tràn màn hình.

#### 3.6.2. Tạo mới và Chỉnh sửa Nhiệm vụ
Bấm nút **"Thêm nhiệm vụ"** tại bảng Kanban để mở biểu mẫu:
*   `Tiêu đề nhiệm vụ` *(Bắt buộc - Ví dụ: Gửi thư mời hội thảo cho FPT Software)*.
*   `Trạng thái` và `Độ ưu tiên` (Cao, Trung bình, Thấp).
*   `Ngày hết hạn` (Hạn chót hoàn thành nhiệm vụ).
*   `Giao cho giảng viên/nhân viên` (Chọn nhân sự trong khoa thực hiện).
*   `Mô tả & chi tiết công việc`: 
    *   **Soạn thảo liên kết thông minh (MentionEditor):** Khi gõ kí tự `@` trong mô tả, hệ thống sẽ hiện danh sách đề xuất. Bạn có thể chọn liên kết nhanh đến một **Doanh nghiệp**, **Hoạt động**, **MOU** hoặc **Sinh viên** cụ thể.
    *   Thanh chọn nhanh ở chân biểu mẫu: Cung cấp các nút bấm `@ Doanh nghiệp`, `@ Hoạt động`, `@ MOU`, `@ Sinh viên` và nút `Đính kèm File/Audio/Ảnh` để tải tài liệu lên đính kèm vào nhiệm vụ.

[hình ảnh: Biểu mẫu tạo nhiệm vụ mới với MentionEditor hỗ trợ gõ @]

#### 3.6.3. Menu ngữ cảnh (Context Menu)
Click chuột phải vào thẻ nhiệm vụ hoặc nhấn biểu tượng 3 chấm ở góc dưới thẻ để hiển thị menu nhanh:
*   **Thảo luận với AI (RobotOutlined):** Mở cửa sổ chat riêng với trợ lý AI (Gemini) để hỏi đáp, soạn thảo email mời đối tác, hoặc lên kế hoạch thực hiện nhiệm vụ này.
*   **Chỉnh sửa:** Mở biểu mẫu chỉnh sửa thông tin nhiệm vụ.
*   **Xóa nhiệm vụ:** Xóa thẻ nhiệm vụ khỏi bảng Kanban.
*   **Chuyển trạng thái:** Menu con hiển thị danh sách các trạng thái để chuyển nhanh không cần kéo thả.

---

### 3.7. Không gian Ghi chú dán (Ghi chú - Sticky Notes)
Nơi lưu trữ các mảnh ghi chép nhanh, ý tưởng, hoặc lịch hẹn đột xuất dưới dạng các thẻ dán nhiều màu sắc (Google Keep style).

[hình ảnh: Không gian ghi chú dán với các thẻ note nhiều màu sắc]

#### 3.7.1. Tạo mới và Quản lý Ghi chú
*   **Tạo ghi chú:** Bấm nút **"Thêm ghi chú"** và điền:
    *   `Tiêu đề ghi chú` (Ví dụ: *SĐT liên hệ gấp*).
    *   `Nội dung ghi chú` *(Bắt buộc - hỗ trợ gõ `@` liên kết thực thể)*.
    *   `Màu giấy note` (Vàng, Xanh lá, Hồng, Xanh dương, Tím...).
*   **Kéo thả sắp xếp (Reorder):** Người dùng có thể kéo thả trực tiếp các mảnh ghi chú để hoán đổi vị trí hiển thị của chúng trên không gian làm việc theo ý muốn.
*   **Đổi màu sắc nhanh:** Di chuột vào thẻ ghi chú, click chọn màu sắc tương ứng từ các hình tròn màu sắc dưới chân thẻ để đổi màu nền note ngay lập tức.

[hình ảnh: Biểu mẫu thêm mới ghi chú dán]

#### 3.7.2. Thẻ Badge thực thể liên kết thông minh
Khi nội dung ghi chú sử dụng `@` để nhắc đến một thực thể (Doanh nghiệp, Hoạt động, MOU, Sinh viên), thẻ ghi chú sẽ tự động hiển thị các thẻ tag (badge) tương ứng:
*   `🏢 Doanh nghiệp: [Tên doanh nghiệp]`
*   `🎯 Hoạt động: [Tên hoạt động]`
*   `📜 MOU: [Mã MOU]`
*   `🎓 Sinh viên: [Tên sinh viên]`
*   **Xem nhanh (Preview Modal):** Click trực tiếp vào các thẻ badge này sẽ hiển thị ngay một hộp thoại xem trước chi tiết thông tin của thực thể đó (Ví dụ: Địa chỉ chính của doanh nghiệp, ngày bắt đầu hoạt động, trạng thái thực tập của sinh viên...) mà không cần chuyển trang.

#### 3.7.3. Trò chuyện với trợ lý AI (RobotOutlined)
*   Mỗi thẻ ghi chú dán đều có biểu tượng Robot AI ở góc dưới.
*   Click vào biểu tượng để mở cửa sổ trò chuyện với trợ lý AI, AI sẽ tự động đọc nội dung ghi chú và hỗ trợ bạn phân tích, tóm tắt hoặc gợi ý viết email dựa trên ghi chú đó.

---

## 4. Hướng dẫn sử dụng các công cụ nâng cao
*(Chỉ hiển thị cho tài khoản ADMIN và FACULTY_MANAGER)*

### 4.1. Import dữ liệu thông minh bằng AI
Để giảm thiểu thời gian nhập liệu thủ công khi nhận được các file Excel/CSV thô từ đối tác bên ngoài:
1.  Truy cập menu **"Công cụ khác"** ➔ Chọn **"Import dữ liệu AI"**.
2.  Tải lên tệp Excel/CSV chứa danh sách doanh nghiệp đối tác.
3.  **Ánh xạ cột (Mapping):** Lựa chọn các cột trong file Excel tương ứng với trường thông tin hệ thống (Tên công ty, Người đại diện, Điện thoại, Email, Địa chỉ...).
4.  **Xem trước dữ liệu (Preview):** Hệ thống hiển thị bảng dữ liệu xem trước, tự động phát hiện và gộp các dòng trùng tên doanh nghiệp.
5.  **Xử lý bằng AI:** Trợ lý AI (Gemini) sẽ đọc dữ liệu thô, tự động phân tích cấu trúc địa chỉ (tách riêng Tòa nhà/Đường, Quận, Tỉnh) và thông tin liên hệ của đại diện để ghi vào cơ sở dữ liệu một cách chuẩn hóa nhất.

[hình ảnh: Giao diện tải tệp tin và ánh xạ cột dữ liệu trong công cụ AI Import]

---

### 4.2. Xử lý dữ liệu trùng lặp (Duplicate Merger)
Công cụ dọn dẹp hệ thống dành riêng cho tài khoản Admin khi phát hiện nhiều cán bộ nhập trùng tên doanh nghiệp hoặc mã số thuế:
1.  Truy cập **"Công cụ khác"** ➔ Chọn **"Xử lý dữ liệu trùng lặp"**.
2.  Hệ thống hiển thị danh sách các bản ghi bị trùng tên hoặc trùng mã số thuế.
3.  Bấm nút **"Gộp (Merge)"**: Chọn một bản ghi chính xác làm bản ghi gốc.
4.  **Cơ chế gộp an toàn:** Hệ thống tự động chuyển toàn bộ các dữ liệu liên đới gồm biên bản MOU, hoạt động liên kết, và sinh viên đang thực tập từ các bản ghi trùng lặp sang liên kết với bản ghi gốc đã chọn, sau đó mới tiến hành xóa các bản ghi thừa, đảm bảo tuyệt đối không làm mất dữ liệu của bất kỳ khoa nào.

[hình ảnh: Giao diện dọn dẹp và gộp doanh nghiệp trùng lặp]

---

### 4.3. Thao tác dữ liệu hàng loạt (Bulk Data Tool)
Công cụ xử lý nhanh lượng lớn doanh nghiệp (Chỉ dành cho ADMIN):
1.  Truy cập **"Công cụ khác"** ➔ Chọn **"Xử lý dữ liệu hàng loạt"**.
2.  Tick chọn các doanh nghiệp cần xử lý trong danh sách.
3.  Lựa chọn hành động xử lý hàng loạt:
    *   *Đổi trạng thái hàng loạt:* Chuyển cùng lúc nhiều doanh nghiệp sang trạng thái "Đã ký hợp tác" hoặc "Đang triển khai".
    *   *Chuyển quyền quản lý Khoa:* Chuyển giao quyền quản lý các doanh nghiệp được chọn sang cho khoa khác phụ trách.
    *   *Xóa mềm hàng loạt:* Xóa nhanh các doanh nghiệp không còn liên kết hoạt động.

[hình ảnh: Giao diện thao tác thay đổi dữ liệu hàng loạt]

---

### 4.4. Quản lý Thư mục Tài liệu (File Manager)
Hệ thống tích hợp trình quản lý tệp tin trực quan cho mỗi khoa:
*   **Cấu trúc thư mục:** Tự động tạo thư mục con lưu trữ tài liệu riêng biệt cho từng Doanh nghiệp và từng MOU.
*   **Thao tác:** Hỗ trợ tạo thư mục mới, tải trực tiếp các tệp tin scan hợp đồng, tài liệu, hình ảnh sự kiện.
*   **Thùng rác tài liệu:** Các file xóa đi sẽ được đưa vào thùng rác riêng của File Manager để hỗ trợ khôi phục hoặc xóa vĩnh viễn nhằm giải phóng dung lượng lưu trữ.

[hình ảnh: Trình quản lý tệp tin và cây thư mục tài liệu theo doanh nghiệp]

---

### 4.5. Nhật ký hoạt động & Lịch sử thay đổi (History Log)
Để đảm bảo tính minh bạch và an toàn dữ liệu, mọi thao tác thay đổi dữ liệu đều được ghi vết:
*   **Nhật ký hệ thống:** Lưu lại lịch sử hành động (CREATE - Tạo mới, UPDATE - Cập nhật, DELETE - Xóa, RESTORE - Khôi phục), tên tài khoản thực hiện, thời gian thực hiện và tên đối tượng bị thay đổi.
*   **So sánh chi tiết thay đổi:** Người dùng có thể click chọn xem chi tiết để xem sự thay đổi giá trị của dữ liệu (Giá trị cũ ➔ Giá trị mới) dưới dạng định dạng JSON chi tiết để dễ dàng đối soát khi xảy ra tranh chấp hoặc lỗi nhập liệu.

[hình ảnh: Nhật ký hệ thống và chi tiết so sánh giá trị JSON]

---
*VLU Enterprise Link - Kết nối bền vững, kiến tạo tương lai.*
