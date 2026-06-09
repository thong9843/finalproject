/**
 * Consolidated Database Seeder for VLU Enterprise Link
 * Consolidates all scattered seeders into a single, unified database seeder.
 * Distributes enterprises, activities, and students across all 22 faculties.
 * Also generates realistic MOUs, Kanban tasks, and Notes for each faculty.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PASS_HASH = '123456'; // bcrypt of '123456'

// Profiles for the 22 faculties to dynamically rewrite student majors, classes, and advisors
const FACULTY_PROFILES = {
    1: {
        code: 'IT',
        majors: ['Kỹ thuật Phần mềm', 'Khoa học Máy tính', 'An toàn Thông tin', 'Hệ thống Thông tin'],
        classPrefix: 'K27-CNTT',
        advisors: ['TS. Phạm Văn Hùng', 'ThS. Lê Thanh Hà', 'TS. Nguyễn Minh Đức', 'ThS. Trần Quốc Bảo']
    },
    2: {
        code: 'BA',
        majors: ['Quản trị Kinh doanh', 'Quản trị Nhân sự', 'Kinh doanh Quốc tế'],
        classPrefix: 'K27-QTKD',
        advisors: ['PGS.TS. Lê Văn Nam', 'ThS. Nguyễn Thị Mai', 'ThS. Phạm Văn D']
    },
    3: {
        code: 'PR',
        majors: ['Quan hệ Công chúng', 'Tổ chức Sự kiện'],
        classPrefix: 'K27-PR',
        advisors: ['TS. Đỗ Kim Anh', 'ThS. Phan Thanh Sơn']
    },
    4: {
        code: 'ARCH',
        majors: ['Kiến trúc', 'Kiến trúc Cảnh quan'],
        classPrefix: 'K27-KT',
        advisors: ['KTS. Nguyễn Văn Dũng', 'ThS. Trần Thu Hà']
    },
    5: {
        code: 'FA',
        majors: ['Hội họa', 'Mỹ thuật Tạo hình'],
        classPrefix: 'K27-MT',
        advisors: ['Họa sĩ Lê Huy', 'ThS. Nguyễn Thị Bình']
    },
    6: {
        code: 'ID',
        majors: ['Thiết kế Công nghiệp', 'Thiết kế Sản phẩm'],
        classPrefix: 'K27-TKCN',
        advisors: ['TS. Ngô Minh Quân', 'ThS. Phạm Ngọc Lan']
    },
    7: {
        code: 'GD',
        majors: ['Thiết kế Đồ họa', 'Truyền thông Thị giác'],
        classPrefix: 'K27-TKDH',
        advisors: ['ThS. Nguyễn Lâm Diệu', 'ThS. Hoàng Huy']
    },
    8: {
        code: 'INT',
        majors: ['Thiết kế Nội thất', 'Trang trí Nội thất'],
        classPrefix: 'K27-TKNT',
        advisors: ['ThS. Vũ Hoài Nam', 'ThS. Đặng Thị Thủy']
    },
    9: {
        code: 'FASH',
        majors: ['Thiết kế Thời trang', 'Công nghệ May'],
        classPrefix: 'K27-TTFT',
        advisors: ['NTK. Lê Minh', 'ThS. Phạm Thị Dung']
    },
    10: {
        code: 'CE',
        majors: ['Kỹ thuật Xây dựng', 'Quản lý Xây dựng'],
        classPrefix: 'K27-XD',
        advisors: ['TS. Trần Văn Tuyên', 'ThS. Nguyễn Huy Bình']
    },
    11: {
        code: 'ME',
        majors: ['Kỹ thuật Cơ - Điện tử', 'Kỹ thuật Điện', 'Robotics'],
        classPrefix: 'K27-CĐT',
        advisors: ['TS. Võ Đình Tùng', 'ThS. Nguyễn Thành Trung']
    },
    12: {
        code: 'ECO',
        majors: ['Kinh tế học', 'Kinh tế Quốc tế'],
        classPrefix: 'K27-KTH',
        advisors: ['TS. Lê Thị Thảo', 'ThS. Phan Huy']
    },
    13: {
        code: 'MARK',
        majors: ['Marketing', 'Digital Marketing', 'Quản trị Thương hiệu'],
        classPrefix: 'K27-MKT',
        advisors: ['TS. Nguyễn Bích Phượng', 'ThS. Đặng Thành Đô']
    },
    14: {
        code: 'FIN',
        majors: ['Tài chính - Ngân hàng', 'Kế toán', 'Kiểm toán'],
        classPrefix: 'K27-TCKT',
        advisors: ['PGS.TS. Trần Thị Lan', 'ThS. Nguyễn Ngọc Anh']
    },
    15: {
        code: 'TOUR',
        majors: ['Quản trị Dịch vụ Du lịch và Lữ hành', 'Hướng dẫn Du lịch'],
        classPrefix: 'K27-DL',
        advisors: ['ThS. Nguyễn Văn A', 'ThS. Trần Thị B', 'ThS. Lê Văn C']
    },
    16: {
        code: 'HOTEL',
        majors: ['Quản trị Khách sạn', 'Quản trị Nhà hàng'],
        classPrefix: 'K27-KSNH',
        advisors: ['ThS. Hoàng Thị F', 'ThS. Trần Thế Dũng']
    },
    17: {
        code: 'LAW',
        majors: ['Luật học', 'Luật Kinh tế', 'Luật Quốc tế'],
        classPrefix: 'K27-LUAT',
        advisors: ['TS. Nguyễn Huy Hoàng', 'ThS. Phạm Thị Lan', 'ThS. Lê Văn Khải']
    },
    18: {
        code: 'ENG',
        majors: ['Ngôn ngữ Anh', 'Biên phiên dịch tiếng Anh'],
        classPrefix: 'K27-NNA',
        advisors: ['ThS. Nguyễn Thị Hoa', 'ThS. Trần Minh Nghĩa']
    },
    19: {
        code: 'COMM',
        majors: ['Truyền thông Đa phương tiện', 'Báo chí'],
        classPrefix: 'K27-TTBC',
        advisors: ['TS. Hồ Trúc Mai', 'ThS. Lê Hoàng Khang']
    },
    20: {
        code: 'PSY',
        majors: ['Tâm lý học học đường', 'Tâm lý học trị liệu'],
        classPrefix: 'K27-TLH',
        advisors: ['TS. Vương Kiến Quốc', 'ThS. Dương Minh Hạnh']
    },
    21: {
        code: 'NURS',
        majors: ['Điều dưỡng đa khoa', 'Quản lý Điều dưỡng'],
        classPrefix: 'K27-ĐD',
        advisors: ['ThS. Nguyễn Y', 'ThS. Trần Thị Bích']
    },
    22: {
        code: 'PHARM',
        majors: ['Dược học', 'Dược lâm sàng'],
        classPrefix: 'K27-DƯỢC',
        advisors: ['Dược sĩ Đặng Thanh Thắng', 'ThS. Phạm Thị Hoa']
    }
};

const ST_SCALES = [
    "Tier 1 (Tập đoàn/Global)",
    "Tier 2 (SME)",
    "Tier 3 (Startup/Micro)"
];

const ST_FIELDS = [
    // lĩnh vực chung (faculty_id = 0)
    { name: 'Phần mềm & Outsource',            facultyId: 0 },
    { name: 'Giải pháp CNTT & Chuyển đổi số',  facultyId: 0 },
    { name: 'Hạ tầng & Viễn thông',            facultyId: 0 },
    { name: 'Tài chính & Fintech',             facultyId: 0 },
    { name: 'Phần cứng & Điện tử',             facultyId: 0 },
    { name: 'Marketing & Truyền thông',         facultyId: 0 },
    { name: 'Xây dựng & Kiến trúc',            facultyId: 0 },
    { name: 'Thiết kế & Mỹ thuật',             facultyId: 0 },
    { name: 'Y tế & Chăm sóc sức khỏe',        facultyId: 0 },
    { name: 'Du lịch & Nhà hàng - Khách sạn',  facultyId: 0 },
    { name: 'Giáo dục & Đào tạo',             facultyId: 0 },
    { name: 'Pháp lý & Tư vấn',               facultyId: 0 },
    { name: 'Thương mại & Logistics',          facultyId: 0 },
    { name: 'Khác',                            facultyId: 0 },
    // Khoa Công nghệ Thông tin (faculty_id = 1)
    { name: 'Phát triển Phần mềm (Web/Mobile)',       facultyId: 1 },
    { name: 'Trí tuệ Nhân tạo & Học máy',            facultyId: 1 },
    { name: 'An toàn Thông tin & Bảo mật Mạng',      facultyId: 1 },
    { name: 'Khoa học Dữ liệu & Phân tích',          facultyId: 1 },
    { name: 'Điện toán Đám mây & DevOps',            facultyId: 1 },
    // Khoa Quản trị Kinh doanh (faculty_id = 2)
    { name: 'Quản trị Doanh nghiệp & Nhân sự',       facultyId: 2 },
    { name: 'Kinh doanh Quốc tế & Xuất nhập khẩu',   facultyId: 2 },
    { name: 'Chuỗi Cung ứng & Logistics',            facultyId: 2 },
    { name: 'Khởi nghiệp & Đổi mới sáng tạo',        facultyId: 2 },
    // Khoa Quan hệ Công chúng (faculty_id = 3)
    { name: 'Tổ chức Sự kiện & MICE',                facultyId: 3 },
    { name: 'Quan hệ Truyền thông & Báo chí',         facultyId: 3 },
    { name: 'Quảng bá Thương hiệu & PR Số',          facultyId: 3 },
    // Khoa Kiến trúc (faculty_id = 4)
    { name: 'Thiết kế Kiến trúc Công trình',          facultyId: 4 },
    { name: 'Quy hoạch Đô thị & Cảnh quan',          facultyId: 4 },
    { name: 'Thiết kế Nội ngoại thất Không gian',     facultyId: 4 },
    // Khoa Mỹ thuật (faculty_id = 5)
    { name: 'Hội họa & Điêu khắc Tạo hình',          facultyId: 5 },
    { name: 'Mỹ thuật Ứng dụng & Illustration',      facultyId: 5 },
    { name: 'Nghệ thuật Thị giác & Triển lãm',        facultyId: 5 },
    // Khoa Thiết kế Công nghiệp (faculty_id = 6)
    { name: 'Thiết kế Sản phẩm Công nghiệp',         facultyId: 6 },
    { name: 'Thiết kế Bao bì & Kiểu dáng Hàng tiêu dùng', facultyId: 6 },
    { name: 'Tạo mẫu Nhanh & In 3D',                 facultyId: 6 },
    // Khoa Thiết kế Đồ họa (faculty_id = 7)
    { name: 'Thiết kế Đồ họa & Nhận diện Thương hiệu', facultyId: 7 },
    { name: 'Thiết kế UI/UX & Truyền thông Số',      facultyId: 7 },
    { name: 'Sản xuất Nội dung Sáng tạo & Motion',   facultyId: 7 },
    // Khoa Thiết kế Nội thất (faculty_id = 8)
    { name: 'Thiết kế Nội thất Nhà ở & Thương mại',  facultyId: 8 },
    { name: 'Trang trí Không gian & Phong thủy',      facultyId: 8 },
    { name: 'Sản xuất Nội thất Gỗ & Vật liệu xây dựng', facultyId: 8 },
    // Khoa Thiết kế Thời trang (faculty_id = 9)
    { name: 'Thiết kế Thời trang & May mặc cao cấp', facultyId: 9 },
    { name: 'Công nghệ Dệt may & Phụ liệu thời trang', facultyId: 9 },
    { name: 'Thương mại Thời trang & Bán lẻ',        facultyId: 9 },
    // Khoa Kỹ thuật Công trình (faculty_id = 10)
    { name: 'Thi công & Quản lý Dự án Xây dựng',   facultyId: 10 },
    { name: 'Vật liệu Xây dựng & Kết cấu Công trình', facultyId: 10 },
    { name: 'Hạ tầng Giao thông & Thủy lợi',       facultyId: 10 },
    // Khoa Kỹ thuật Cơ - Điện tử (faculty_id = 11)
    { name: 'Tự động hóa & Robotics',              facultyId: 11 },
    { name: 'Kỹ thuật Điện & Điện tử',             facultyId: 11 },
    { name: 'Thiết bị Công nghiệp & IoT',          facultyId: 11 },
    // Khoa Kinh tế (faculty_id = 12)
    { name: 'Phân tích Kinh tế & Nghiên cứu Thị trường', facultyId: 12 },
    { name: 'Thương mại Quốc tế & Chính sách Kinh tế', facultyId: 12 },
    { name: 'Đầu tư & Quản lý Tài sản',            facultyId: 12 },
    // Khoa Marketing (faculty_id = 13)
    { name: 'Digital Marketing & Social Media',    facultyId: 13 },
    { name: 'Nghiên cứu Hành vi Tiêu dùng & CRM',  facultyId: 13 },
    { name: 'Quảng cáo Đa kênh & Performance Ads', facultyId: 13 },
    // Khoa Tài chính - Kế toán (faculty_id = 14)
    { name: 'Kiểm toán & Dịch vụ Kế toán',         facultyId: 14 },
    { name: 'Ngân hàng & Dịch vụ Tài chính',       facultyId: 14 },
    { name: 'Fintech & Thanh toán Điện tử',         facultyId: 14 },
    // Khoa Du lịch (faculty_id = 15)
    { name: 'Lữ hành & Điều hành Tour',             facultyId: 15 },
    { name: 'Du lịch Sinh thái & Cộng đồng',        facultyId: 15 },
    { name: 'Hướng dẫn Du lịch Quốc tế',           facultyId: 15 },
    // Khoa Khách sạn - Nhà hàng (faculty_id = 16)
    { name: 'Quản lý Khách sạn & Resort',           facultyId: 16 },
    { name: 'Ẩm thực & Dịch vụ Nhà hàng',          facultyId: 16 },
    { name: 'Tổ chức Tiệc & Dịch vụ Lưu trú',      facultyId: 16 },
    // Khoa Luật (faculty_id = 17)
    { name: 'Luật Doanh nghiệp & Thương mại',       facultyId: 17 },
    { name: 'Luật Lao động & Bảo hiểm Xã hội',      facultyId: 17 },
    { name: 'Luật Quốc tế & Trọng tài Thương mại',  facultyId: 17 },
    // Khoa Ngoại ngữ (faculty_id = 18)
    { name: 'Dạy học Tiếng Anh & Chứng chỉ Quốc tế', facultyId: 18 },
    { name: 'Biên dịch & Phiên dịch Thương mại',    facultyId: 18 },
    { name: 'Bản địa hóa & Văn hóa Đa ngôn ngữ',    facultyId: 18 },
    // Khoa Truyền thông & Báo chí (faculty_id = 19)
    { name: 'Báo chí & Sản xuất Nội dung Tin tức',  facultyId: 19 },
    { name: 'Truyền thông Đa phương tiện & Podcast', facultyId: 19 },
    { name: 'Sản xuất Phim & Hậu kỳ',               facultyId: 19 },
    // Khoa Tâm lý học (faculty_id = 20)
    { name: 'Tham vấn Tâm lý Học đường',            facultyId: 20 },
    { name: 'Trị liệu Tâm lý Lâm sàng',             facultyId: 20 },
    { name: 'Phát triển Kỹ năng Sống & Đào tạo Nhân lực', facultyId: 20 },
    // Khoa Điều dưỡng (faculty_id = 21)
    { name: 'Chăm sóc Điều dưỡng Bệnh viện',        facultyId: 21 },
    { name: 'Chăm sóc Sức khỏe Người cao tuổi',     facultyId: 21 },
    { name: 'Điều dưỡng Cộng đồng & Y tế Dự phòng', facultyId: 21 },
    // Khoa Dược (faculty_id = 22)
    { name: 'Dược lâm sàng & Tư vấn Dùng thuốc',    facultyId: 22 },
    { name: 'Nghiên cứu & Sản xuất Dược phẩm',      facultyId: 22 },
    { name: 'Kiểm nghiệm Dược liệu & Hóa dược',     facultyId: 22 }
];

const ST_ACT_TYPES = [
    "Tuyển dụng & Thực tập",
    "Hội thảo & Đào tạo",
    "Tài trợ & Học bổng",
    "Tham quan doanh nghiệp",
    "Kiểm định & Đánh giá",
    "Ký kết MOU",
    "Khác"
];

const FACULTY_DEPARTMENTS = {
    'IT':   ['Bộ môn Công nghệ Phần mềm', 'Bộ môn Hệ thống Thông tin', 'Bộ môn An toàn Thông tin'],
    'BA':   ['Bộ môn Quản trị Tổng hợp', 'Bộ môn Kinh doanh Quốc tế', 'Bộ môn Khởi nghiệp & Đổi mới'],
    'PR':   ['Bộ môn Quan hệ Công chúng', 'Bộ môn Tổ chức Sự kiện', 'Bộ môn Truyền thông Số'],
    'ARCH': ['Bộ môn Thiết kế Kiến trúc', 'Bộ môn Quy hoạch Đô thị', 'Bộ môn Kiến trúc Cảnh quan'],
    'FA':   ['Bộ môn Hội họa', 'Bộ môn Mỹ thuật Ứng dụng', 'Bộ môn Nghệ thuật Đương đại'],
    'ID':   ['Bộ môn Kiểu dáng Công nghiệp', 'Bộ môn Thiết kế Sản phẩm', 'Bộ môn Tạo mẫu & Chế tác'],
    'GD':   ['Bộ môn Thiết kế Đồ họa', 'Bộ môn Truyền thông Thị giác', 'Bộ môn Thiết kế Số & UI/UX'],
    'INT':  ['Bộ môn Thiết kế Nội thất', 'Bộ môn Trang trí Không gian', 'Bộ môn Vật liệu & Công nghệ Nội thất'],
    'FASH': ['Bộ môn Thiết kế Thời trang', 'Bộ môn Công nghệ May', 'Bộ môn Thời trang thị trường'],
    'CE':   ['Bộ môn Kỹ thuật Công trình', 'Bộ môn Quản lý Xây dựng', 'Bộ môn Kết cấu & Vật liệu'],
    'ME':   ['Bộ môn Kỹ thuật Cơ - Điện tử', 'Bộ môn Robot học', 'Bộ môn Điện tử & Viễn thông'],
    'ECO':  ['Bộ môn Kinh tế học', 'Bộ môn Kinh tế Quốc tế', 'Bộ môn Kinh tế Phát triển'],
    'MARK': ['Bộ môn Marketing', 'Bộ môn Digital Marketing', 'Bộ môn Nghiên cứu Thị trường'],
    'FIN':  ['Bộ môn Tài chính - Ngân hàng', 'Bộ môn Kế toán - Kiểm toán', 'Bộ môn Thuế & Tài chính Công'],
    'TOUR': ['Bộ môn Quản trị Dịch vụ Du lịch', 'Bộ môn Lữ hành', 'Bộ môn Hướng dẫn Du lịch'],
    'HOTEL':['Bộ môn Quản trị Khách sạn', 'Bộ môn Quản trị Nhà hàng', 'Bộ môn Nghệ thuật Ẩm thực'],
    'LAW':  ['Bộ môn Luật học', 'Bộ môn Luật Kinh tế', 'Bộ môn Luật Quốc tế'],
    'ENG':  ['Bộ môn Tiếng Anh Thương mại', 'Bộ môn Biên - Phiên dịch tiếng Anh', 'Bộ môn Ngôn ngữ và Văn hóa Anh'],
    'COMM': ['Bộ môn Truyền thông Đa phương tiện', 'Bộ môn Báo chí', 'Bộ môn Sản xuất Phim & TV'],
    'PSY':  ['Bộ môn Tâm lý học Tham vấn', 'Bộ môn Tâm lý học Lâm sàng', 'Bộ môn Tâm lý học Ứng dụng'],
    'NURS': ['Bộ môn Điều dưỡng Đa khoa', 'Bộ môn Quản lý Điều dưỡng', 'Bộ môn Điều dưỡng Cộng đồng'],
    'PHARM':['Bộ môn Dược lâm sàng', 'Bộ môn Hóa dược & Bào chế thuốc', 'Bộ môn Dược liệu & Dược cổ truyền']
};

const FICTIONAL_COMPANIES = {
    1: [ // IT
        { name: 'Công ty Cổ phần Giải pháp Công nghệ ViệtTech', scale: 'Tier 1 (Tập đoàn/Global)', domain: 'viettech.vn', fields: ['Phần mềm & Outsource', 'Phát triển Phần mềm (Web/Mobile)'] },
        { name: 'Tập đoàn Giải pháp Phần mềm AlphaSoft', scale: 'Tier 1 (Tập đoàn/Global)', domain: 'alphasoft.vn', fields: ['Phần mềm & Outsource', 'Trí tuệ Nhân tạo & Học máy'] },
        { name: 'Công ty TNHH Hệ thống Thông tin CloudVibe', scale: 'Tier 2 (SME)', domain: 'cloudvibe.vn', fields: ['Giải pháp CNTT & Chuyển đổi số', 'Điện toán Đám mây & DevOps'] },
        { name: 'Công ty Phát triển Công nghệ ByteCore', scale: 'Tier 3 (Startup/Micro)', domain: 'bytecore.io', fields: ['Phần mềm & Outsource', 'Khoa học Dữ liệu & Phân tích'] }
    ],
    2: [ // BA
        { name: 'Tập đoàn Bán lẻ & Phân phối GlobalMart', scale: 'Tier 1 (Tập đoàn/Global)', domain: 'globalmart.vn', fields: ['Thương mại & Logistics', 'Quản trị Doanh nghiệp & Nhân sự'] },
        { name: 'Công ty Cổ phần Logistics và Vận tải Đại Dương', scale: 'Tier 2 (SME)', domain: 'oceantrans.vn', fields: ['Thương mại & Logistics', 'Chuỗi Cung ứng & Logistics'] },
        { name: 'Công ty Tư vấn Giải pháp Quản trị Doanh nghiệp BizLead', scale: 'Tier 2 (SME)', domain: 'bizlead.vn', fields: ['Quản trị Doanh nghiệp & Nhân sự'] },
        { name: 'Công ty TNHH Dịch vụ Thương mại ApexGroup', scale: 'Tier 3 (Startup/Micro)', domain: 'apexgroup.com.vn', fields: ['Khởi nghiệp & Đổi mới sáng tạo'] }
    ],
    3: [ // PR
        { name: 'Creative Agency Truyền thông & Sự kiện StarPR', scale: 'Tier 2 (SME)', domain: 'starpr.agency', fields: ['Marketing & Truyền thông', 'Tổ chức Sự kiện & MICE'] },
        { name: 'Công ty Cổ phần Sự kiện BrightEvent', scale: 'Tier 2 (SME)', domain: 'brightevent.vn', fields: ['Tổ chức Sự kiện & MICE'] },
        { name: 'Agency Truyền thông và Quảng cáo BuzzMedia', scale: 'Tier 3 (Startup/Micro)', domain: 'buzzmedia.vn', fields: ['Marketing & Truyền thông', 'Quảng bá Thương hiệu & PR Số'] },
        { name: 'Công ty Tư vấn Thương hiệu VibePR', scale: 'Tier 3 (Startup/Micro)', domain: 'vibepr.vn', fields: ['Quan hệ Truyền thông & Báo chí'] }
    ],
    4: [ // ARCH
        { name: 'Văn phòng Thiết kế Kiến trúc Đất Việt', scale: 'Tier 2 (SME)', domain: 'datvietarch.vn', fields: ['Xây dựng & Kiến trúc', 'Thiết kế Kiến trúc Công trình'] },
        { name: 'Công ty Cổ phần Thiết kế & Quy hoạch Đô thị CanvasArch', scale: 'Tier 2 (SME)', domain: 'canvasarch.com', fields: ['Quy hoạch Đô thị & Cảnh quan'] },
        { name: 'Studio Kiến trúc và Cảnh quan GreenSpace', scale: 'Tier 3 (Startup/Micro)', domain: 'greenspace.design', fields: ['Thiết kế Kiến trúc Công trình', 'Xây dựng & Kiến trúc'] },
        { name: 'Công ty Tư vấn Thiết kế và Xây dựng SkyLine', scale: 'Tier 3 (Startup/Micro)', domain: 'skylinearch.vn', fields: ['Thiết kế Nội ngoại thất Không gian'] }
    ],
    5: [ // FA
        { name: 'Phòng tranh và Triển lãm Đông Đô Art Gallery', scale: 'Tier 2 (SME)', domain: 'dongdoart.vn', fields: ['Thiết kế & Mỹ thuật', 'Nghệ thuật Thị giác & Triển lãm'] },
        { name: 'Studio Mỹ thuật Sáng tạo ColorSpace', scale: 'Tier 3 (Startup/Micro)', domain: 'colorspace.vn', fields: ['Hội họa & Điêu khắc Tạo hình'] },
        { name: 'Công ty Thiết kế Mỹ thuật Ứng dụng ArtVibe', scale: 'Tier 3 (Startup/Micro)', domain: 'artvibe.design', fields: ['Mỹ thuật Ứng dụng & Illustration', 'Marketing & Truyền thông'] },
        { name: 'Phòng Thiết kế Tạo hình FineArt', scale: 'Tier 3 (Startup/Micro)', domain: 'fineart.vn', fields: ['Thiết kế & Mỹ thuật'] }
    ],
    6: [ // ID
        { name: 'Công ty Thiết kế Kiểu dáng Kiểu Mẫu Việt (VietID)', scale: 'Tier 2 (SME)', domain: 'vietid.design', fields: ['Thiết kế Sản phẩm Công nghiệp'] },
        { name: 'Tập đoàn Phát triển Sản phẩm Tiêu dùng Innova', scale: 'Tier 2 (SME)', domain: 'innovaproduct.vn', fields: ['Thiết kế Bao bì & Kiểu dáng Hàng tiêu dùng'] },
        { name: 'Studio Thiết kế Công nghiệp CreativePod', scale: 'Tier 3 (Startup/Micro)', domain: 'creativepod.vn', fields: ['Thiết kế Sản phẩm Công nghiệp', 'Tạo mẫu Nhanh & In 3D'] },
        { name: 'Công ty Giải pháp Tạo mẫu Sản phẩm ConceptID', scale: 'Tier 3 (Startup/Micro)', domain: 'conceptid.io', fields: ['Tạo mẫu Nhanh & In 3D'] }
    ],
    7: [ // GD
        { name: 'Creative Agency Đồ họa PixelArt', scale: 'Tier 2 (SME)', domain: 'pixelart.vn', fields: ['Marketing & Truyền thông', 'Thiết kế Đồ họa & Nhận diện Thương hiệu'] },
        { name: 'Studio Thiết kế và Nhận diện Thương hiệu BrandVibe', scale: 'Tier 2 (SME)', domain: 'brandvibe.vn', fields: ['Thiết kế Đồ họa & Nhận diện Thương hiệu'] },
        { name: 'Công ty TNHH Thiết kế Đồ họa và Quảng cáo RainbowGD', scale: 'Tier 3 (Startup/Micro)', domain: 'rainbowgd.com', fields: ['Thiết kế UI/UX & Truyền thông Số'] },
        { name: 'Studio Sáng tạo Kỹ thuật số VectorStudio', scale: 'Tier 3 (Startup/Micro)', domain: 'vectorstudio.vn', fields: ['Sản xuất Nội dung Sáng tạo & Motion'] }
    ],
    8: [ // INT
        { name: 'Tổng công ty Cổ phần Nội thất ViệtSpace', scale: 'Tier 2 (SME)', domain: 'vietspaceinterior.vn', fields: ['Thiết kế & Mỹ thuật', 'Thiết kế Nội thất Nhà ở & Thương mại'] },
        { name: 'Công ty Thiết kế và Trang trí Nhà đẹp DecoStyle', scale: 'Tier 2 (SME)', domain: 'decostyle.vn', fields: ['Trang trí Không gian & Phong thủy'] },
        { name: 'Studio Thiết kế Không gian Sống CozyHome', scale: 'Tier 3 (Startup/Micro)', domain: 'cozyhome.vn', fields: ['Thiết kế Nội thất Nhà ở & Thương mại'] },
        { name: 'Xưởng Sản xuất Nội thất Gỗ Mỹ nghệ WoodLand', scale: 'Tier 3 (Startup/Micro)', domain: 'woodland.com.vn', fields: ['Sản xuất Nội thất Gỗ & Vật liệu xây dựng'] }
    ],
    9: [ // FASH
        { name: 'Tập đoàn Thiết kế Thời trang ViệtStyle', scale: 'Tier 1 (Tập đoàn/Global)', domain: 'vietstylefashion.vn', fields: ['Thiết kế Thời trang & May mặc cao cấp'] },
        { name: 'Tổng công ty May mặc Đông Á', scale: 'Tier 2 (SME)', domain: 'dongagarment.vn', fields: ['Công nghệ Dệt may & Phụ liệu thời trang'] },
        { name: 'Nhà mốt Thiết kế Haute Couture ChicMode', scale: 'Tier 3 (Startup/Micro)', domain: 'chicmode.vn', fields: ['Thiết kế Thời trang & May mặc cao cấp'] },
        { name: 'Công ty TNHH May mặc và Thời trang FashionLine', scale: 'Tier 3 (Startup/Micro)', domain: 'fashionline.vn', fields: ['Thương mại Thời trang & Bán lẻ'] }
    ],
    10: [ // CE
        { name: 'Tổng công ty Xây dựng An Phong', scale: 'Tier 1 (Tập đoàn/Global)', domain: 'anphongcons.vn', fields: ['Xây dựng & Kiến trúc', 'Thi công & Quản lý Dự án Xây dựng'] },
        { name: 'Công ty Cổ phần Đầu tư và Xây dựng DeltaCons', scale: 'Tier 2 (SME)', domain: 'deltacons.vn', fields: ['Vật liệu Xây dựng & Kết cấu Công trình'] },
        { name: 'Công ty TNHH Xây dựng Hạ tầng Trường Sơn', scale: 'Tier 2 (SME)', domain: 'truongsoninfra.vn', fields: ['Hạ tầng Giao thông & Thủy lợi'] },
        { name: 'Công ty Tư vấn và Giám sát Công trình BuildCore', scale: 'Tier 3 (Startup/Micro)', domain: 'buildcore.vn', fields: ['Thi công & Quản lý Dự án Xây dựng'] }
    ],
    11: [ // ME
        { name: 'Công ty Tự động hóa và Thiết bị Robotec', scale: 'Tier 2 (SME)', domain: 'robotec.vn', fields: ['Tự động hóa & Robotics'] },
        { name: 'Công ty Kỹ thuật Cơ điện Đông Nam', scale: 'Tier 2 (SME)', domain: 'dongnamelectro.vn', fields: ['Kỹ thuật Điện & Điện tử'] },
        { name: 'Tập đoàn Công nghệ Phần cứng VinTech', scale: 'Tier 1 (Tập đoàn/Global)', domain: 'vintechhardware.com.vn', fields: ['Phần cứng & Điện tử', 'Thiết bị Công nghiệp & IoT'] },
        { name: 'Công ty TNHH Giải pháp Hệ thống AutoSys', scale: 'Tier 3 (Startup/Micro)', domain: 'autosys.vn', fields: ['Tự động hóa & Robotics', 'Thiết bị Công nghiệp & IoT'] }
    ],
    12: [ // ECO
        { name: 'Viện Nghiên cứu Kinh tế Phát triển Việt Nam', scale: 'Tier 2 (SME)', domain: 'vied.gov.vn', fields: ['Phân tích Kinh tế & Nghiên cứu Thị trường'] },
        { name: 'Công ty Đầu tư và Phân tích Thị trường SafeCapital', scale: 'Tier 2 (SME)', domain: 'safecapital.vn', fields: ['Tài chính & Fintech', 'Đầu tư & Quản lý Tài sản'] },
        { name: 'Công ty Cổ phần Thương mại Quốc tế Suntrade', scale: 'Tier 2 (SME)', domain: 'suntrade.vn', fields: ['Thương mại Quốc tế & Chính sách Kinh tế'] },
        { name: 'Công ty Tư vấn Phân tích Số liệu Kinh tế EcoAnalytics', scale: 'Tier 3 (Startup/Micro)', domain: 'ecoanalytics.vn', fields: ['Phân tích Kinh tế & Nghiên cứu Thị trường'] }
    ],
    13: [ // MARK
        { name: 'Digital Marketing Agency MaxGrow', scale: 'Tier 2 (SME)', domain: 'maxgrow.agency', fields: ['Marketing & Truyền thông', 'Digital Marketing & Social Media'] },
        { name: 'Công ty Tư vấn Thương hiệu BrandFirst', scale: 'Tier 2 (SME)', domain: 'brandfirst.vn', fields: ['Nghiên cứu Hành vi Tiêu dùng & CRM'] },
        { name: 'Agency Quảng cáo và Tiếp thị SunMedia', scale: 'Tier 2 (SME)', domain: 'sunmedia.vn', fields: ['Marketing & Truyền thông', 'Quảng cáo Đa kênh & Performance Ads'] },
        { name: 'Công ty Giải pháp Truyền thông Tiếp thị AdVibe', scale: 'Tier 3 (Startup/Micro)', domain: 'advibe.vn', fields: ['Digital Marketing & Social Media'] }
    ],
    14: [ // FIN
        { name: 'Công ty Kiểm toán Đông Dương (Indochina Audit)', scale: 'Tier 2 (SME)', domain: 'indochinaaudit.vn', fields: ['Tài chính & Fintech', 'Kiểm toán & Dịch vụ Kế toán'] },
        { name: 'Công ty Dịch vụ Kế toán và Thuế ViệtTax', scale: 'Tier 2 (SME)', domain: 'viettax.vn', fields: ['Kiểm toán & Dịch vụ Kế toán'] },
        { name: 'Công ty Đầu tư Tài chính SmartCapital', scale: 'Tier 2 (SME)', domain: 'smartcapital.vn', fields: ['Ngân hàng & Dịch vụ Tài chính'] },
        { name: 'Công ty Tư vấn Giải pháp Tài chính FinSecure', scale: 'Tier 3 (Startup/Micro)', domain: 'finsecure.vn', fields: ['Fintech & Thanh toán Điện tử'] }
    ],
    15: [ // TOUR
        { name: 'Công ty Cổ phần Du lịch Hướng Dương (Sunflower Travel)', scale: 'Tier 2 (SME)', domain: 'sunflowertravel.vn', fields: ['Du lịch & Nhà hàng - Khách sạn', 'Lữ hành & Điều hành Tour'] },
        { name: 'Công ty Lữ hành ViệtNam Discovery', scale: 'Tier 2 (SME)', domain: 'vndiscovery.com.vn', fields: ['Hướng dẫn Du lịch Quốc tế'] },
        { name: 'Công ty Dịch vụ và Quản lý Tour VibeTrip', scale: 'Tier 3 (Startup/Micro)', domain: 'vibetrip.vn', fields: ['Lữ hành & Điều hành Tour'] },
        { name: 'Công ty Du lịch Sinh thái GreenTour', scale: 'Tier 3 (Startup/Micro)', domain: 'greentour.vn', fields: ['Du lịch Sinh thái & Cộng đồng'] }
    ],
    16: [ // HOTEL
        { name: 'Khách sạn Sài Gòn Palace Hotel', scale: 'Tier 2 (SME)', domain: 'saigonpalace.com.vn', fields: ['Du lịch & Nhà hàng - Khách sạn', 'Quản lý Khách sạn & Resort'] },
        { name: 'Khu nghỉ dưỡng Bãi Cát Vàng (Gold Sand Resort)', scale: 'Tier 2 (SME)', domain: 'goldsandresort.vn', fields: ['Quản lý Khách sạn & Resort'] },
        { name: 'Công ty Dịch vụ Ẩm thực Imperial Catering', scale: 'Tier 3 (Startup/Micro)', domain: 'imperialcatering.vn', fields: ['Tổ chức Tiệc & Dịch vụ Lưu trú'] },
        { name: 'Chuỗi Nhà hàng Ẩm thực Việt FineDine', scale: 'Tier 3 (Startup/Micro)', domain: 'finedine.vn', fields: ['Ẩm thực & Dịch vụ Nhà hàng'] }
    ],
    17: [ // LAW
        { name: 'Văn phòng Luật sư Chí Thanh & Cộng sự', scale: 'Tier 2 (SME)', domain: 'chithanhlaw.vn', fields: ['Pháp lý & Tư vấn', 'Luật Doanh nghiệp & Thương mại'] },
        { name: 'Công ty Luật TNHH Minh Anh', scale: 'Tier 2 (SME)', domain: 'minhanhlegal.vn', fields: ['Luật Lao động & Bảo hiểm Xã hội'] },
        { name: 'Hãng luật Tư vấn Doanh nghiệp LegalTrust', scale: 'Tier 3 (Startup/Micro)', domain: 'legaltrust.vn', fields: ['Luật Doanh nghiệp & Thương mại'] },
        { name: 'Văn phòng Công chứng LexPartners', scale: 'Tier 3 (Startup/Micro)', domain: 'lexpartners.vn', fields: ['Luật Quốc tế & Trọng tài Thương mại'] }
    ],
    18: [ // ENG
        { name: 'Hệ thống Anh ngữ Ánh Dương (Sun English)', scale: 'Tier 2 (SME)', domain: 'sunenglish.edu.vn', fields: ['Giáo dục & Đào tạo', 'Dạy học Tiếng Anh & Chứng chỉ Quốc tế'] },
        { name: 'Công ty Dịch thuật & Bản địa hóa GlobeTrans', scale: 'Tier 2 (SME)', domain: 'globetrans.vn', fields: ['Biên dịch & Phiên dịch Thương mại'] },
        { name: 'Trung tâm Đào tạo Ngôn ngữ Quốc tế WorldLink', scale: 'Tier 3 (Startup/Micro)', domain: 'worldlink.edu.vn', fields: ['Giáo dục & Đào tạo', 'Bản địa hóa & Văn hóa Đa ngôn ngữ'] },
        { name: 'Văn phòng Biên dịch và Hiệu đính LingoStudy', scale: 'Tier 3 (Startup/Micro)', domain: 'lingostudy.vn', fields: ['Biên dịch & Phiên dịch Thương mại'] }
    ],
    19: [ // COMM
        { name: 'Hãng tin ViệtNam Today', scale: 'Tier 2 (SME)', domain: 'vntoday.vn', fields: ['Marketing & Truyền thông', 'Báo chí & Sản xuất Nội dung Tin tức'] },
        { name: 'Công ty Sản xuất Phim ảnh ViệtMedia', scale: 'Tier 2 (SME)', domain: 'vietmedia.com.vn', fields: ['Sản xuất Phim & Hậu kỳ'] },
        { name: 'Đài Phát thanh và Truyền hình Á Đông (ADong Broadcast)', scale: 'Tier 2 (SME)', domain: 'adongbroadcast.vn', fields: ['Truyền thông Đa phương tiện & Podcast'] },
        { name: 'Kênh Truyền thông Kỹ thuật số BuzzNews', scale: 'Tier 3 (Startup/Micro)', domain: 'buzznews.vn', fields: ['Báo chí & Sản xuất Nội dung Tin tức'] }
    ],
    20: [ // PSY
        { name: 'Trung tâm Tham vấn Tâm lý An Nhiên', scale: 'Tier 2 (SME)', domain: 'annhienmind.vn', fields: ['Tham vấn Tâm lý Học đường'] },
        { name: 'Viện Trị liệu Tâm lý Cánh Cửa Mở', scale: 'Tier 2 (SME)', domain: 'opendoorpsy.vn', fields: ['Trị liệu Tâm lý Lâm sàng'] },
        { name: 'Trung tâm Phát triển Kỹ năng sống MindCare', scale: 'Tier 3 (Startup/Micro)', domain: 'mindcare.vn', fields: ['Phát triển Kỹ năng Sống & Đào tạo Nhân lực'] },
        { name: 'Văn phòng Tư vấn Tâm lý ZenTherapy', scale: 'Tier 3 (Startup/Micro)', domain: 'zentherapy.vn', fields: ['Tham vấn Tâm lý Học đường', 'Trị liệu Tâm lý Lâm sàng'] }
    ],
    21: [ // NURS
        { name: 'Bệnh viện Đa khoa Vạn Xuân', scale: 'Tier 1 (Tập đoàn/Global)', domain: 'vanxuanhospital.vn', fields: ['Y tế & Chăm sóc sức khỏe', 'Chăm sóc Điều dưỡng Bệnh viện'] },
        { name: 'Trung tâm Chăm sóc Sức khỏe Người cao tuổi An Bình', scale: 'Tier 2 (SME)', domain: 'anbinhcare.vn', fields: ['Chăm sóc Sức khỏe Người cao tuổi'] },
        { name: 'Phòng khám Đa khoa Quốc tế GreenClinic', scale: 'Tier 2 (SME)', domain: 'greenclinic.vn', fields: ['Y tế & Chăm sóc sức khỏe', 'Điều dưỡng Cộng đồng & Y tế Dự phòng'] },
        { name: 'Dịch vụ Chăm sóc Y tế tại nhà LifeHealth', scale: 'Tier 3 (Startup/Micro)', domain: 'lifehealth.vn', fields: ['Điều dưỡng Cộng đồng & Y tế Dự phòng'] }
    ],
    22: [ // PHARM
        { name: 'Hệ thống Nhà thuốc An Tâm Pharma', scale: 'Tier 2 (SME)', domain: 'antampharma.vn', fields: ['Y tế & Chăm sóc sức khỏe', 'Dược lâm sàng & Tư vấn Dùng thuốc'] },
        { name: 'Công ty Cổ phần Dược phẩm Nam Việt (Navipharm)', scale: 'Tier 2 (SME)', domain: 'navipharm.vn', fields: ['Nghiên cứu & Sản xuất Dược phẩm'] },
        { name: 'Phòng thí nghiệm Nghiên cứu Dược học BioLab', scale: 'Tier 3 (Startup/Micro)', domain: 'biolab.vn', fields: ['Kiểm nghiệm Dược liệu & Hóa dược'] },
        { name: 'Công ty Sản xuất Dược liệu MedVina', scale: 'Tier 3 (Startup/Micro)', domain: 'medvina.vn', fields: ['Nghiên cứu & Sản xuất Dược phẩm'] }
    ]
};


const FACULTY_ACTIVITY_TEMPLATES = {
    1: [ // IT
        { title: 'Chương trình Tuyển dụng Thực tập sinh Lập trình 2025', detail: 'Tuyển dụng sinh viên thực tập các vị trí Frontend, Backend, Mobile và DevOps.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Hội thảo: Xu hướng Trí tuệ Nhân tạo & Điện toán Đám mây', detail: 'Chia sẻ từ các chuyên gia về ứng dụng AI trong thực tế và các giải pháp hạ tầng đám mây.', type: 'Hội thảo & Đào tạo' },
        { title: 'Chương trình Tham quan Trải nghiệm Trung tâm Dữ liệu', detail: 'Tổ chức cho sinh viên tham quan thực tế hạ tầng mạng và hệ thống máy chủ.', type: 'Tham quan doanh nghiệp' }
    ],
    2: [ // BA
        { title: 'Tuyển thực tập sinh Quản trị viên Tập sự', detail: 'Tuyển sinh viên thực tập các mảng Quản trị Nhân sự, Chuỗi cung ứng và Phát triển Kinh doanh.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Kỹ năng Lập kế hoạch Kinh doanh Khởi nghiệp', detail: 'Tọa đàm hướng dẫn sinh viên xây dựng mô hình kinh doanh và quản trị rủi ro.', type: 'Hội thảo & Đào tạo' },
        { title: 'Tọa đàm: Xu hướng Chuyển đổi số trong Quản trị', detail: 'Hội thảo chia sẻ kinh nghiệm vận hành doanh nghiệp thời đại công nghệ số.', type: 'Hội thảo & Đào tạo' }
    ],
    3: [ // PR
        { title: 'Thực tập sinh Điều phối Sự kiện & Quan hệ Công chúng', detail: 'Tuyển dụng sinh viên thực tập hỗ trợ lên kế hoạch và vận hành các dự án sự kiện.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Kỹ năng Viết bài PR và Phát biểu Báo chí', detail: 'Đào tạo kỹ năng thực chiến cho sinh viên ngành truyền thông sự kiện.', type: 'Hội thảo & Đào tạo' },
        { title: 'Chương trình Tham quan Agency Truyền thông Sáng tạo', detail: 'Tìm hiểu quy trình làm việc thực tế tại văn phòng agency quảng cáo.', type: 'Tham quan doanh nghiệp' }
    ],
    4: [ // ARCH
        { title: 'Thực tập sinh Thiết kế Kiến trúc và Triển khai Bản vẽ', detail: 'Tuyển dụng sinh viên thực tập hỗ trợ vẽ CAD, dựng hình 3D các công trình thực tế.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Hội thảo chuyên đề: Kiến trúc xanh và Phát triển bền vững', detail: 'Chia sẻ xu hướng thiết kế tối ưu năng lượng và sử dụng vật liệu thân thiện môi trường.', type: 'Hội thảo & Đào tạo' },
        { title: 'Triển lãm các Đồ án Kiến trúc xuất sắc thường niên', detail: 'Tài trợ tổ chức không gian trưng bày các tác phẩm đồ án tốt nghiệp của sinh viên.', type: 'Tài trợ & Học bổng' }
    ],
    5: [ // FA
        { title: 'Thực tập sinh Mỹ thuật Ứng dụng & Phục dựng Nghệ thuật', detail: 'Hỗ trợ sinh viên thực hành tạo hình và tham gia thiết kế mỹ thuật tại studio.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Trải nghiệm các kỹ thuật Vẽ tranh Sơn dầu hiện đại', detail: 'Buổi thực hành có sự hướng dẫn của họa sĩ đại diện phòng tranh.', type: 'Hội thảo & Đào tạo' },
        { title: 'Triển lãm Mỹ thuật Giao lưu Nghệ sĩ trẻ', detail: 'Tổ chức sự kiện kết nối giới nghệ thuật với sinh viên mỹ thuật tiềm năng.', type: 'Hội thảo & Đào tạo' }
    ],
    6: [ // ID
        { title: 'Tuyển thực tập sinh Kiểu dáng và Phát triển Sản phẩm', detail: 'Tuyển sinh viên tham gia thiết kế bao bì, kiểu dáng sản phẩm gia dụng và công nghệ.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Quy trình Tạo mẫu Nhanh bằng Công nghệ In 3D', detail: 'Hướng dẫn thực hành tạo mẫu sản phẩm từ bản vẽ ý tưởng.', type: 'Hội thảo & Đào tạo' },
        { title: 'Hội thảo: Xu hướng Thiết kế Sản phẩm Thông minh', detail: 'Thảo luận về sự giao thoa giữa kiểu dáng công nghiệp và công nghệ số.', type: 'Hội thảo & Đào tạo' }
    ],
    7: [ // GD
        { title: 'Tuyển thực tập sinh Thiết kế Đồ họa và Nhận diện Thương hiệu', detail: 'Thực tập thiết kế ấn phẩm truyền thông, logo và bộ nhận diện thương hiệu.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Tư duy Sáng tạo trong Thiết kế Giao diện UI/UX', detail: 'Chia sẻ kinh nghiệm thiết kế sản phẩm số thân thiện với người dùng.', type: 'Hội thảo & Đào tạo' },
        { title: 'Talkshow: Xây dựng Portfolio ấn tượng thu hút nhà tuyển dụng', detail: 'Hướng dẫn chuẩn bị hồ sơ năng lực dành cho sinh viên thiết kế đồ họa.', type: 'Hội thảo & Đào tạo' }
    ],
    8: [ // INT
        { title: 'Tuyển thực tập sinh Họa viên Nội thất và Dựng hình 3D', detail: 'Phối hợp triển khai bản vẽ mặt bằng và dựng phối cảnh không gian nội thất.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Cập nhật Xu hướng Vật liệu và Thiết bị Nội thất mới', detail: 'Giới thiệu các dòng vật liệu mới thân thiện môi trường trong kiến tạo không gian.', type: 'Hội thảo & Đào tạo' },
        { title: 'Chương trình Tham quan Showroom Thiết bị và Xưởng Gỗ', detail: 'Giúp sinh viên tìm hiểu quy trình sản xuất và thi công lắp đặt thực tế.', type: 'Tham quan doanh nghiệp' }
    ],
    9: [ // FASH
        { title: 'Thực tập sinh Thiết kế Thời trang & Trợ lý Stylist', detail: 'Hỗ trợ thiết kế rập, tìm kiếm phụ liệu và chuẩn bị cho bộ sưu tập thời trang.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Kỹ thuật Draping và Cắt may cao cấp trên Ma-nơ-canh', detail: 'Hướng dẫn trực quan kỹ thuật dựng phom dáng 3D hiện đại.', type: 'Hội thảo & Đào tạo' },
        { title: 'Tài trợ Vải và Phụ liệu cho Đồ án Tốt nghiệp xuất sắc', detail: 'Chương trình tài trợ học bổng và vật tư thiết kế cho sinh viên năm cuối.', type: 'Tài trợ & Học bổng' }
    ],
    10: [ // CE
        { title: 'Tuyển thực tập sinh Kỹ sư Giám sát Công trường Xây dựng', detail: 'Thực tập đo đạc, kiểm tra bản vẽ và giám sát tiến độ thi công thực tế.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Hội thảo chuyên đề: Công nghệ Quản lý Dự án B.I.M trong Xây dựng', detail: 'Giới thiệu ứng dụng mô hình thông tin công trình vào thực tiễn quản lý.', type: 'Hội thảo & Đào tạo' },
        { title: 'Tham quan Thực địa Dự án Hạ tầng Giao thông trọng điểm', detail: 'Tổ chức tham quan tìm hiểu quy trình thi công móng cọc và kết cấu dầm.', type: 'Tham quan doanh nghiệp' }
    ],
    11: [ // ME
        { title: 'Tuyển thực tập sinh Cơ - Điện tử và Lập trình Robot', detail: 'Tham gia thiết kế mạch điện, lập trình PLC và vận hành hệ thống tự động hóa.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Chế tạo và Vận hành Thiết bị Bay không người lái (UAV)', detail: 'Buổi trải nghiệm thực hành chế tạo robot tích hợp vi điều khiển.', type: 'Hội thảo & Đào tạo' },
        { title: 'Tham quan Dây chuyền Sản xuất và Lắp ráp Điện tử thông minh', detail: 'Tìm hiểu quy trình tự động hóa hoàn toàn trong nhà máy sản xuất linh kiện.', type: 'Tham quan doanh nghiệp' }
    ],
    12: [ // ECO
        { title: 'Thực tập sinh Nghiên cứu Thị trường & Phân tích Kinh tế', detail: 'Hỗ trợ thu thập, xử lý và phân tích số liệu kinh tế vĩ mô và vi mô.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Tọa đàm: Dự báo Biến động Kinh tế toàn cầu và Tác động đến Việt Nam', detail: 'Thảo luận chuyên sâu với các chuyên gia phân tích chính sách kinh tế.', type: 'Hội thảo & Đào tạo' },
        { title: 'Workshop: Ứng dụng công cụ R và Python trong phân tích số liệu', detail: 'Hướng dẫn sinh viên sử dụng phần mềm phân tích thống kê trong nghiên cứu.', type: 'Hội thảo & Đào tạo' }
    ],
    13: [ // MARK
        { title: 'Tuyển thực tập sinh Content Creator và Digital Marketing', detail: 'Thực tập lên kế hoạch nội dung mạng xã hội, hỗ trợ tối ưu chiến dịch quảng cáo.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Kỹ năng Xây dựng Chiến dịch Quảng cáo đa kênh', detail: 'Chia sẻ các bước tối ưu chi phí quảng cáo Facebook, Google và TikTok.', type: 'Hội thảo & Đào tạo' },
        { title: 'Tọa đàm: Vai trò của Sáng tạo Nội dung trong Kỷ nguyên số', detail: 'Chia sẻ kỹ năng viết bài chuẩn SEO và sáng tạo kịch bản video ngắn.', type: 'Hội thảo & Đào tạo' }
    ],
    14: [ // FIN
        { title: 'Tuyển thực tập sinh Trợ lý Kiểm toán viên và Kế toán nội bộ', detail: 'Hỗ trợ kiểm tra chứng từ, đối chiếu số liệu và rà soát sổ sách kế toán.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Quy trình Kế toán Thuế và Kê khai Thuế doanh nghiệp', detail: 'Hướng dẫn thực hành báo cáo thuế định kỳ theo quy định pháp luật mới nhất.', type: 'Hội thảo & Đào tạo' },
        { title: 'Hội thảo: Ứng dụng Công nghệ Blockchain trong Giao dịch Tài chính', detail: 'Tìm hiểu về tương lai của Fintech và tác động đến ngành tài chính ngân hàng.', type: 'Hội thảo & Đào tạo' }
    ],
    15: [ // TOUR
        { title: 'Tuyển thực tập sinh Điều hành Tour và Hướng dẫn viên du lịch', detail: 'Hỗ trợ chuẩn bị hồ sơ đoàn khách, đặt dịch vụ và hướng dẫn thực tế các tour ngắn ngày.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Chương trình Huấn luyện Nghiệp vụ Lữ hành thực chiến', detail: 'Trải nghiệm dẫn tour giả định dưới sự chấm điểm của chuyên gia du lịch.', type: 'Hội thảo & Đào tạo' },
        { title: 'Hội thảo: Phát triển Sản phẩm Du lịch Sinh thái bền vững', detail: 'Thảo luận phương pháp thu hút khách quốc tế trải nghiệm du lịch cộng đồng.', type: 'Hội thảo & Đào tạo' }
    ],
    16: [ // HOTEL
        { title: 'Tuyển thực tập sinh Lễ tân, Buồng phòng và Phục vụ bàn', detail: 'Thực tập nghiệp vụ tiêu chuẩn 5 sao tại các bộ phận tiền sảnh và nhà hàng.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Nghệ thuật Pha chế đồ uống và Chế biến Ẩm thực Á-Âu', detail: 'Trải nghiệm lớp học làm bánh và pha chế cocktail cùng bartender chuyên nghiệp.', type: 'Hội thảo & Đào tạo' },
        { title: 'Tham quan thực tế mô hình Vận hành Khách sạn cao cấp', detail: 'Giới thiệu quy trình check-in/check-out và quản lý nhân sự buồng phòng.', type: 'Tham quan doanh nghiệp' }
    ],
    17: [ // LAW
        { title: 'Tuyển thực tập sinh Pháp lý doanh nghiệp và Trợ lý Luật sư', detail: 'Hỗ trợ soạn thảo hợp đồng thương mại, tra cứu văn bản pháp luật và chuẩn bị hồ sơ tranh tụng.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Tọa đàm: Kỹ năng Soạn thảo Hợp đồng Thương mại Quốc tế', detail: 'Chia sẻ các điều khoản quan trọng và cách giảm thiểu rủi ro pháp lý.', type: 'Hội thảo & Đào tạo' },
        { title: 'Hội thảo chuyên đề: Tìm hiểu Luật Đất đai sửa đổi bổ sung', detail: 'Phân tích các tác động mới nhất của luật đất đai đến thị trường bất động sản.', type: 'Hội thảo & Đào tạo' }
    ],
    18: [ // ENG
        { title: 'Tuyển thực tập sinh Giảng dạy Tiếng Anh và Biên phiên dịch', detail: 'Thực tập trợ giảng lớp học tiếng Anh giao tiếp, dịch tài liệu chuyên ngành thương mại.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Kỹ thuật Biên dịch và Bản địa hóa tài liệu đa quốc gia', detail: 'Phương pháp dịch thuật tự nhiên, chính xác các thuật ngữ kinh tế.', type: 'Hội thảo & Đào tạo' },
        { title: 'Hội thảo: Kỹ năng Giao tiếp Ngoại giao trong môi trường Đa văn hóa', detail: 'Đào tạo kỹ năng làm việc nhóm, đàm phán bằng tiếng Anh chuyên nghiệp.', type: 'Hội thảo & Đào tạo' }
    ],
    19: [ // COMM
        { title: 'Tuyển thực tập sinh Biên tập viên và Kỹ thuật viên dựng hình', detail: 'Hỗ trợ viết kịch bản, thu thập tư liệu báo chí và dựng các clip ngắn truyền thông.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Quy trình Sản xuất Bản tin Truyền hình và Video ngắn', detail: 'Hướng dẫn thực hành các kỹ thuật quay phim, biên tập tin tức trên điện thoại.', type: 'Hội thảo & Đào tạo' },
        { title: 'Hội thảo: Đạo đức báo chí và phòng chống tin giả trên mạng xã hội', detail: 'Trao đổi về kỹ năng xác thực thông tin và kiểm chứng nguồn tin.', type: 'Hội thảo & Đào tạo' }
    ],
    20: [ // PSY
        { title: 'Tuyển thực tập sinh Tham vấn học đường và Hỗ trợ kỹ năng sống', detail: 'Hỗ trợ tổ chức chuyên đề kỹ năng sống, thực tập tư vấn tâm lý học đường dưới sự giám sát.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Kỹ năng Nhận diện và Sơ cứu tâm lý khủng hoảng tuổi dậy thì', detail: 'Hướng dẫn cách tham vấn và hỗ trợ học sinh vượt qua stress.', type: 'Hội thảo & Đào tạo' },
        { title: 'Tọa đàm: Ứng dụng Trị liệu Tâm lý Nghệ thuật trong giải tỏa áp lực', detail: 'Giới thiệu phương pháp vẽ tranh, âm nhạc phục vụ chăm sóc sức khỏe tinh thần.', type: 'Hội thảo & Đào tạo' }
    ],
    21: [ // NURS
        { title: 'Tuyển thực tập sinh Điều dưỡng Đa khoa tại Khoa Cấp cứu', detail: 'Thực tập kỹ thuật chăm sóc người bệnh toàn diện, hỗ trợ bác sĩ làm thủ thuật.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Nghiệp vụ Quy trình Cấp cứu ban đầu trong tai nạn giao thông', detail: 'Hướng dẫn thực hành hồi sức tim phổi CPR và cố định vết thương.', type: 'Hội thảo & Đào tạo' },
        { title: 'Tọa đàm: Kỹ năng Giao tiếp và Chăm sóc người bệnh nặng', detail: 'Rèn luyện thái độ phục vụ và nghệ thuật giao tiếp xoa dịu tinh thần bệnh nhân.', type: 'Hội thảo & Đào tạo' }
    ],
    22: [ // PHARM
        { title: 'Tuyển thực tập sinh Dược sĩ tư vấn và Quản lý Kho dược', detail: 'Thực tập sắp xếp thuốc theo tiêu chuẩn GPP, hỗ trợ tư vấn sử dụng thuốc an toàn.', type: 'Tuyển dụng & Thực tập' },
        { title: 'Workshop: Quy trình Kiểm nghiệm và Đánh giá chất lượng Dược liệu', detail: 'Hướng dẫn thực hành chiết xuất tinh dầu và hoạt chất từ cây thảo dược.', type: 'Hội thảo & Đào tạo' },
        { title: 'Hội thảo: Xu hướng ứng dụng Công nghệ Nano trong bào chế thuốc', detail: 'Cập nhật nghiên cứu mới nhất giúp tăng khả năng hấp thu của dược chất.', type: 'Hội thảo & Đào tạo' }
    ]
};

// Helper to read CSV from Output_DB
const outputDbDir = path.join(__dirname, '..', 'Output_DB');
function readCSV(filename) {
    const filePath = path.join(outputDbDir, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return [];
    }
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });
    return data.map(row => {
        const normalized = {};
        for (const key in row) {
            normalized[key.trim().toLowerCase()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
        }
        return normalized;
    });
}

// Fictional helper generators
function getFakeRepName(index) {
    const familyNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Vũ', 'Hoàng', 'Phan', 'Huỳnh'];
    const middleNames = ['Văn', 'Thị', 'Hoàng', 'Minh', 'Thanh', 'Ngọc', 'Quốc', 'Kim'];
    const lastNames = ['Hùng', 'Lan', 'Đạt', 'Duy', 'Hoa', 'Sơn', 'Anh', 'Bình', 'Trang', 'Khánh'];

    const family = familyNames[index % familyNames.length];
    const middle = middleNames[(index * 3) % middleNames.length];
    const last = lastNames[(index * 7) % lastNames.length];
    return `${family} ${middle} ${last}`;
}

function getFakeRepRole(index) {
    const roles = ['Giám đốc', 'Trưởng phòng Nhân sự', 'Phó Giám đốc', 'Trưởng ban Tuyển dụng', 'Đại diện Hợp tác'];
    return roles[index % roles.length];
}

function getFakeBuilding(index) {
    const buildings = [
        'Tầng 12, Tòa nhà Alpha, 15 Nguyễn Huệ',
        'Tòa nhà Pax Sky, 123 Nguyễn Thị Minh Khai',
        'Phòng 502, Green Building, 456 Điện Biên Phủ',
        'Lầu 3, Royal Tower, 789 Nguyễn Lương Bằng',
        'Tầng trệt, Landmark Space, 50 Tô Hiến Thành',
        'Tòa nhà Saigon Co-working, 88 Phổ Quang'
    ];
    return buildings[index % buildings.length];
}

function getFakeDistrict(index) {
    const districts = ['Quận 1', 'Quận 3', 'Quận 7', 'Quận 10', 'Quận Bình Thạnh', 'TP. Thủ Đức'];
    return districts[index % districts.length];
}

// Parser for student SQL files
function parseStudentSql(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const students = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('(') && (trimmed.endsWith('),') || trimmed.endsWith(');') || trimmed.endsWith(')'))) {
            let cleanLine = trimmed;
            if (cleanLine.endsWith(',')) cleanLine = cleanLine.slice(0, -1);
            if (cleanLine.endsWith(';')) cleanLine = cleanLine.slice(0, -1);
            cleanLine = cleanLine.trim();
            if (cleanLine.startsWith('(') && cleanLine.endsWith(')')) {
                cleanLine = cleanLine.slice(1, -1);

                const values = [];
                let current = '';
                let inQuotes = false;
                for (let i = 0; i < cleanLine.length; i++) {
                    const char = cleanLine[i];
                    if (char === "'") {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim());

                const parsedValues = values.map(val => {
                    if (val.toUpperCase() === 'NULL') return null;
                    return val;
                });

                if (parsedValues[0] === 'student_code') {
                    continue;
                }

                students.push(parsedValues);
            }
        }
    }
    return students;
}

async function seed() {
    console.log('🚀 Starting Consolidated Database Seeder...');

    // First setup connection parameters
    const connectionParams = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    let conn;
    try {
        conn = await mysql.createConnection(connectionParams);
        console.log('Connected to MySQL server.');

        // Step 1: Run schema (database.sql) to get a clean layout
        const sqlFilePath = path.join(__dirname, '..', 'database.sql');
        console.log(`Executing schema file: ${sqlFilePath}`);
        const sql = fs.readFileSync(sqlFilePath, 'utf8');
        await conn.query(sql);
        console.log('✔ Schema initialized successfully.');

        // Now select the DB for transactional queries
        await conn.query(`USE \`${process.env.DB_NAME || 'vlu_enterprise_link'}\``);

        console.log('Disabling foreign key checks and clearing database tables...');
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');

        // Step 2: Truncate tables we want to seed dynamically
        const tablesToClear = [
            'tasks', 'notes', 'action_history', 'workflow_history', 'enterprise_ratings',
            'students', 'mous', 'activity_target_map', 'activity_type_map', 'activities',
            'enterprise_fields', 'enterprise_addresses', 'enterprise_representatives', 'enterprises',
            'departments', 'targets', 'act_types', 'scales', 'fields'
        ];
        for (const table of tablesToClear) {
            await conn.query(`TRUNCATE TABLE \`${table}\``);
        }
        console.log('✔ Transactional tables cleared.');

        // Step 3: Seed Reference Static Data (Scales, Fields, Act Types, Targets)
        console.log('Seeding scales, fields, and activity types...');
        const scaleMap = {};
        for (const [i, name] of ST_SCALES.entries()) {
            await conn.query('INSERT INTO scales (id, name) VALUES (?, ?)', [i + 1, name]);
            scaleMap[name] = i + 1;
        }

        const fieldMap = {};
        for (const [i, field] of ST_FIELDS.entries()) {
            await conn.query('INSERT INTO fields (id, name, faculty_id) VALUES (?, ?, ?)', [i + 1, field.name, field.facultyId]);
            fieldMap[field.name] = i + 1;
        }

        const actTypeMap = {};
        for (const [i, name] of ST_ACT_TYPES.entries()) {
            await conn.query('INSERT INTO act_types (id, name) VALUES (?, ?)', [i + 1, name]);
            actTypeMap[name] = i + 1;
        }

        // Import targets from 6_Target.csv
        console.log('Importing targets from CSV...');
        const targetsData = readCSV('6_Target.csv');
        for (const row of targetsData) {
            if (!row.id || !row.name) continue;
            await conn.query('INSERT INTO targets (id, name) VALUES (?, ?)', [row.id, row.name]);
        }
        console.log('✔ Static reference data seeded.');

        // Step 3.5: Seed Fictional Departments for all 22 faculties
        console.log('Generating fictional departments...');
        const deptMap = {}; // Key: `facId_deptIndex`, Value: deptId
        for (let facId = 1; facId <= 22; facId++) {
            const profile = FACULTY_PROFILES[facId];
            const depts = FACULTY_DEPARTMENTS[profile.code] || [`Bộ môn Quản lý ${profile.code}`, `Bộ môn Đào tạo ${profile.code}`];
            for (let dIdx = 0; dIdx < depts.length; dIdx++) {
                const name = depts[dIdx];
                const [res] = await conn.query('INSERT INTO departments (faculty_id, name) VALUES (?, ?)', [facId, name]);
                const deptId = res.insertId;
                deptMap[`${facId}_${dIdx}`] = deptId;
            }
        }
        console.log('✔ Fictional departments seeded.');

        // Build a dept count map per faculty (supports 2 or 3 depts)
        const deptCountMap = {};
        for (let facId = 1; facId <= 22; facId++) {
            const profile = FACULTY_PROFILES[facId];
            const depts = FACULTY_DEPARTMENTS[profile.code] || [];
            deptCountMap[facId] = depts.length;
        }

        // Keep track of companies per faculty to balance
        const companiesPerFaculty = {};
        for (let i = 1; i <= 22; i++) companiesPerFaculty[i] = [];

        // Step 4: Programmatically Seed Fictional Enterprises per Faculty
        console.log('Generating fictional enterprises...');
        let insertedEnterprises = 0;

        for (let facId = 1; facId <= 22; facId++) {
            const profile = FACULTY_PROFILES[facId];
            const comps = FICTIONAL_COMPANIES[facId] || [];

            for (let cIdx = 0; cIdx < comps.length; cIdx++) {
                insertedEnterprises++;
                const comp = comps[cIdx];
                const scaleId = scaleMap[comp.scale] || 2; // Default to Tier 2

                // Mix statuses for companies
                const statuses = ['Đang triển khai', 'Đã ký hợp tác', 'Đàm phán', 'Tiềm năng'];
                const status = statuses[cIdx % statuses.length];

                // Associate with department of this faculty (round-robin across all depts)
                const numDepts = deptCountMap[facId] || 2;
                const deptId = deptMap[`${facId}_${cIdx % numDepts}`] || null;

                await conn.query(
                    'INSERT INTO enterprises (id, name, scale_id, is_hcmc, status, department_id, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [insertedEnterprises, comp.name, scaleId, true, status, deptId, facId]
                );

                companiesPerFaculty[facId].push({ id: insertedEnterprises, name: comp.name, status });

                // Insert representative
                const repName = getFakeRepName(cIdx + facId);
                const repRole = getFakeRepRole(cIdx);
                const repEmail = `tuyendung@${comp.domain}`;
                const repPhone = `0903${String(100000 + insertedEnterprises).slice(-6)}`;

                await conn.query(
                    'INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) VALUES (?, ?, ?, ?, ?, ?, 1)',
                    [insertedEnterprises, cIdx % 2 === 0 ? 'Ông' : 'Bà', repName, repRole, repPhone, repEmail]
                );

                // Insert address
                const addressBuilding = getFakeBuilding(cIdx + facId);
                const addressDistrict = getFakeDistrict(cIdx + facId);
                const addressProvince = 'TP. Hồ Chí Minh';

                await conn.query(
                    'INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) VALUES (?, ?, ?, ?, ?, 1)',
                    [insertedEnterprises, addressBuilding, addressDistrict, addressProvince, 'Việt Nam']
                );

                // Insert fields
                for (const fieldName of comp.fields) {
                    const fId = fieldMap[fieldName];
                    if (fId) {
                        await conn.query('INSERT IGNORE INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)', [insertedEnterprises, fId]);
                    }
                }
            }
        }
        console.log(`✔ Generated ${insertedEnterprises} fictional enterprises.`);

        // Create a fast map for enterprise -> faculty mapping
        const enterpriseToFacultyMap = {};
        const enterpriseToStatusMap = {};
        for (let facId = 1; facId <= 22; facId++) {
            for (const ent of companiesPerFaculty[facId]) {
                enterpriseToFacultyMap[ent.id] = facId;
                enterpriseToStatusMap[ent.id] = ent.status;
            }
        }

        // Step 6: Generate Fictional Activities per Faculty
        console.log('Generating fictional activities...');
        let insertedActivities = 0;

        for (let facId = 1; facId <= 22; facId++) {
            const profile = FACULTY_PROFILES[facId];
            const comps = companiesPerFaculty[facId];
            const templates = FACULTY_ACTIVITY_TEMPLATES[facId] || [];

            for (let aIdx = 0; aIdx < templates.length; aIdx++) {
                insertedActivities++;
                const template = templates[aIdx];
                const comp = comps[aIdx % comps.length]; // Link to one of the faculty's companies

                // Determine activity status based on company status
                let status = 'Đề xuất';
                if (comp.status === 'Đang triển khai' || comp.status === 'Đã ký hợp tác') {
                    status = aIdx === 0 ? 'Đã triển khai' : 'Phê duyệt nội bộ';
                }

                const startYear = 2024 + (aIdx % 2);
                const startMonth = String(1 + (aIdx % 12)).padStart(2, '0');
                const startDate = `${startYear}-${startMonth}-15`;

                const advisor = profile.advisors[aIdx % profile.advisors.length];

                await conn.query(
                    'INSERT INTO activities (id, enterprise_id, title, detail, start_date, status, person_in_charge, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [insertedActivities, comp.id, template.title, template.detail, startDate, status, advisor, facId]
                );

                // Map activity type
                const tId = actTypeMap[template.type] || actTypeMap['Khác'] || 7;
                await conn.query('INSERT IGNORE INTO activity_type_map (activity_id, type_id) VALUES (?, ?)', [insertedActivities, tId]);

                // Map activity target
                const targetId = aIdx === 0 ? 4 : 7; // Link to target 4 (Sinh viên năm 4) or 7 (Tất cả sinh viên)
                await conn.query('INSERT IGNORE INTO activity_target_map (activity_id, target_id) VALUES (?, ?)', [insertedActivities, targetId]);
            }
        }
        console.log(`✔ Generated ${insertedActivities} fictional activities.`);

        // Create a fast map of activity_id -> faculty_id
        const [activityRows] = await conn.query('SELECT id, faculty_id FROM activities');
        const activityToFacultyMap = {};
        for (const act of activityRows) {
            activityToFacultyMap[act.id] = act.faculty_id;
        }

        // Step 7: Import and Distribute Students from SQL files
        console.log('Importing and distributing students...');
        const studentFiles = [
            path.join(__dirname, 'migrations', 'seed_students.sql'),
            path.join(__dirname, 'migrations', 'seed_students_2.sql'),
            path.join(__dirname, 'migrations', 'seed_students_3.sql')
        ];

        let rawStudents = [];
        for (const file of studentFiles) {
            const parsed = parseStudentSql(file);
            rawStudents = rawStudents.concat(parsed);
        }
        console.log(`Parsed ${rawStudents.length} student rows from SQL files.`);

        let insertedStudents = 0;
        let roundRobinFacultyId = 1;

        for (const s of rawStudents) {
            const code = s[0];
            const name = s[1];
            const originalEmail = s[2];
            const originalClass = s[3];
            const originalMajor = s[4];
            const originalAdvisor = s[5];
            const activityId = s[6];
            const enterpriseId = s[7];
            const position = s[8];
            const status = s[9];
            const gpa = s[10];
            const startDate = s[11];
            const endDate = s[12];

            // Determine faculty
            let facultyId = 1; // Default
            if (enterpriseId && enterpriseToFacultyMap[enterpriseId]) {
                facultyId = enterpriseToFacultyMap[enterpriseId];
            } else if (activityId && activityToFacultyMap[activityId]) {
                facultyId = activityToFacultyMap[activityId];
            } else {
                // Round-robin to distribute student records evenly across all 22 faculties
                facultyId = roundRobinFacultyId;
                roundRobinFacultyId = (roundRobinFacultyId % 22) + 1;
            }

            // Rewrite majors, classes, emails, and advisors according to faculty profiles
            const profile = FACULTY_PROFILES[facultyId];
            const majorIndex = (insertedStudents % profile.majors.length);
            const major = profile.majors[majorIndex];

            // Extract K25/K26/K27/K28 from the original class, default to K27
            const classMatch = originalClass ? originalClass.match(/K\d{2}/) : null;
            const classCohort = classMatch ? classMatch[0] : 'K27';
            const studentNum = 1 + (insertedStudents % 5);
            const className = `${classCohort}-${profile.code}${studentNum}`;

            // Adapt student email: [first_name_lowercase].[last_name_initials][student_code_digits]@vlu.edu.vn
            const normalizedEmail = originalEmail ? originalEmail.replace('ct@vlu.edu.vn', `${profile.code.toLowerCase()}@vlu.edu.vn`) : `student.${insertedStudents}@vlu.edu.vn`;

            const advisorIndex = (insertedStudents % profile.advisors.length);
            const advisor = profile.advisors[advisorIndex];

            // Resolve valid enterprise and activity
            let finalEnterpriseId = enterpriseId;
            let finalActivityId = activityId;

            // If a student belongs to facultyId, make sure their activity/enterprise also matches!
            if (finalEnterpriseId && enterpriseToFacultyMap[finalEnterpriseId] !== facultyId) {
                // Find a matching enterprise for this faculty
                const matchingComps = companiesPerFaculty[facultyId];
                if (matchingComps && matchingComps.length > 0) {
                    finalEnterpriseId = matchingComps[insertedStudents % matchingComps.length].id;
                } else {
                    finalEnterpriseId = null;
                }
            }

            if (finalActivityId && activityToFacultyMap[finalActivityId] !== facultyId) {
                // Find a matching activity for this faculty
                const [matchingActs] = await conn.query('SELECT id FROM activities WHERE faculty_id = ?', [facultyId]);
                if (matchingActs && matchingActs.length > 0) {
                    finalActivityId = matchingActs[insertedStudents % matchingActs.length].id;
                } else {
                    finalActivityId = null;
                }
            }

            await conn.query(
                `INSERT INTO students (student_code, name, email, class, major, advisor, activity_id, enterprise_id, position, status, gpa, start_date, end_date, faculty_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [code, name, normalizedEmail, className, major, advisor, finalActivityId, finalEnterpriseId, position, status, gpa, startDate, endDate, facultyId]
            );

            insertedStudents++;
        }
        console.log(`✔ Total students seeded: ${insertedStudents}.`);

        // Step 8: Generate Mock MOUs (Cooperation Contracts)
        console.log('Generating Mock MOUs for signed/active enterprises...');
        let insertedMOUs = 0;

        for (let facId = 1; facId <= 22; facId++) {
            const profile = FACULTY_PROFILES[facId];
            const comps = companiesPerFaculty[facId];

            for (const comp of comps) {
                // Generate MOU if company status is 'Đã ký hợp tác' or 'Đang triển khai'
                if (comp.status === 'Đã ký hợp tác' || comp.status === 'Đang triển khai') {
                    insertedMOUs++;

                    const sequenceNum = String(insertedMOUs).padStart(3, '0');
                    const mouCode = `MOU-${profile.code}-2024-${sequenceNum}`;
                    const signingDate = '2024-03-15';

                    // Fetch representative
                    const [repRows] = await conn.query('SELECT full_name, role FROM enterprise_representatives WHERE enterprise_id = ?', [comp.id]);
                    const partnerContact = repRows.length > 0 ? `${repRows[0].full_name} - ${repRows[0].role}` : 'Đại diện đối tác';

                    const orgType = comp.id % 2 === 0 ? 'Tập đoàn Công nghệ' : 'Doanh nghiệp';
                    const country = 'Việt Nam';
                    const scope = `Hợp tác đào tạo, tiếp nhận sinh viên thực tập ngành ${profile.majors[0]}, tổ chức hội thảo chuyên ngành và tuyển dụng sinh viên tốt nghiệp.`;

                    // Fetch department if exists under this faculty
                    const [deptRows] = await conn.query('SELECT id FROM departments WHERE faculty_id = ? LIMIT 1', [facId]);
                    const deptId = deptRows.length > 0 ? deptRows[0].id : null;

                    const vluContact = profile.advisors[0];
                    const tasks = `Tuyển dụng thực tập sinh học kỳ II/2024; tổ chức workshop định hướng nghề nghiệp.`;
                    const nextSteps = `Ký kết biên bản triển khai chi tiết Q3/2025; mở rộng hợp tác đào tạo.`;
                    const pastActs = `Tiếp nhận sinh viên thực tập từ năm học 2022-2023.`;
                    const relatedData = `Đã tiếp nhận 15-20 sinh viên thực tập định kỳ hàng năm.`;

                    // Fetch one activity to link if exists
                    const [actRows] = await conn.query('SELECT id FROM activities WHERE enterprise_id = ? LIMIT 1', [comp.id]);
                    const linkedActId = actRows.length > 0 ? actRows[0].id : null;

                    await conn.query(`
                        INSERT INTO mous (
                            mou_code, enterprise_id, signing_date, partner_contact, org_type, country,
                            collaboration_scope, executing_unit_id, vlu_contact, tasks_ay24_25, next_steps, past_activities, related_data, activity_id, faculty_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [mouCode, comp.id, signingDate, partnerContact, orgType, country, scope, deptId, vluContact, tasks, nextSteps, pastActs, relatedData, linkedActId, facId]);
                }
            }
        }
        console.log(`✔ Generated ${insertedMOUs} Mock MOUs across all faculties.`);

        // Step 9: Seed Board Data (Kanban Tasks & Notes)
        console.log('Generating board data (Kanban Tasks & Notes) for all faculties...');

        // Load all users to assign/create tasks
        const [users] = await conn.query('SELECT id, email, role, faculty_id FROM users');
        let insertedTasks = 0;
        let insertedNotes = 0;

        for (const user of users) {
            // Only generate tasks/notes for FACULTY_MANAGER or LECTURER accounts
            if (user.role === 'ADMIN' || !user.faculty_id) continue;

            const facId = user.faculty_id;
            const profile = FACULTY_PROFILES[facId];

            // 1. Kanban Tasks (2 tasks per user)
            const tasksData = [
                {
                    title: `Ký phụ lục MOU với đối tác tuyển dụng`,
                    description: `Rà soát và ký biên bản làm việc mới về thỏa thuận tiếp nhận sinh viên thực tập khóa mới.`,
                    status: 'Cần làm',
                    priority: 'Cao'
                },
                {
                    title: `Đánh giá tiến độ thực tập tuần 4`,
                    description: `Liên hệ với các doanh nghiệp để thu thập phản hồi về sinh viên đang tham gia thực tập.`,
                    status: 'Đang thực hiện',
                    priority: 'Trung bình'
                }
            ];

            for (const t of tasksData) {
                await conn.query(`
                    INSERT INTO tasks (title, description, status, priority, created_by, assigned_to, faculty_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [t.title, t.description, t.status, t.priority, user.id, user.id, facId]);
                insertedTasks++;
            }

            // 2. Sticky Notes (2 notes per user)
            const notesData = [
                {
                    title: `Lưu ý kiểm định 2025`,
                    content: `Cần tổng hợp đầy đủ hồ sơ minh chứng các hoạt động hợp tác doanh nghiệp (MOU, khảo sát ý kiến) phục vụ công tác kiểm định chất lượng cấp khoa vào tháng 8/2025.`,
                    color: '#fef08a'
                },
                {
                    title: `Thông tin tuyển dụng`,
                    content: `Liên hệ doanh nghiệp IT/Du lịch để xin thêm chỉ tiêu thực tập cho các sinh viên gpa thấp chưa được phân công.`,
                    color: '#bfdbfe'
                }
            ];

            for (const n of notesData) {
                await conn.query(`
                    INSERT INTO notes (title, content, color, created_by)
                    VALUES (?, ?, ?, ?)
                `, [n.title, n.content, n.color, user.id]);
                insertedNotes++;
            }
        }
        console.log(`✔ Seeded ${insertedTasks} Kanban tasks and ${insertedNotes} notes.`);

        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('\n======================================================');
        console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
        console.log('======================================================');
        console.log(`✔ Seeded 22 VLU faculties and associated manager/lecturer accounts.`);
        console.log(`✔ Seeded ${insertedEnterprises} enterprises distributed across faculties.`);
        console.log(`✔ Seeded ${insertedActivities} activities linked to faculties.`);
        console.log(`✔ Seeded ${insertedMOUs} MOUs across departments.`);
        console.log(`✔ Seeded ${insertedStudents} student records with updated profiles.`);
        console.log(`✔ Seeded ${insertedTasks} tasks & ${insertedNotes} sticky notes.`);
        console.log('======================================================\n');

    } catch (err) {
        if (conn) {
            await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        }
        console.error('❌ Database seeding failed:', err.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

seed();
