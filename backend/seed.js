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

const PASS_HASH = '$2b$10$9FfmKHRV6ffkngWroSCTt.ha.L2GDuFCjxHtqxgMoJfUfHxx5tamy'; // bcrypt of '123456'

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
    "Phần mềm & Outsource",
    "Giải pháp CNTT & Chuyển đổi số",
    "Hạ tầng & Viễn thông",
    "Tài chính & Fintech",
    "Phần cứng & Điện tử",
    "Marketing & Truyền thông",
    "Khác"
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

// Helper to classify CSV enterprises to faculties
function getFacultyForCompany(name, id) {
    const n = name.toLowerCase();
    
    if (n.includes('vietravel') || n.includes('saigontourist') || n.includes('fiditour') || n.includes('du lịch') || n.includes('lữ hành') || n.includes('tour')) {
        return 15; // TOUR
    }
    if (n.includes('khách sạn') || n.includes('nhà hàng') || n.includes('hotel') || n.includes('restaurant') || n.includes('catering')) {
        return 16; // HOTEL
    }
    if (n.includes('luật') || n.includes('law') || n.includes('pháp lý')) {
        return 17; // LAW
    }
    if (n.includes('ngoại ngữ') || n.includes('dịch thuật') || n.includes('english') || n.includes('language') || n.includes('translation')) {
        return 18; // ENG
    }
    if (n.includes('bệnh viện') || n.includes('tâm anh') || n.includes('hospital') || n.includes('điều dưỡng') || n.includes('y tế') || n.includes('nursing')) {
        return 21; // NURS
    }
    if (n.includes('dược') || n.includes('pharma') || n.includes('pharmacity') || n.includes('apothecary')) {
        return 22; // PHARM
    }
    if (n.includes('kiến trúc') || n.includes('architect')) {
        return 4; // ARCH
    }
    if (n.includes('xây dựng') || n.includes('công trình') || n.includes('construction') || n.includes('coteccons') || n.includes('đường bộ') || n.includes('cầu đường')) {
        return 10; // CE
    }
    if (n.includes('mỹ thuật') || n.includes('fine art') || n.includes('tranh') || n.includes('triển lãm')) {
        return 5; // FA
    }
    if (n.includes('thiết kế đồ họa') || n.includes('graphic') || n.includes('cánh cam') || n.includes('canh cam') || n.includes('design')) {
        return 7; // GD
    }
    if (n.includes('nội thất') || n.includes('interior') || n.includes('decor')) {
        return 8; // INT
    }
    if (n.includes('thời trang') || n.includes('fashion') || n.includes('may mặc') || n.includes('nhà bè') || n.includes('textile')) {
        return 9; // FASH
    }
    if (n.includes('thiết kế công nghiệp') || n.includes('industrial design')) {
        return 6; // ID
    }
    if (n.includes('cơ khí') || n.includes('mechatronics') || n.includes('điện tử') || n.includes('robotics') || n.includes('sharp') || n.includes('phần cứng') || n.includes('c&t') || n.includes('hutech')) {
        return 11; // ME
    }
    if (n.includes('acb') || n.includes('chứng khoán') || n.includes('ngân hàng') || n.includes('tài chính') || n.includes('kế toán') || n.includes('finance') || n.includes('audit') || n.includes('tax')) {
        return 14; // FIN
    }
    if (n.includes('kinh tế') || n.includes('economy') || n.includes('đầu tư') || n.includes('investment')) {
        return 12; // ECO
    }
    if (n.includes('marketing') || n.includes('tiếp thị') || n.includes('quảng cáo') || n.includes('tmai sài gòn') || n.includes('ad')) {
        return 13; // MARK
    }
    if (n.includes('truyền thông') || n.includes('báo chí') || n.includes('news') || n.includes('tạp chí') || n.includes('sctv') || n.includes('media') || n.includes('sen vàng') || n.includes('cát tiên sa') || n.includes('cattiensa') || n.includes('senvang')) {
        return 19; // COMM
    }
    if (n.includes('quan hệ công chúng') || n.includes('pr') || n.includes('sự kiện') || n.includes('event')) {
        return 3; // PR
    }
    if (n.includes('tâm lý') || n.includes('psychology') || n.includes('tham vấn') || n.includes('counseling')) {
        return 20; // PSY
    }
    if (n.includes('quản trị') || n.includes('business') || n.includes('unilever') || n.includes('masan') || n.includes('dương gia phát') || n.includes('group') || n.includes('corporation')) {
        return 2; // BA
    }
    
    // Distribute remaining software/tech companies in a round-robin balanced way
    const fallbackFaculties = [1, 2, 11, 7, 13, 14];
    return fallbackFaculties[id % fallbackFaculties.length];
}

