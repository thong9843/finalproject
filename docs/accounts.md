# Danh sách tài khoản hệ thống & Phân quyền

Hệ thống **VLU Enterprise Link** phân quyền thành 3 vai trò chính để đảm bảo tính an toàn dữ liệu và phân định rõ trách nhiệm của từng nhân sự.

---

## 🔑 Thông tin đăng nhập mặc định (Môi trường thử nghiệm)

> [!IMPORTANT]
> Mật khẩu đăng nhập mặc định cho tất cả các tài khoản là: **`123456`**

---

## 👥 Các vai trò và Quyền hạn

### 1. Quản trị viên hệ thống (`ADMIN`)
*   **Quyền hạn:** Toàn quyền kiểm soát hệ thống, cấu hình danh mục ngành nghề/quy mô doanh nghiệp, gộp dữ liệu trùng lặp toàn hệ thống, quản lý tài khoản người dùng, chuyển giao doanh nghiệp giữa các khoa và giám sát hoạt động của tất cả các khoa.
*   **Tài khoản mẫu:** `admin@vlu.edu.vn`

### 2. Quản lý Khoa (`FACULTY_MANAGER`)
*   **Quyền hạn:** Toàn quyền quản lý dữ liệu của Khoa mình phụ trách (thêm/sửa/xóa doanh nghiệp, ký MOU, phê duyệt hoạt động, phân công sinh viên, dùng bảng Kanban phối hợp công việc, Import dữ liệu bằng AI). Không thể xem dữ liệu của khoa khác.
*   **Tài khoản mẫu:** `manager.it@vlu.edu.vn` (Khoa Công nghệ Thông tin)

### 3. Giảng viên (`LECTURER`)
*   **Quyền hạn:** Xem dữ liệu doanh nghiệp và các hoạt động hợp tác của khoa; theo dõi và cập nhật tiến độ thực tập của nhóm sinh viên được phân công hướng dẫn; quản lý ghi chú công việc cá nhân. Không có quyền thêm mới doanh nghiệp, MOU hay phê duyệt hoạt động.
*   **Tài khoản mẫu:** `lecturer.it@vlu.edu.vn` (Khoa Công nghệ Thông tin)

---

## 📧 Danh sách Email tài khoản của 22 Khoa đào tạo

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

![Giao diện đăng nhập hệ thống](https://firebasestorage.googleapis.com/v0/b/quan-ly-doanh-nghiep-vlu.firebasestorage.app/o/docs%2Flogin.png?alt=media&token=21731059-471b-4d95-9465-f2561c53b00e)
