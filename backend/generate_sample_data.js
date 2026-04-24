const xlsx = require('xlsx');
const path = require('path');

// 1. Data cho Sheet1: TH (Tổng hợp liên hệ doanh nghiệp)
const thData = [
    {
        "STT": 1,
        "Danh xưng": "Ông",
        "Họ và tên": "Nguyễn Văn A",
        "Chức vụ": "Đại diện Tuyển dụng (Director Resource Management)",
        "Tên doanh nghiệp": "Công ty TNHH Công nghệ FPT",
        "Số điện thoại": "0901234567",
        "Email": "nva@fpt.com",
        "Địa chỉ": "Khu công nghệ cao Khu 9, Quận 9, TP.HCM",
        "Các hoạt động đã hợp tác": "Từng tuyển dụng thực tập, tham quan",
        "Trường": "Trường Đại học Văn Lang",
        "Khối phân loại": "Khối Công nghệ",
        "Khoa phân loại": "Khoa Công nghệ Thông tin",
        "Bộ môn phân loại": "Bộ môn Kỹ thuật Phần mềm"
    },
    {
        "STT": 2,
        "Danh xưng": "Bà",
        "Họ và tên": "Trần Thị B",
        "Chức vụ": "Trưởng phòng Đào tạo",
        "Tên doanh nghiệp": "Bệnh viện Đa khoa Tâm Anh",
        "Số điện thoại": "0987654321",
        "Email": "ttb@tamanhhospital.vn",
        "Địa chỉ": "2B Phổ Quang, Quận Tân Bình, TP.HCM",
        "Các hoạt động đã hợp tác": "Hướng dẫn lâm sàng từ 2021",
        "Trường": "Trường Đại học Văn Lang",
        "Khối phân loại": "Khối Sức khỏe",
        "Khoa phân loại": "Khoa Y",
        "Bộ môn phân loại": "Bộ môn Nội khoa"
    },
    {
        "STT": 3,
        "Danh xưng": "Ông",
        "Họ và tên": "Lê Văn C",
        "Chức vụ": "Giám đốc Sáng tạo",
        "Tên doanh nghiệp": "Công ty Truyền thông Cát Tiên Sa",
        "Số điện thoại": "0912345678",
        "Email": "lvc@cattiensa.com",
        "Địa chỉ": "Quận 3, TP.HCM",
        "Các hoạt động đã hợp tác": "Tài trợ đồ án tốt nghiệp, tham gia hội đồng chấm thi",
        "Trường": "Trường Đại học Văn Lang",
        "Khối phân loại": "Khối Nghệ thuật",
        "Khoa phân loại": "Khoa Quan hệ Công chúng - Truyền thông",
        "Bộ môn phân loại": "Truyền thông Đa phương tiện"
    }
];

// 2. Data cho Sheet2: MOU
const mouData = [
    {
        "STT": 1,
        "Mã biên bản": "MOU-ON-2024-FPT",
        "Tên đối tác": "Công ty TNHH Công nghệ FPT",
        "Ngày ký kết": "12/05/2024",
        "Đầu mối liên hệ của đối tác": "Nguyễn Văn A - Giám đốc Nhân sự",
        "Loại tổ chức": "Doanh nghiệp",
        "Quốc gia đối tác": "Việt Nam",
        "Mảng hợp tác": "Đào tạo và Cung ứng Nguồn nhân lực",
        "Đơn vị triển khai": "Khoa Công nghệ Thông tin (Khối Công nghệ)",
        "Đầu mối liên hệ VLU": "TS. Phạm Văn D",
        "Công tác đã triển khai NH 24-25": "Nhận 20 sinh viên thực tập doanh nghiệp",
        "Bước kế tiếp": "Xây dựng phòng Lab thực hành",
        "Hoạt động cũ": "Ngày hội việc làm 2023",
        "Số liệu liên quan": "1 ngành, 20 SV, 1 Lab",
        "Thư mục làm việc": "Drive/MOU/2024/FPT"
    },
    {
        "STT": 2,
        "Mã biên bản": "MOU-SK-2023-TA",
        "Tên đối tác": "Bệnh viện Đa khoa Tâm Anh",
        "Ngày ký kết": "15/10/2023",
        "Đầu mối liên hệ của đối tác": "Trần Thị B - Trưởng phòng Đào tạo",
        "Loại tổ chức": "Bệnh viện đa khoa",
        "Quốc gia đối tác": "Việt Nam",
        "Mảng hợp tác": "Thực hành Lâm sàng",
        "Đơn vị triển khai": "Khoa Y (Khối Sức khỏe)",
        "Đầu mối liên hệ VLU": "PGS.TS. Nguyễn Y",
        "Công tác đã triển khai NH 24-25": "Bố trí 50 SV thực tập lâm sàng",
        "Bước kế tiếp": "Tuyển dụng bác sĩ nội trú",
        "Hoạt động cũ": "Hội thảo sức khỏe sinh viên",
        "Số liệu liên quan": "50 SV, 5 Bác sĩ hướng dẫn",
        "Thư mục làm việc": "Drive/MOU/2023/TA"
    }
];