// Enterprise scale mapping heuristics
function getCompanyHeuristicInfo(name) {
    const n = name.toLowerCase();
    let scale = "Tier 2 (SME)";
    if (/(aws|hitachi|tma|fpt|acb|mobifone|cmc|dxc|vnpt|nashtech|kms|nab|dek|opswat|sharp|sctv|vinasa|vnito|agest|mitek|elca|coteccons|vus|unilever|masan|vietravel|saigontourist|pharmacity)/.test(n)) {
        scale = "Tier 1 (Tập đoàn/Global)";
    } else if (/(aircity|beelieve|meta art|namiq|aliniex|1base|payror|palace|decor|phượt)/.test(n)) {
        scale = "Tier 3 (Startup/Micro)";
    }

    let fields = [];
    if (/(software|soft|tech|technology|tma|kms|nashtech|dxc|dek|wata|tps|kyanon|vtimes|engma|fisoft|pizitech|t4tek|mitek|mksol|hitachi|vietai)/.test(n)) {
        fields.push("Phần mềm & Outsource");
    }
    if (/(aws|cloud|solution|giải pháp|cmc|vnpt|smart|số|hệ thống|vnresource|opswat|c\. p|tiên khanh|3ps|alila|alta|cần kiệm)/.test(n)) {
        fields.push("Giải pháp CNTT & Chuyển đổi số");
    }
    if (/(fpt|mobifone|sctv|viễn thông|hạ tầng|mạng)/.test(n)) {
        fields.push("Hạ tầng & Viễn thông");
    }
    if (/(acb|payror|chứng khoán|ngân hàng|aliniex|finance|tài chính|kế toán)/.test(n)) {
        fields.push("Tài chính & Fintech");
    }
    if (/(sharp|điện tử|phần cứng|máy tính|robotics|c&t|phần cứng)/.test(n)) {
        fields.push("Phần cứng & Điện tử");
    }
    if (/(marketing|media|truyền thông|cánh cam|sen vàng|tmai|quảng cáo|tiếp thị|pr|sự kiện|event)/.test(n)) {
        fields.push("Marketing & Truyền thông");
    }
    if (fields.length === 0) fields.push("Khác");

    return { scale, fields };
}