// 3. Data cho Sheet: Loại hoạt động (Đặc thù)
const activityTypeData = [
    {"STT": 1, "Mã loại": "TD-TT", "Tên loại hoạt động": "Tuyển dụng & Thực tập", "Khoa đặc thù (nếu có)": "Chung", "Mô tả": "Tổ chức ngày hội tuyển dụng, nhận sinh viên thực tập"},
    {"STT": 2, "Mã loại": "HT-WS", "Tên loại hoạt động": "Hội thảo / Workshop", "Khoa đặc thù (nếu có)": "Chung", "Mô tả": "Chia sẻ kinh nghiệm thực tế, quy trình làm việc"},
    {"STT": 3, "Mã loại": "TQ-CT", "Tên loại hoạt động": "Tham quan doanh nghiệp (Company Tour)", "Khoa đặc thù (nếu có)": "Chung", "Mô tả": "Đưa sinh viên đến tham quan môi trường thực tế"},
    {"STT": 4, "Mã loại": "LS-TH", "Tên loại hoạt động": "Thực tập Lâm sàng", "Khoa đặc thù (nếu có)": "Khoa Y, Khoa Răng Hàm Mặt, Khoa Điều dưỡng (Khối Sức khỏe)", "Mô tả": "Tiếp nhận sinh viên thực hành tại bệnh viện, phòng khám"},
    {"STT": 5, "Mã loại": "DA-TN", "Tên loại hoạt động": "Hướng dẫn Đồ án Tốt nghiệp", "Khoa đặc thù (nếu có)": "Khoa CNTT, Kỹ thuật", "Mô tả": "Doanh nghiệp ra đề tài thực tế và cử chuyên gia cùng hướng dẫn"},
    {"STT": 6, "Mã loại": "DL-TT", "Tên loại hoạt động": "Kiến tập/Thực tập Tour", "Khoa đặc thù (nếu có)": "Khoa Du lịch", "Mô tả": "Thực hành thiết kế và dẫn tour du lịch thực tế"},
    {"STT": 7, "Mã loại": "NT-BD", "Tên loại hoạt động": "Biểu diễn, Triển lãm Nghệ thuật", "Khoa đặc thù (nếu có)": "Khối Nghệ thuật", "Mô tả": "Phối hợp tổ chức sự kiện biểu diễn, triển lãm thiết kế"}
];

// 4. Data cho Sheet: Danh mục Đơn vị (Trường -> Khối -> Khoa)
const unitData = [
    {"Trường": "Trường Đại học Văn Lang", "Khối": "Khối Công nghệ", "Khoa": "Khoa Công nghệ Thông tin"},
    {"Trường": "Trường Đại học Văn Lang", "Khối": "Khối Công nghệ", "Khoa": "Khoa Kỹ thuật Ô tô"},
    {"Trường": "Trường Đại học Văn Lang", "Khối": "Khối Kiến trúc, Xây dựng", "Khoa": "Khoa Kiến trúc"},
    {"Trường": "Trường Đại học Văn Lang", "Khối": "Khối Kinh tế", "Khoa": "Khoa Quản trị Kinh doanh"},
    {"Trường": "Trường Đại học Văn Lang", "Khối": "Khối Sức khỏe", "Khoa": "Khoa Y"},
    {"Trường": "Trường Đại học Văn Lang", "Khối": "Khối Sức khỏe", "Khoa": "Khoa Răng Hàm Mặt"},
    {"Trường": "Trường Đại học Văn Lang", "Khối": "Khối Nghệ thuật", "Khoa": "Khoa Quan hệ Công chúng - Truyền thông"},
    {"Trường": "Trường Đại học Văn Lang", "Khối": "Khối Xã hội, Nhân văn", "Khoa": "Khoa Ngoại ngữ"},
];

const wb = xlsx.utils.book_new();

const wsTH = xlsx.utils.json_to_sheet(thData);
const wsMOU = xlsx.utils.json_to_sheet(mouData);
const wsActivity = xlsx.utils.json_to_sheet(activityTypeData);
const wsUnit = xlsx.utils.json_to_sheet(unitData);

// Adjust column widths for better view
const colsTH = [{wch:5}, {wch:10}, {wch:20}, {wch:40}, {wch:35}, {wch:15}, {wch:25}, {wch:40}, {wch:45}, {wch:25}, {wch:20}, {wch:30}, {wch:25}];
wsTH['!cols'] = colsTH;

const colsMOU = [{wch:5}, {wch:18}, {wch:35}, {wch:15}, {wch:35}, {wch:20}, {wch:15}, {wch:35}, {wch:35}, {wch:25}, {wch:40}, {wch:30}, {wch:30}, {wch:30}, {wch:25}];
wsMOU['!cols'] = colsMOU;

const colsActivity = [{wch:5}, {wch:10}, {wch:35}, {wch:55}, {wch:60}];
wsActivity['!cols'] = colsActivity;

const colsUnit = [{wch:30}, {wch:30}, {wch:40}];
wsUnit['!cols'] = colsUnit;

xlsx.utils.book_append_sheet(wb, wsTH, "1_TH");
xlsx.utils.book_append_sheet(wb, wsMOU, "2_MOU");
xlsx.utils.book_append_sheet(wb, wsActivity, "3_Loai_Hoat_Dong");
xlsx.utils.book_append_sheet(wb, wsUnit, "4_DMC_Truong_Khoi_Khoa");

const filePath = path.join(path.dirname(__dirname), 'Du_Lieu_Mau_Quan_Ly_Doanh_Nghiep.xlsx');
xlsx.writeFile(wb, filePath);

console.log('File created at:', filePath);