// Helper to determine activity types
function getActivityTypes(title, detail) {
    const str = (title + " " + detail).toLowerCase();
    const types = [];
    if (str.includes("mou") || str.includes("ký kết")) types.push("Ký kết MOU");
    if (str.includes("kiểm định") || str.includes("phỏng vấn") || str.includes("khảo sát") || str.includes("đánh giá")) types.push("Kiểm định & Đánh giá");
    if (str.includes("tuyển dụng") || str.includes("thực tập") || str.includes("việc làm") || str.includes("nhân sự") || str.includes("capstone") || str.includes("kltn") || str.includes("nhận sinh viên") || str.includes("hướng dẫn sinh viên")) types.push("Tuyển dụng & Thực tập");
    if (str.includes("hội thảo") || str.includes("đào tạo") || str.includes("tọa đàm") || str.includes("môn học") || str.includes("định hướng") || str.includes("chuyên ngành") || str.includes("bảo vệ") || str.includes("tư vấn") || str.includes("giảng dạy")) types.push("Hội thảo & Đào tạo");
    if (str.includes("học bổng") || str.includes("tặng quà") || str.includes("bánh kem") || str.includes("tặng hoa") || str.includes("tài trợ") || str.includes("tiệc") || str.includes("tri ân")) types.push("Tài trợ & Học bổng");
    if (str.includes("tham quan") || str.includes("tour")) types.push("Tham quan doanh nghiệp");

    if (types.length === 0) types.push("Khác");
    return types;
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

// Dictionary of high-quality custom mock companies for empty faculties
const CUSTOM_MOCK_COMPANIES = {
    3: [ // PR
        { name: 'Công ty Truyền thông & Sự kiện Elite PR', status: 'Đã ký hợp tác', rep: 'Bà Nguyễn Thị Minh Thư', repRole: 'PR Director', repEmail: 'thu.nguyen@elitepr.com', address: '12 Nguyễn Huệ, Quận 1, TP.HCM' }
    ],
    4: [ // ARCH
        { name: 'Công ty Cổ phần Thiết kế & Kiến trúc Vạn Xuân (VLU Design)', status: 'Đang triển khai', rep: 'KTS. Nguyễn Văn Dũng', repRole: 'Giám đốc Sáng tạo', repEmail: 'dung.nguyen@vanxuanarch.vn', address: 'Tòa nhà Vạn Xuân, KĐT Him Lam, Quận 7, TP.HCM' }
    ],
    5: [ // FA
        { name: 'Phòng tranh & Đấu giá Mỹ thuật Sài Gòn Art Gallery', status: 'Đã ký hợp tác', rep: 'Ông Lê Huy', repRole: 'Đại diện Mỹ thuật', repEmail: 'huy.le@saigonart.vn', address: '97A Phó Đức Chính, Quận 1, TP.HCM' }
    ],
    6: [ // ID
        { name: 'Công ty Kiểu dáng Công nghiệp & Thiết kế Việt Nam (VietID)', status: 'Tiềm năng', rep: 'Ông Ngô Minh Quân', repRole: 'CEO', repEmail: 'quan.ngo@vietid.design', address: 'Khu Công nghệ cao Quận 9, TP.HCM' }
    ],
    8: [ // INT
        { name: 'Tổng công ty Nội thất & Trang trí Cát Tường', status: 'Đang triển khai', rep: 'Ông Vũ Hoài Nam', repRole: 'Giám đốc kỹ thuật', repEmail: 'nam.vu@cattuonginterior.com', address: '350 Tô Hiến Thành, Quận 10, TP.HCM' }
    ],
    9: [ // FASH
        { name: 'Tổng công ty Cổ phần May Nhà Bè (NBC Group)', status: 'Đã ký hợp tác', rep: 'Bà Phạm Thị Dung', repRole: 'Trưởng phòng Nhân sự', repEmail: 'recruitment@nhabe.com.vn', address: '4 Bến Nghé, Quận 7, TP.HCM' }
    ],
    10: [ // CE
        { name: 'Tổng công ty Xây dựng Coteccons', status: 'Đang triển khai', rep: 'Ông Nguyễn Huy Bình', repRole: 'Trưởng ban nhân sự dự án', repEmail: 'binh.nh@coteccons.vn', address: '236/6 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM' }
    ],
    12: [ // ECO
        { name: 'Viện Nghiên cứu & Phát triển Kinh tế TP.HCM', status: 'Liên hệ', rep: 'TS. Lê Thị Thảo', repRole: 'Trưởng ban Đào tạo', repEmail: 'thaolt@hids.hochiminhcity.gov.vn', address: '28 Lê Quý Đôn, Quận 3, TP.HCM' }
    ],
    15: [ // TOUR
        { name: 'Công ty Cổ phần Du lịch và Tiếp thị Giao thông Vận tải Việt Nam (Vietravel)', status: 'Đã ký hợp tác', rep: 'Ông Nguyễn Quốc Kỳ', repRole: 'Chủ tịch HĐQT', repEmail: 'info@vietravel.com', address: '190 Pasteur, Quận 3, TP.HCM' },
        { name: 'Công ty TNHH MTV Dịch vụ Lữ hành Saigontourist', status: 'Đang triển khai', rep: 'Ông Nguyễn Hữu Y', repRole: 'Giám đốc Lữ hành', repEmail: 'info@saigontourist.net', address: '45 Lê Thánh Tôn, Quận 1, TP.HCM' },
        { name: 'Công ty Cổ phần Du lịch Fiditour', status: 'Đang triển khai', rep: 'Ông Trần Thế Dũng', repRole: 'Tổng Giám đốc', repEmail: 'info@fiditour.com', address: '129 Nguyễn Huệ, Quận 1, TP.HCM' }
    ],
    16: [ // HOTEL
        { name: 'Khách sạn Rex Sài Gòn (Rex Hotel)', status: 'Đã ký hợp tác', rep: 'Bà Hoàng Thị F', repRole: 'HR Manager', repEmail: 'hr@rexhotel.com', address: '141 Nguyễn Huệ, Quận 1, TP.HCM' },
        { name: 'Khách sạn Caravelle Saigon', status: 'Đang triển khai', rep: 'Ông Pierre C.', repRole: 'General Manager', repEmail: 'hr@caravellehotel.com', address: '19 Công trường Lam Sơn, Quận 1, TP.HCM' }
    ],
    17: [ // LAW
        { name: 'Văn phòng Luật sư Vạn Lý & Cộng sự', status: 'Đã ký hợp tác', rep: 'Luật sư Lê Văn Khải', repRole: 'Trưởng văn phòng', repEmail: 'khai.lv@vanlylaw.vn', address: '100 Nguyễn Thị Minh Khai, Quận 3, TP.HCM' },
        { name: 'Công ty Luật TNHH Luật Việt', status: 'Đàm phán', rep: 'Luật sư Trần Hữu Danh', repRole: 'Partner', repEmail: 'danh.th@luatviet.com', address: 'Tòa nhà Centec, 72 Nguyễn Thị Minh Khai, Quận 3, TP.HCM' }
    ],
    18: [ // ENG
        { name: 'Hệ thống Anh ngữ Hội Việt Mỹ (VUS)', status: 'Đã ký hợp tác', rep: 'Bà Trần Minh Nghĩa', repRole: 'Trưởng bộ phận Học vụ', repEmail: 'academic@vus.edu.vn', address: '189 Nguyễn Thị Minh Khai, Quận 1, TP.HCM' }
    ],
    20: [ // PSY
        { name: 'Trung tâm Tham vấn & Trị liệu Tâm lý Hồn Việt', status: 'Đang triển khai', rep: 'TS. Vương Kiến Quốc', repRole: 'Giám đốc chuyên môn', repEmail: 'counseling@honviet.com.vn', address: '40 Nguyễn Bỉnh Khiêm, Quận 1, TP.HCM' }
    ],
    21: [ // NURS
        { name: 'Bệnh viện Đa khoa Tâm Anh', status: 'Đang triển khai', rep: 'ThS. Nguyễn Y', repRole: 'Trưởng ban Đào tạo & Nghiên cứu', repEmail: 'tuyendung@tamanhhospital.vn', address: '2B Phổ Quang, Quận Tân Bình, TP.HCM' },
        { name: 'Bệnh viện Quận Bình Thạnh', status: 'Đã ký hợp tác', rep: 'Bà Trần Thị Bích', repRole: 'Phó Giám Đốc', repEmail: 'bv.binhthanh@tphcm.gov.vn', address: '112 Đinh Tiên Hoàng, Quận Bình Thạnh, TP.HCM' }
    ],
    22: [ // PHARM
        { name: 'Hệ thống Nhà thuốc Pharmacity', status: 'Đang triển khai', rep: 'Dược sĩ Đặng Thanh Thắng', repRole: 'Giám đốc Dược phẩm', repEmail: 'thang.dang@pharmacity.vn', address: '248A Nơ Trang Long, Quận Bình Thạnh, TP.HCM' },
        { name: 'Công ty Cổ phần Dược phẩm OPC', status: 'Đã ký hợp tác', rep: 'Bà Phạm Thị Hoa', repRole: 'Trưởng phòng R&D', repEmail: 'info@opcpharma.com', address: '1017 Hồng Bàng, Quận 6, TP.HCM' }
    ]
};

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
            'targets', 'act_types', 'scales', 'fields'
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
        for (const [i, name] of ST_FIELDS.entries()) {
            await conn.query('INSERT INTO fields (id, name) VALUES (?, ?)', [i + 1, name]);
            fieldMap[name] = i + 1;
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

        // Keep track of companies per faculty to balance
        const companiesPerFaculty = {};
        for (let i = 1; i <= 22; i++) companiesPerFaculty[i] = [];

        // Step 4: Import Enterprises from CSV
        console.log('Importing Enterprises from CSV...');
        const companiesCSV = readCSV('1_Company.csv');
        let insertedEnterprises = 0;

        for (const row of companiesCSV) {
            if (!row.id || !row.name) continue;

            const isHcmc = row.is_hcmc ? (row.is_hcmc.toLowerCase() === 'true' || row.is_hcmc === '1') : false;
            const info = getCompanyHeuristicInfo(row.name);
            const scaleId = scaleMap[info.scale] || null;

            // Classify which faculty this company belongs to
            const facId = getFacultyForCompany(row.name, row.id);

            // Randomize status for CSV companies to make the boards look alive
            const statuses = ['Tiềm năng', 'Liên hệ', 'Đàm phán', 'Đề xuất', 'Đã ký hợp tác', 'Đang triển khai'];
            const status = statuses[row.id % statuses.length];

            await conn.query(
                'INSERT INTO enterprises (id, name, scale_id, is_hcmc, status, faculty_id) VALUES (?, ?, ?, ?, ?, ?)',
                [row.id, row.name, scaleId, isHcmc, status, facId]
            );

            insertedEnterprises++;
            companiesPerFaculty[facId].push({ id: row.id, name: row.name, status });

            // Insert representative
            if (row.rep_name || row.rep_phone || row.rep_email) {
                await conn.query(
                    'INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) VALUES (?, ?, ?, ?, ?, ?, 1)',
                    [row.id, row.rep_title || null, row.rep_name || null, row.rep_role || null, row.rep_phone || null, row.rep_email || null]
                );
            }

            // Insert address
            if (row.address_building || row.address_district || row.address_province) {
                await conn.query(
                    'INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) VALUES (?, ?, ?, ?, ?, 1)',
                    [row.id, row.address_building || null, row.address_district || null, row.address_province || null, row.address_country || 'Việt Nam']
                );
            }

            // Insert fields
            for (const fieldName of info.fields) {
                const fId = fieldMap[fieldName];
                if (fId) {
                    await conn.query('INSERT IGNORE INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)', [row.id, fId]);
                }
            }
        }
        console.log(`✔ Imported ${insertedEnterprises} enterprises from CSV.`);

        // Step 5: Supplement custom mock companies for empty faculties
        console.log('Supplementing custom mock companies for empty faculties...');
        let supplementId = 1000; // Offset to avoid ID conflicts
        for (let facId = 1; facId <= 22; facId++) {
            if (companiesPerFaculty[facId].length === 0 || (CUSTOM_MOCK_COMPANIES[facId] && companiesPerFaculty[facId].length < 2)) {
                const mocks = CUSTOM_MOCK_COMPANIES[facId] || [
                    { name: `Công ty TNHH Dịch vụ ${FACULTY_PROFILES[facId].code} VLU`, status: 'Đang triển khai', rep: 'Ông Nguyễn Văn A', repRole: 'Giám đốc', repEmail: 'contact@vlu.vn', address: '45 Nguyễn Khắc Nhu, Quận 1, TP.HCM' }
                ];
                
                for (const mock of mocks) {
                    supplementId++;
                    const info = getCompanyHeuristicInfo(mock.name);
                    const scaleId = scaleMap[info.scale] || 2;
                    
                    await conn.query(
                        'INSERT INTO enterprises (id, name, scale_id, is_hcmc, status, faculty_id) VALUES (?, ?, ?, ?, ?, ?)',
                        [supplementId, mock.name, scaleId, true, mock.status, facId]
                    );
                    insertedEnterprises++;
                    companiesPerFaculty[facId].push({ id: supplementId, name: mock.name, status: mock.status });

                    // Insert representative
                    await conn.query(
                        'INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, email, is_primary) VALUES (?, ?, ?, ?, ?, 1)',
                        [supplementId, 'Ông/Bà', mock.rep || 'Người đại diện', mock.repRole || 'Chức vụ', mock.repEmail || 'info@company.com']
                    );

                    // Insert address
                    await conn.query(
                        'INSERT INTO enterprise_addresses (enterprise_id, building_street, country, is_main) VALUES (?, ?, ?, 1)',
                        [supplementId, mock.address || 'Quận Bình Thạnh, TP.HCM', 'Việt Nam']
                    );

                    // Insert fields
                    const fId = fieldMap[info.fields[0]] || 7;
                    await conn.query('INSERT IGNORE INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)', [supplementId, fId]);
                }
            }
        }
        console.log(`✔ Total enterprises in database: ${insertedEnterprises}.`);

        // Create a fast map for enterprise -> faculty mapping
        const enterpriseToFacultyMap = {};
        const enterpriseToStatusMap = {};
        for (let facId = 1; facId <= 22; facId++) {
            for (const ent of companiesPerFaculty[facId]) {
                enterpriseToFacultyMap[ent.id] = facId;
                enterpriseToStatusMap[ent.id] = ent.status;
            }
        }

        // Step 6: Import Activities from CSV
        console.log('Importing Activities from CSV...');
        const activitiesCSV = readCSV('4_Activities.csv');
        let insertedActivities = 0;

        for (const row of activitiesCSV) {
            if (!row.id || !row.name || !row.id_company) continue;

            const facId = enterpriseToFacultyMap[row.id_company] || 1; // Default to IT
            const status = enterpriseToStatusMap[row.id_company] === 'Đang triển khai' ? 'Đã triển khai' : 'Đề xuất';

            // Randomize start date in the past
            const startYear = 2024 + (row.id % 2);
            const startMonth = String(1 + (row.id % 12)).padStart(2, '0');
            const startDate = `${startYear}-${startMonth}-10`;

            const advisorList = FACULTY_PROFILES[facId].advisors;
            const personInCharge = advisorList[row.id % advisorList.length];

            await conn.query(
                'INSERT INTO activities (id, enterprise_id, title, detail, start_date, status, person_in_charge, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [row.id, row.id_company, row.name, row.detail || '', startDate, status, personInCharge, facId]
            );
            insertedActivities++;

            // Import activity types
            const actTypes = getActivityTypes(row.name, row.detail || '');
            for (const typeName of actTypes) {
                const tId = actTypeMap[typeName];
                if (tId) {
                    await conn.query('INSERT IGNORE INTO activity_type_map (activity_id, type_id) VALUES (?, ?)', [row.id, tId]);
                }
            }

            // Insert activity targets map (keep original targets)
            if (row.id_target) {
                const targets = String(row.id_target).split(',').map(t => t.trim()).filter(Boolean);
                for (const tId of targets) {
                    await conn.query('INSERT IGNORE INTO activity_target_map (activity_id, target_id) VALUES (?, ?)', [row.id, tId]);
                }
            }
        }
        console.log(`✔ Imported ${insertedActivities} activities from CSV.`);

        // Supplement mock activities for custom mock companies
        console.log('Supplementing custom mock activities...');
        let activityIdCounter = 1000;
        for (let facId = 1; facId <= 22; facId++) {
            const facultyCode = FACULTY_PROFILES[facId].code;
            const companies = companiesPerFaculty[facId];
            for (const comp of companies) {
                if (comp.id > 1000) { // Custom mock company
                    activityIdCounter++;
                    
                    const title = `Chương trình Thực tập & Tuyển dụng ${facultyCode} 2025`;
                    const detail = `Tiếp nhận sinh viên thực tập các ngành thuộc ${FACULTY_PROFILES[facId].majors[0]} tại ${comp.name}.`;
                    const status = comp.status === 'Đang triển khai' ? 'Đã triển khai' : 'Đề xuất';
                    const startDate = '2025-02-15';
                    const person = FACULTY_PROFILES[facId].advisors[0];

                    await conn.query(
                        'INSERT INTO activities (id, enterprise_id, title, detail, start_date, status, person_in_charge, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [activityIdCounter, comp.id, title, detail, startDate, status, person, facId]
                    );

                    // Link type 'Tuyển dụng & Thực tập' (id 5 in act_types)
                    await conn.query('INSERT IGNORE INTO activity_type_map (activity_id, type_id) VALUES (?, 5)', [activityIdCounter]);
                    // Link target 'Sinh Viên' (id 1 in targets)
                    await conn.query('INSERT IGNORE INTO activity_target_map (activity_id, target_id) VALUES (?, 1)', [activityIdCounter]);
                    
                    insertedActivities++;
                }
            }
        }
        console.log(`✔ Total activities in database: ${insertedActivities}.`);

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
                    
                    const orgType = comp.id < 10 ? 'Tập đoàn Công nghệ' : 'Doanh nghiệp';
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
