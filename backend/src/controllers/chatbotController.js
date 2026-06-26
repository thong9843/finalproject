const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../config/db');

require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ====================================================
// VLU Assistant - Powered by Gemini Function Calling
// Gemini tự quyết định gọi tool nào dựa vào câu hỏi
// ====================================================

// ---- TOOL DEFINITIONS (Function Declarations) ----
const tools = [
    {
        functionDeclarations: [
            {
                name: 'get_enterprise_list',
                description: 'Lấy danh sách doanh nghiệp đang liên kết với VLU. Có thể tìm theo tên, lọc theo trạng thái, quy mô, hoặc vị trí địa lý.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        keyword: {
                            type: 'STRING',
                            description: 'Từ khóa tìm kiếm theo tên doanh nghiệp (tùy chọn)',
                        },
                        status: {
                            type: 'STRING',
                            description: 'Lọc theo trạng thái: Tiềm năng | Liên hệ | Đàm phán | Đề xuất | Đã ký hợp tác | Đang triển khai | Đã hoàn thành | Đã tạm ngưng',
                        },
                        location: {
                            type: 'STRING',
                            description: 'Lọc theo vị trí địa lý (ví dụ: TP.HCM, Hà Nội, Nước ngoài, ...)',
                        },
                        scale: {
                            type: 'STRING',
                            description: 'Lọc theo quy mô nhân sự: Lớn | Vừa | Nhỏ',
                        },
                    },
                    required: [],
                },
            },
            {
                name: 'get_student_list',
                description: 'Lấy danh sách sinh viên thực tập. Có thể lọc theo tên/MSSV, trạng thái, công ty đang thực tập, ngành học, lớp, hoặc GPA.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        keyword: {
                            type: 'STRING',
                            description: 'Tìm theo tên hoặc MSSV (tùy chọn)',
                        },
                        status: {
                            type: 'STRING',
                            description: 'Lọc theo trạng thái: Chờ phân công | Đang thực tập | Hoàn thành | Đã nghỉ',
                        },
                        enterprise_name: {
                            type: 'STRING',
                            description: 'Tên doanh nghiệp cần lọc sinh viên đang thực tập',
                        },
                        major: {
                            type: 'STRING',
                            description: 'Lọc theo ngành học (ví dụ: Công nghệ thông tin, Quản trị kinh doanh, ...)',
                        },
                        class: {
                            type: 'STRING',
                            description: 'Lọc theo tên lớp học',
                        },
                        gpa_min: {
                            type: 'NUMBER',
                            description: 'Điểm GPA tối thiểu',
                        },
                        gpa_max: {
                            type: 'NUMBER',
                            description: 'Điểm GPA tối đa',
                        },
                    },
                    required: [],
                },
            },
            {
                name: 'get_activity_list',
                description: 'Lấy danh sách hoạt động hợp tác giữa VLU và doanh nghiệp. Có thể lọc theo tên, trạng thái, công ty liên kết, hoặc khoảng thời gian.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        keyword: {
                            type: 'STRING',
                            description: 'Tìm theo tên hoạt động (tùy chọn)',
                        },
                        status: {
                            type: 'STRING',
                            description: 'Lọc theo trạng thái: Đề xuất | Phê duyệt nội bộ | Đã triển khai | Đã kết thúc',
                        },
                        enterprise_name: {
                            type: 'STRING',
                            description: 'Tên doanh nghiệp liên kết với hoạt động',
                        },
                        start_date: {
                            type: 'STRING',
                            description: 'Lọc hoạt động bắt đầu từ ngày này (định dạng YYYY-MM-DD)',
                        },
                        end_date: {
                            type: 'STRING',
                            description: 'Lọc hoạt động kết thúc trước ngày này (định dạng YYYY-MM-DD)',
                        },
                        limit: {
                            type: 'NUMBER',
                            description: 'Số lượng hoạt động tối đa trả về (mặc định 10)',
                        },
                    },
                    required: [],
                },
            },
            {
                name: 'get_dashboard_stats',
                description: 'Lấy thống kê tổng quan toàn bộ hệ thống: số doanh nghiệp, sinh viên, hoạt động, GPA trung bình, và phân loại theo loại hình hoạt động.',
                parameters: {
                    type: 'OBJECT',
                    properties: {},
                    required: [],
                },
            },
            {
                name: 'get_mou_list',
                description: 'Lấy danh sách biên bản ghi nhớ (MOU) đã ký kết giữa VLU và doanh nghiệp. Có thể lọc theo tên doanh nghiệp, quốc gia, hoặc khoảng thời gian ký kết.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        keyword: {
                            type: 'STRING',
                            description: 'Tìm theo tên doanh nghiệp hoặc mã MOU (tùy chọn)',
                        },
                        country: {
                            type: 'STRING',
                            description: 'Lọc theo quốc gia ký kết (ví dụ: Việt Nam, Hàn Quốc, Nhật Bản, Hoa Kỳ, ...)',
                        },
                        start_date: {
                            type: 'STRING',
                            description: 'Ngày ký kết từ (định dạng YYYY-MM-DD)',
                        },
                        end_date: {
                            type: 'STRING',
                            description: 'Ngày ký kết đến (định dạng YYYY-MM-DD)',
                        },
                    },
                    required: [],
                },
            },
            {
                name: 'get_upcoming_activities',
                description: 'Lấy các hoạt động sắp diễn ra trong thời gian gần (3 ngày tới).',
                parameters: {
                    type: 'OBJECT',
                    properties: {},
                    required: [],
                },
            },
            {
                name: 'get_enterprise_ratings',
                description: 'Lấy đánh giá chất lượng của các doanh nghiệp, bao gồm điểm trung bình và số lượt đánh giá.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        enterprise_name: {
                            type: 'STRING',
                            description: 'Tên doanh nghiệp cần xem đánh giá (tùy chọn, nếu không có thì lấy top doanh nghiệp tốt nhất)',
                        },
                    },
                    required: [],
                },
            },
            {
                name: 'get_student_stats_by_enterprise',
                description: 'Thống kê số lượng sinh viên thực tập phân theo từng doanh nghiệp và ngành học. Có thể lọc theo tên doanh nghiệp hoặc ngành học cụ thể.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        enterprise_name: {
                            type: 'STRING',
                            description: 'Tên doanh nghiệp cụ thể cần xem thống kê (tùy chọn)',
                        },
                        major: {
                            type: 'STRING',
                            description: 'Tên ngành học cần xem thống kê (tùy chọn)',
                        },
                    },
                    required: [],
                },
            },
            {
                name: 'get_enterprise_details',
                description: 'Lấy thông tin chi tiết của một doanh nghiệp cụ thể bao gồm địa chỉ, người đại diện và lĩnh vực hoạt động.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        keyword: {
                            type: 'STRING',
                            description: 'Tên hoặc mã số thuế doanh nghiệp',
                        },
                    },
                    required: ['keyword'],
                },
            },
            {
                name: 'get_student_details',
                description: 'Lấy thông tin chi tiết của một sinh viên bao gồm ngành, lớp, GPA, công ty và hoạt động đang tham gia.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        keyword: {
                            type: 'STRING',
                            description: 'Tên hoặc Mã số sinh viên (MSSV)',
                        },
                    },
                    required: ['keyword'],
                },
            },
            {
                name: 'search_enterprises_by_field',
                description: 'Tìm kiếm danh sách doanh nghiệp theo lĩnh vực/ngành nghề hoạt động (ví dụ: CNTT, Marketing, Ngân hàng, v.v.).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        field_name: {
                            type: 'STRING',
                            description: 'Tên lĩnh vực hoặc ngành nghề',
                        },
                    },
                    required: ['field_name'],
                },
            },
            {
                name: 'get_activity_details',
                description: 'Lấy thông tin chi tiết của một hoạt động hợp tác cụ thể.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        keyword: {
                            type: 'STRING',
                            description: 'Tên hoạt động',
                        },
                    },
                    required: ['keyword'],
                },
            },
            {
                name: 'get_mou_stats',
                description: 'Thống kê số lượng biên bản ghi nhớ (MOU) đã ký kết phân nhóm theo năm, quốc gia ký kết và đơn vị thực hiện của VLU.',
                parameters: {
                    type: 'OBJECT',
                    properties: {},
                    required: [],
                },
            },
            {
                name: 'get_high_performing_students',
                description: 'Lấy danh sách sinh viên thực tập xuất sắc có GPA trung bình đạt yêu cầu (ví dụ GPA từ 3.2 trở lên). Có thể lọc theo ngành học.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        min_gpa: {
                            type: 'NUMBER',
                            description: 'Điểm GPA tối thiểu cần lọc (mặc định 3.2)',
                        },
                        major: {
                            type: 'STRING',
                            description: 'Ngành học cần lọc (tùy chọn)',
                        },
                    },
                    required: [],
                },
            },
            {
                name: 'get_enterprise_scale_stats',
                description: 'Thống kê số lượng doanh nghiệp liên kết phân loại theo quy mô nhân sự (Lớn | Vừa | Nhỏ).',
                parameters: {
                    type: 'OBJECT',
                    properties: {},
                    required: [],
                },
            },
            {
                name: 'get_enterprise_ranking',
                description: 'Lấy bảng xếp hạng các doanh nghiệp liên kết theo các tiêu chí khác nhau (ví dụ: công ty có nhiều sinh viên nhất, công ty có nhiều hoạt động nhất).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        ranking_type: {
                            type: 'STRING',
                            description: 'Loại xếp hạng: students_interning (số lượng sinh viên thực tập) | activity_participation (số sinh viên tham gia hoạt động) | activity_count (số hoạt động tổ chức) | rating (điểm đánh giá)',
                        },
                        limit: {
                            type: 'NUMBER',
                            description: 'Số lượng kết quả cần lấy (mặc định 10)',
                        },
                    },
                    required: ['ranking_type'],
                },
            },
            {
                name: 'get_enterprise_stats',
                description: 'Lấy thống kê và thông tin chi tiết tổng hợp của một doanh nghiệp (bao gồm số sinh viên thực tập, hoạt động gần đây, MOU, đánh giá).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        enterprise_name: {
                            type: 'STRING',
                            description: 'Tên doanh nghiệp cần xem thống kê (bắt buộc)',
                        },
                    },
                    required: ['enterprise_name'],
                },
            },
            {
                name: 'get_student_ranking',
                description: 'Lấy bảng xếp hạng sinh viên (ví dụ: top sinh viên tham gia nhiều hoạt động nhất).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        ranking_type: {
                            type: 'STRING',
                            description: 'Loại xếp hạng: activity_participation (số lượng hoạt động đã tham gia)',
                        },
                        limit: {
                            type: 'NUMBER',
                            description: 'Số lượng kết quả cần lấy (mặc định 10)',
                        },
                    },
                    required: ['ranking_type'],
                },
            },
            {
                name: 'create_enterprise',
                description: 'Yêu cầu thêm doanh nghiệp mới vào hệ thống. AI trích xuất tên, mã số thuế, trạng thái.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        name: { type: 'STRING', description: 'Tên doanh nghiệp' },
                        tax_code: { type: 'STRING', description: 'Mã số thuế doanh nghiệp (tùy chọn)' },
                        status: { type: 'STRING', description: 'Trạng thái: Tiềm năng | Liên hệ | Đàm phán | Đề xuất | Đã ký hợp tác | Đang triển khai | Đã hoàn thành | Đã tạm ngưng (tùy chọn)' }
                    },
                    required: ['name']
                }
            },
            {
                name: 'create_student',
                description: 'Yêu cầu thêm sinh viên thực tập mới vào hệ thống. AI trích xuất mã số sinh viên, họ tên, ngành học, lớp, GPA, trạng thái, giảng viên hướng dẫn, công ty thực tập, vị trí thực tập, ngày bắt đầu và kết thúc.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        student_code: { type: 'STRING', description: 'Mã số sinh viên (MSSV)' },
                        name: { type: 'STRING', description: 'Họ và tên sinh viên' },
                        major: { type: 'STRING', description: 'Ngành học (tùy chọn)' },
                        class: { type: 'STRING', description: 'Lớp học (tùy chọn)' },
                        gpa: { type: 'NUMBER', description: 'Điểm trung bình tích lũy GPA (tùy chọn)' },
                        status: { type: 'STRING', description: 'Trạng thái: Chờ phân công | Đang thực tập | Hoàn thành | Đã nghỉ (tùy chọn)' },
                        advisor: { type: 'STRING', description: 'Giảng viên hướng dẫn (tùy chọn)' },
                        enterprise_name: { type: 'STRING', description: 'Tên doanh nghiệp thực tập (tùy chọn, ví dụ: FPT Software)' },
                        position: { type: 'STRING', description: 'Vị trí thực tập (tùy chọn)' },
                        start_date: { type: 'STRING', description: 'Ngày bắt đầu thực tập dạng YYYY-MM-DD (tùy chọn)' },
                        end_date: { type: 'STRING', description: 'Ngày kết thúc thực tập dạng YYYY-MM-DD (tùy chọn)' }
                    },
                    required: ['student_code', 'name']
                }
            },
            {
                name: 'create_activity',
                description: 'Yêu cầu thêm hoạt động liên kết doanh nghiệp mới vào hệ thống. AI trích xuất tên hoạt động, người phụ trách, trạng thái và tên doanh nghiệp.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        title: { type: 'STRING', description: 'Tên hoạt động liên kết' },
                        person_in_charge: { type: 'STRING', description: 'Người phụ trách phía nhà trường (tùy chọn)' },
                        status: { type: 'STRING', description: 'Trạng thái: Đề xuất | Phê duyệt nội bộ | Đã triển khai | Đã kết thúc (tùy chọn)' },
                        enterprise_name: { type: 'STRING', description: 'Tên doanh nghiệp liên kết với hoạt động (tùy chọn, ví dụ: FPT Software)' }
                    },
                    required: ['title']
                }
            },
            {
                name: 'update_enterprise',
                description: 'Yêu cầu cập nhật thông tin của một doanh nghiệp trong hệ thống. AI trích xuất từ khóa tìm kiếm (tên hoặc mã số thuế hiện tại của doanh nghiệp cần cập nhật) và các trường thông tin thay đổi như điện thoại đại diện, email đại diện, trạng thái, v.v. để hiển thị form cập nhật.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        keyword: { type: 'STRING', description: 'Tên hoặc mã số thuế hiện tại của doanh nghiệp cần cập nhật' },
                        name: { type: 'STRING', description: 'Tên mới của doanh nghiệp (nếu có yêu cầu đổi tên)' },
                        tax_code: { type: 'STRING', description: 'Mã số thuế mới (nếu có)' },
                        status: { type: 'STRING', description: 'Trạng thái mới: Tiềm năng | Liên hệ | Đàm phán | Đề xuất | Đã ký hợp tác | Đang triển khai | Đã hoàn thành | Đã tạm ngưng (nếu có)' },
                        rep_title: { type: 'STRING', description: 'Danh xưng đại diện mới (Anh, Chị, Mr, Ms) (nếu có)' },
                        rep_full_name: { type: 'STRING', description: 'Họ tên đại diện mới (nếu có)' },
                        rep_role: { type: 'STRING', description: 'Chức vụ đại diện mới (nếu có)' },
                        rep_phone: { type: 'STRING', description: 'Số điện thoại đại diện mới (nếu có)' },
                        rep_email: { type: 'STRING', description: 'Email đại diện mới (nếu có)' },
                        building_street: { type: 'STRING', description: 'Địa chỉ đường/số nhà mới (nếu có)' },
                        district: { type: 'STRING', description: 'Quận/Huyện mới (nếu có)' },
                        province: { type: 'STRING', description: 'Tỉnh/Thành phố mới (nếu có)' },
                        country: { type: 'STRING', description: 'Quốc gia mới (nếu có)' }
                    },
                    required: ['keyword']
                }
            },
            {
                name: 'update_student',
                description: 'Yêu cầu cập nhật thông tin của một sinh viên thực tập trong hệ thống. AI trích xuất MSSV hoặc tên hiện tại của sinh viên để tìm kiếm, và các trường thông tin thay đổi như GPA, trạng thái, lớp, v.v.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        keyword: { type: 'STRING', description: 'Tên hoặc Mã số sinh viên (MSSV) hiện tại của sinh viên cần cập nhật' },
                        student_code: { type: 'STRING', description: 'Mã số sinh viên (MSSV) mới (nếu có)' },
                        name: { type: 'STRING', description: 'Họ tên mới của sinh viên (nếu có)' },
                        major: { type: 'STRING', description: 'Ngành học mới (nếu có)' },
                        class: { type: 'STRING', description: 'Lớp học mới (nếu có)' },
                        gpa: { type: 'NUMBER', description: 'Điểm GPA mới (nếu có)' },
                        status: { type: 'STRING', description: 'Trạng thái mới: Chờ phân công | Đang thực tập | Hoàn thành | Đã nghỉ (nếu có)' }
                    },
                    required: ['keyword']
                }
            },
            {
                name: 'update_activity',
                description: 'Yêu cầu cập nhật thông tin hoạt động hợp tác giữa VLU và doanh nghiệp. AI trích xuất tên hoạt động hiện tại để tìm kiếm, và các thông tin thay đổi như người phụ trách, trạng thái, tên doanh nghiệp liên kết mới, v.v.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        keyword: { type: 'STRING', description: 'Tên hoạt động hiện tại cần cập nhật' },
                        title: { type: 'STRING', description: 'Tên hoạt động mới (nếu có)' },
                        person_in_charge: { type: 'STRING', description: 'Người phụ trách mới phía nhà trường (nếu có)' },
                        status: { type: 'STRING', description: 'Trạng thái mới: Đề xuất | Phê duyệt nội bộ | Đã triển khai | Đã kết thúc (nếu có)' },
                        enterprise_name: { type: 'STRING', description: 'Tên doanh nghiệp liên kết mới (nếu có)' }
                    },
                    required: ['keyword']
                }
            },
            {
                name: 'search_documentation',
                description: 'Tìm kiếm hướng dẫn sử dụng, quy trình nghiệp vụ hệ thống từ tài liệu hướng dẫn (user manual) của VLU Enterprise Link.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        query: {
                            type: 'STRING',
                            description: 'Từ khóa tìm kiếm hướng dẫn sử dụng hoặc câu hỏi về cách dùng phần mềm (ví dụ: gộp trùng lặp, tạo hoạt động, phân công sinh viên,...)',
                        },
                    },
                    required: ['query'],
                },
            },
        ],
    },
];

// ---- TOOL IMPLEMENTATIONS ----

async function get_enterprise_list({ keyword, status, location, scale } = {}) {
    let query = `
        SELECT e.name, e.status, e.tax_code, s.name as scale_name,
               rep.full_name as rep_name, rep.phone as rep_phone,
               (SELECT COUNT(*) FROM students sv WHERE sv.enterprise_id = e.id AND sv.is_deleted = 0) as student_count,
               addr.province, addr.country
        FROM enterprises e
        LEFT JOIN scales s ON e.scale_id = s.id
        LEFT JOIN enterprise_representatives rep ON rep.enterprise_id = e.id AND rep.is_primary = 1
        LEFT JOIN enterprise_addresses addr ON addr.enterprise_id = e.id AND addr.is_main = 1
        WHERE e.is_deleted = 0`;
    const params = [];

    if (keyword) {
        query += ' AND e.name LIKE ?';
        params.push(`%${keyword}%`);
    }
    if (status) {
        query += ' AND e.status = ?';
        params.push(status);
    }
    if (scale) {
        query += ' AND s.name LIKE ?';
        params.push(`%${scale}%`);
    }
    if (location) {
        const locLower = location.toLowerCase();
        if (locLower === 'nước ngoài') {
            query += " AND (addr.country IS NOT NULL AND addr.country != 'Việt Nam' AND addr.country != 'Vietnam')";
        } else if (locLower === 'tp.hcm' || locLower === 'hồ chí minh' || locLower === 'tphcm') {
            query += " AND (e.is_hcmc = 1 OR addr.province LIKE '%Hồ Chí Minh%' OR addr.province LIKE '%HCM%')";
        } else {
            query += " AND (addr.province LIKE ? OR addr.district LIKE ? OR addr.country LIKE ?)";
            params.push(`%${location}%`, `%${location}%`, `%${location}%`);
        }
    }
    query += ' ORDER BY e.created_at DESC LIMIT 15';

    const [rows] = await pool.query(query, params);
    return rows;
}

async function get_student_list({ keyword, status, enterprise_name, major, class: className, gpa_min, gpa_max } = {}) {
    let query = `
        SELECT s.student_code, s.name, s.major, s.class, s.status, s.gpa, s.advisor,
               e.name as enterprise_name, a.title as activity_title
        FROM students s
        LEFT JOIN enterprises e ON s.enterprise_id = e.id
        LEFT JOIN activities a ON s.activity_id = a.id
        WHERE s.is_deleted = 0`;
    const params = [];

    if (keyword) {
        query += ' AND (s.name LIKE ? OR s.student_code LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
        query += ' AND s.status = ?';
        params.push(status);
    }
    if (enterprise_name) {
        query += ' AND e.name LIKE ?';
        params.push(`%${enterprise_name}%`);
    }
    if (major) {
        query += ' AND s.major LIKE ?';
        params.push(`%${major}%`);
    }
    if (className) {
        query += ' AND s.class LIKE ?';
        params.push(`%${className}%`);
    }
    if (gpa_min !== undefined && gpa_min !== null) {
        query += ' AND s.gpa >= ?';
        params.push(gpa_min);
    }
    if (gpa_max !== undefined && gpa_max !== null) {
        query += ' AND s.gpa <= ?';
        params.push(gpa_max);
    }
    query += ' ORDER BY s.created_at DESC LIMIT 20';

    const [rows] = await pool.query(query, params);
    return rows;
}

async function get_activity_list({ keyword, status, enterprise_name, start_date, end_date, limit = 10 } = {}) {
    let query = `
        SELECT a.title, a.status, a.start_date, a.end_date, a.person_in_charge,
               e.name as enterprise_name,
               GROUP_CONCAT(DISTINCT act.name ORDER BY act.name SEPARATOR ', ') as type_names,
               (SELECT COUNT(DISTINCT sa.student_id) FROM student_activities sa JOIN students s ON sa.student_id = s.id WHERE sa.activity_id = a.id AND s.is_deleted = 0) as student_count
        FROM activities a
        JOIN enterprises e ON a.enterprise_id = e.id
        LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
        LEFT JOIN act_types act ON act.id = atm.type_id
        WHERE a.is_deleted = 0`;
    const params = [];

    if (keyword) {
        query += ' AND a.title LIKE ?';
        params.push(`%${keyword}%`);
    }
    if (status) {
        query += ' AND a.status = ?';
        params.push(status);
    }
    if (enterprise_name) {
        query += ' AND e.name LIKE ?';
        params.push(`%${enterprise_name}%`);
    }
    if (start_date) {
        query += ' AND a.start_date >= ?';
        params.push(start_date);
    }
    if (end_date) {
        query += ' AND a.start_date <= ?';
        params.push(end_date);
    }
    query += ' GROUP BY a.id ORDER BY a.created_at DESC LIMIT ?';
    params.push(Math.min(limit, 50));

    const [rows] = await pool.query(query, params);
    return rows;
}

async function get_dashboard_stats() {
    const [[{ total: totalEnterprises }]] = await pool.query("SELECT COUNT(*) as total FROM enterprises WHERE is_deleted = 0");
    const [[{ total: collaborating }]] = await pool.query("SELECT COUNT(*) as total FROM enterprises WHERE status = 'Đang triển khai' AND is_deleted = 0");
    const [[{ total: totalStudents }]] = await pool.query("SELECT COUNT(*) as total FROM students WHERE is_deleted = 0");
    const [[{ total: interning }]] = await pool.query("SELECT COUNT(*) as total FROM students WHERE status = 'Đang thực tập' AND is_deleted = 0");
    const [[{ total: totalActivities }]] = await pool.query("SELECT COUNT(*) as total FROM activities WHERE is_deleted = 0");
    const [[{ total: activeActivities }]] = await pool.query("SELECT COUNT(*) as total FROM activities WHERE status = 'Đã triển khai' AND is_deleted = 0");
    const [[{ avgGpa }]] = await pool.query("SELECT ROUND(AVG(gpa), 2) as avgGpa FROM students WHERE gpa IS NOT NULL AND is_deleted = 0");

    const [byType] = await pool.query(`
        SELECT act.name as type_name, COUNT(DISTINCT a.id) as count
        FROM activities a
        LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
        LEFT JOIN act_types act ON act.id = atm.type_id
        WHERE a.is_deleted = 0
        GROUP BY act.name ORDER BY count DESC
    `);

    const [byStatus] = await pool.query(`
        SELECT status, COUNT(*) as count FROM enterprises WHERE is_deleted = 0 GROUP BY status ORDER BY count DESC
    `);

    return {
        enterprises: { total: totalEnterprises, collaborating },
        students: { total: totalStudents, interning },
        activities: { total: totalActivities, active: activeActivities },
        avgGpa,
        activityByType: byType,
        enterpriseByStatus: byStatus,
    };
}

async function get_mou_list({ keyword, country, start_date, end_date } = {}) {
    let query = `
        SELECT m.mou_code, m.signing_date, m.org_type, m.country,
               m.vlu_contact, m.partner_contact, m.collaboration_scope,
               e.name as enterprise_name, d.name as executing_unit
        FROM mous m
        JOIN enterprises e ON m.enterprise_id = e.id
        LEFT JOIN departments d ON m.executing_unit_id = d.id
        WHERE m.is_deleted = 0`;
    const params = [];

    if (keyword) {
        query += ' AND (e.name LIKE ? OR m.mou_code LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (country) {
        query += ' AND m.country LIKE ?';
        params.push(`%${country}%`);
    }
    if (start_date) {
        query += ' AND m.signing_date >= ?';
        params.push(start_date);
    }
    if (end_date) {
        query += ' AND m.signing_date <= ?';
        params.push(end_date);
    }
    query += ' ORDER BY m.created_at DESC LIMIT 15';

    const [rows] = await pool.query(query, params);
    return rows;
}

async function get_upcoming_activities() {
    const [rows] = await pool.query(`
        SELECT a.title, a.start_date, a.end_date, a.status, a.person_in_charge,
               e.name as enterprise_name,
               GROUP_CONCAT(DISTINCT act.name SEPARATOR ', ') as type_names
        FROM activities a
        JOIN enterprises e ON a.enterprise_id = e.id
        LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
        LEFT JOIN act_types act ON act.id = atm.type_id
        WHERE a.start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND a.is_deleted = 0
        GROUP BY a.id
        ORDER BY a.start_date ASC
        LIMIT 10
    `);
    return rows;
}

async function get_enterprise_ratings({ enterprise_name } = {}) {
    if (enterprise_name) {
        const [rows] = await pool.query(`
            SELECT e.name as enterprise_name,
                   AVG(r.overall_score) as avg_overall,
                   AVG(r.guidance_score) as avg_guidance,
                   AVG(r.facilities_score) as avg_facilities,
                   AVG(r.opportunities_score) as avg_opportunities,
                   AVG(r.coordination_score) as avg_coordination,
                   COUNT(r.id) as rating_count
            FROM enterprise_ratings r
            JOIN enterprises e ON r.enterprise_id = e.id
            WHERE e.name LIKE ? AND e.is_deleted = 0
            GROUP BY e.id, e.name
        `, [`%${enterprise_name}%`]);
        return rows;
    }
    const [rows] = await pool.query(`
        SELECT e.name as enterprise_name,
               ROUND(AVG(r.overall_score), 2) as avg_overall,
               COUNT(r.id) as rating_count
        FROM enterprise_ratings r
        JOIN enterprises e ON r.enterprise_id = e.id
        WHERE e.is_deleted = 0
        GROUP BY e.id, e.name
        HAVING avg_overall >= 3
        ORDER BY avg_overall DESC, rating_count DESC
        LIMIT 10
    `);
    return rows;
}

async function get_student_stats_by_enterprise({ enterprise_name, major } = {}) {
    let queryByEnt = `
        SELECT e.name as enterprise,
               COUNT(s.id) as total,
               SUM(CASE WHEN s.status = 'Đang thực tập' THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN s.status = 'Hoàn thành' THEN 1 ELSE 0 END) as completed,
               ROUND(AVG(s.gpa), 2) as avg_gpa
        FROM students s
        JOIN enterprises e ON s.enterprise_id = e.id
        WHERE s.enterprise_id IS NOT NULL AND s.is_deleted = 0 AND e.is_deleted = 0`;
    const paramsEnt = [];
    if (enterprise_name) {
        queryByEnt += ' AND e.name LIKE ?';
        paramsEnt.push(`%${enterprise_name}%`);
    }
    if (major) {
        queryByEnt += ' AND s.major LIKE ?';
        paramsEnt.push(`%${major}%`);
    }
    queryByEnt += ' GROUP BY e.id, e.name ORDER BY total DESC LIMIT 10';
    const [byEnterprise] = await pool.query(queryByEnt, paramsEnt);

    let queryByMajor = `
        SELECT major, COUNT(*) as count, ROUND(AVG(gpa), 2) as avg_gpa
        FROM students
        WHERE major IS NOT NULL AND is_deleted = 0`;
    const paramsMajor = [];
    if (enterprise_name) {
        queryByMajor += ' AND enterprise_id IN (SELECT id FROM enterprises WHERE name LIKE ? AND is_deleted = 0)';
        paramsMajor.push(`%${enterprise_name}%`);
    }
    if (major) {
        queryByMajor += ' AND major LIKE ?';
        paramsMajor.push(`%${major}%`);
    }
    queryByMajor += ' GROUP BY major ORDER BY count DESC LIMIT 8';
    const [byMajor] = await pool.query(queryByMajor, paramsMajor);

    return { byEnterprise, byMajor };
}

async function get_enterprise_ranking({ ranking_type, limit = 10 } = {}) {
    const finalLimit = Math.min(limit, 50);
    let query = '';
    const params = [finalLimit];

    if (ranking_type === 'students_interning') {
        query = `
            SELECT e.name, COUNT(s.id) as count
            FROM enterprises e
            JOIN students s ON s.enterprise_id = e.id
            WHERE s.status = 'Đang thực tập' AND s.is_deleted = 0 AND e.is_deleted = 0
            GROUP BY e.id, e.name
            ORDER BY count DESC
            LIMIT ?`;
    } else if (ranking_type === 'activity_participation') {
        query = `
            SELECT e.name, COUNT(DISTINCT sa.student_id) as count
            FROM enterprises e
            JOIN activities a ON a.enterprise_id = e.id
            JOIN student_activities sa ON sa.activity_id = a.id
            JOIN students s ON sa.student_id = s.id
            WHERE a.is_deleted = 0 AND e.is_deleted = 0 AND s.is_deleted = 0
            GROUP BY e.id, e.name
            ORDER BY count DESC
            LIMIT ?`;
    } else if (ranking_type === 'activity_count') {
        query = `
            SELECT e.name, COUNT(a.id) as count
            FROM enterprises e
            JOIN activities a ON a.enterprise_id = e.id
            WHERE a.is_deleted = 0 AND e.is_deleted = 0
            GROUP BY e.id, e.name
            ORDER BY count DESC
            LIMIT ?`;
    } else if (ranking_type === 'rating') {
        query = `
            SELECT e.name, ROUND(AVG(r.overall_score), 2) as count, COUNT(r.id) as rating_count
            FROM enterprises e
            JOIN enterprise_ratings r ON r.enterprise_id = e.id
            WHERE e.is_deleted = 0
            GROUP BY e.id, e.name
            ORDER BY count DESC, rating_count DESC
            LIMIT ?`;
    } else {
        return { error: 'ranking_type không hợp lệ.' };
    }

    const [rows] = await pool.query(query, params);
    return rows;
}

async function get_enterprise_stats({ enterprise_name }) {
    if (!enterprise_name) {
        return { error: 'Tên doanh nghiệp là bắt buộc.' };
    }

    const [ents] = await pool.query(
        'SELECT id, name, tax_code, status FROM enterprises WHERE name LIKE ? AND is_deleted = 0 LIMIT 1',
        [`%${enterprise_name}%`]
    );

    if (ents.length === 0) {
        return { message: `Không tìm thấy doanh nghiệp có tên khớp với '${enterprise_name}'` };
    }

    const enterprise = ents[0];
    const entId = enterprise.id;

    // 1. Thống kê sinh viên
    const [[studentStats]] = await pool.query(`
        SELECT COUNT(s.id) as total,
               SUM(CASE WHEN s.status = 'Đang thực tập' THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN s.status = 'Hoàn thành' THEN 1 ELSE 0 END) as completed,
               ROUND(AVG(s.gpa), 2) as avg_gpa
        FROM students s
        WHERE s.enterprise_id = ? AND s.is_deleted = 0
    `, [entId]);

    // 2. Thống kê hoạt động
    const [[activityStats]] = await pool.query(`
        SELECT COUNT(a.id) as total,
               SUM(CASE WHEN a.status = 'Đã kết thúc' THEN 1 ELSE 0 END) as finished,
               SUM(CASE WHEN a.status = 'Đã triển khai' THEN 1 ELSE 0 END) as ongoing
        FROM activities a
        WHERE a.enterprise_id = ? AND a.is_deleted = 0
    `, [entId]);

    // 3. Hoạt động gần đây
    const [recentActivities] = await pool.query(`
        SELECT a.title, a.start_date, a.end_date, a.status,
               (SELECT COUNT(DISTINCT sa.student_id) FROM student_activities sa JOIN students s ON sa.student_id = s.id WHERE sa.activity_id = a.id AND s.is_deleted = 0) as student_count
        FROM activities a
        WHERE a.enterprise_id = ? AND a.is_deleted = 0
        ORDER BY a.start_date DESC
        LIMIT 5
    `, [entId]);

    // 4. Biên bản ghi nhớ (MOU)
    const [mous] = await pool.query(`
        SELECT mou_code, signing_date, country, collaboration_scope, file_url
        FROM mous
        WHERE enterprise_id = ? AND is_deleted = 0
        ORDER BY signing_date DESC
    `, [entId]);

    // 5. Đánh giá chất lượng
    const [[ratingStats]] = await pool.query(`
        SELECT ROUND(AVG(overall_score), 2) as avg_score, COUNT(id) as total_ratings
        FROM enterprise_ratings
        WHERE enterprise_id = ?
    `, [entId]);

    return {
        enterprise_info: enterprise,
        student_summary: studentStats || { total: 0, active: 0, completed: 0, avg_gpa: null },
        activity_summary: activityStats || { total: 0, finished: 0, ongoing: 0 },
        recent_activities: recentActivities,
        mous: mous,
        rating: ratingStats || { avg_score: null, total_ratings: 0 }
    };
}

async function get_student_ranking({ ranking_type, limit = 10 } = {}) {
    const finalLimit = Math.min(limit, 50);
    let query = '';
    const params = [finalLimit];

    if (ranking_type === 'activity_participation') {
        query = `
            SELECT s.student_code, s.name, s.major, s.class, COUNT(sa.activity_id) as count
            FROM students s
            JOIN student_activities sa ON s.id = sa.student_id
            WHERE s.is_deleted = 0
            GROUP BY s.id, s.student_code, s.name, s.major, s.class
            ORDER BY count DESC
            LIMIT ?`;
    } else {
        return { error: 'ranking_type không hợp lệ.' };
    }

    const [rows] = await pool.query(query, params);
    return rows;
}

async function get_enterprise_details({ keyword }) {
    const [enterprises] = await pool.query(`
        SELECT e.name, e.tax_code, e.status, s.name as scale,
               addr.building_street, addr.district, addr.province,
               rep.full_name as rep_name, rep.phone as rep_phone, rep.email as rep_email,
               GROUP_CONCAT(DISTINCT fi.name SEPARATOR ', ') as fields
        FROM enterprises e
        LEFT JOIN scales s ON e.scale_id = s.id
        LEFT JOIN enterprise_addresses addr ON addr.enterprise_id = e.id AND addr.is_main = 1
        LEFT JOIN enterprise_representatives rep ON rep.enterprise_id = e.id AND rep.is_primary = 1
        LEFT JOIN enterprise_fields ef ON ef.enterprise_id = e.id
        LEFT JOIN fields fi ON fi.id = ef.field_id
        WHERE e.name LIKE ? OR e.tax_code = ?
        GROUP BY e.id
        LIMIT 1
    `, [`%${keyword}%`, keyword]);
    return enterprises.length > 0 ? enterprises[0] : { message: 'Không tìm thấy doanh nghiệp' };
}

async function get_student_details({ keyword }) {
    const [students] = await pool.query(`
        SELECT s.student_code, s.name, s.major, s.class, s.gpa, s.status,
               e.name as enterprise_name, a.title as activity_title,
               s.start_date, s.end_date
        FROM students s
        LEFT JOIN enterprises e ON s.enterprise_id = e.id
        LEFT JOIN activities a ON s.activity_id = a.id
        WHERE s.name LIKE ? OR s.student_code = ?
        LIMIT 1
    `, [`%${keyword}%`, keyword]);
    return students.length > 0 ? students[0] : { message: 'Không tìm thấy sinh viên' };
}

async function search_enterprises_by_field({ field_name }) {
    const [enterprises] = await pool.query(`
        SELECT e.name, e.status, fi.name as field_name, s.name as scale
        FROM enterprises e
        JOIN enterprise_fields ef ON ef.enterprise_id = e.id
        JOIN fields fi ON fi.id = ef.field_id
        LEFT JOIN scales s ON e.scale_id = s.id
        WHERE fi.name LIKE ?
        LIMIT 10
    `, [`%${field_name}%`]);
    return enterprises.length > 0 ? enterprises : { message: 'Không tìm thấy doanh nghiệp trong lĩnh vực này' };
}

async function get_activity_details({ keyword }) {
    const [activities] = await pool.query(`
        SELECT a.title, a.status, a.start_date, a.end_date, a.person_in_charge,
               e.name as enterprise_name,
               GROUP_CONCAT(DISTINCT act.name SEPARATOR ', ') as types,
               (SELECT COUNT(*) FROM students s WHERE s.activity_id = a.id) as student_count
        FROM activities a
        JOIN enterprises e ON a.enterprise_id = e.id
        LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
        LEFT JOIN act_types act ON act.id = atm.type_id
        WHERE a.title LIKE ?
        GROUP BY a.id
        LIMIT 1
    `, [`%${keyword}%`]);
    return activities.length > 0 ? activities[0] : { message: 'Không tìm thấy hoạt động' };
}

async function get_mou_stats() {
    const [byCountry] = await pool.query(`
        SELECT country, COUNT(*) as count 
        FROM mous 
        WHERE country IS NOT NULL 
        GROUP BY country 
        ORDER BY count DESC
    `);
    const [byUnit] = await pool.query(`
        SELECT d.name as unit_name, COUNT(*) as count 
        FROM mous m
        LEFT JOIN departments d ON m.executing_unit_id = d.id
        GROUP BY m.executing_unit_id, d.name
        ORDER BY count DESC
    `);
    const [byYear] = await pool.query(`
        SELECT YEAR(signing_date) as year, COUNT(*) as count 
        FROM mous 
        WHERE signing_date IS NOT NULL 
        GROUP BY year 
        ORDER BY year DESC
    `);
    return { byCountry, byUnit, byYear };
}

async function get_high_performing_students({ min_gpa = 3.2, major } = {}) {
    let query = `
        SELECT s.student_code, s.name, s.major, s.class, s.gpa, s.status,
               e.name as enterprise_name
        FROM students s
        LEFT JOIN enterprises e ON s.enterprise_id = e.id
        WHERE s.gpa >= ?`;
    const params = [min_gpa];
    if (major) {
        query += ' AND s.major LIKE ?';
        params.push(`%${major}%`);
    }
    query += ' ORDER BY s.gpa DESC LIMIT 15';
    const [rows] = await pool.query(query, params);
    return rows;
}

async function get_enterprise_scale_stats() {
    const [rows] = await pool.query(`
        SELECT s.name as scale_name, COUNT(e.id) as count
        FROM scales s
        LEFT JOIN enterprises e ON e.scale_id = s.id
        GROUP BY s.id, s.name
        ORDER BY count DESC
    `);
    return rows;
}

async function create_enterprise(args) {
    return { requires_confirmation: true, actionType: 'create_enterprise', data: args };
}

async function create_student(args) {
    return { requires_confirmation: true, actionType: 'create_student', data: args };
}

async function create_activity(args) {
    return { requires_confirmation: true, actionType: 'create_activity', data: args };
}

async function update_enterprise(args) {
    const { keyword } = args;
    if (!keyword) {
        return { error: 'Thiếu từ khóa để tìm doanh nghiệp cần cập nhật' };
    }
    const [enterprises] = await pool.query(`
        SELECT e.*,
               rep.title as rep_title, rep.full_name as rep_full_name, rep.role as rep_role, rep.phone as rep_phone, rep.email as rep_email,
               addr.building_street, addr.district, addr.province, addr.country,
               GROUP_CONCAT(DISTINCT ef.field_id) as field_ids
        FROM enterprises e
        LEFT JOIN enterprise_representatives rep ON rep.enterprise_id = e.id AND rep.is_primary = 1
        LEFT JOIN enterprise_addresses addr ON addr.enterprise_id = e.id AND addr.is_main = 1
        LEFT JOIN enterprise_fields ef ON ef.enterprise_id = e.id
        WHERE (e.name LIKE ? OR e.tax_code = ?) AND e.is_deleted = 0
        GROUP BY e.id
        LIMIT 1
    `, [`%${keyword}%`, keyword]);

    if (enterprises.length === 0) {
        return { error: `Không tìm thấy doanh nghiệp có tên hoặc mã số thuế khớp với '${keyword}'` };
    }

    const enterprise = enterprises[0];
    const mergedData = {
        id: enterprise.id,
        name: args.name !== undefined ? args.name : enterprise.name,
        tax_code: args.tax_code !== undefined ? args.tax_code : enterprise.tax_code,
        status: args.status !== undefined ? args.status : enterprise.status,
        scale_id: args.scale_id !== undefined ? args.scale_id : enterprise.scale_id,
        is_hcmc: args.is_hcmc !== undefined ? args.is_hcmc : enterprise.is_hcmc,
        department_id: enterprise.department_id,
        faculty_id: enterprise.faculty_id,
        field_ids: enterprise.field_ids,
        rep_title: args.rep_title !== undefined ? args.rep_title : enterprise.rep_title,
        rep_full_name: args.rep_full_name !== undefined ? args.rep_full_name : enterprise.rep_full_name,
        rep_role: args.rep_role !== undefined ? args.rep_role : enterprise.rep_role,
        rep_phone: args.rep_phone !== undefined ? args.rep_phone : enterprise.rep_phone,
        rep_email: args.rep_email !== undefined ? args.rep_email : enterprise.rep_email,
        building_street: args.building_street !== undefined ? args.building_street : enterprise.building_street,
        district: args.district !== undefined ? args.district : enterprise.district,
        province: args.province !== undefined ? args.province : enterprise.province,
        country: args.country !== undefined ? args.country : enterprise.country,
    };

    return { requires_confirmation: true, actionType: 'update_enterprise', data: mergedData };
}

async function update_student(args) {
    const { keyword } = args;
    if (!keyword) {
        return { error: 'Thiếu từ khóa để tìm sinh viên cần cập nhật' };
    }
    const [students] = await pool.query(`
        SELECT * FROM students 
        WHERE (name LIKE ? OR student_code = ?) AND is_deleted = 0
        LIMIT 1
    `, [`%${keyword}%`, keyword]);

    if (students.length === 0) {
        return { error: `Không tìm thấy sinh viên có tên hoặc MSSV khớp với '${keyword}'` };
    }

    const student = students[0];
    const mergedData = {
        ...student,
        student_code: args.student_code !== undefined ? args.student_code : student.student_code,
        name: args.name !== undefined ? args.name : student.name,
        major: args.major !== undefined ? args.major : student.major,
        class: args.class !== undefined ? args.class : student.class,
        gpa: args.gpa !== undefined ? args.gpa : student.gpa,
        status: args.status !== undefined ? args.status : student.status,
    };

    return { requires_confirmation: true, actionType: 'update_student', data: mergedData };
}

async function update_activity(args) {
    const { keyword } = args;
    if (!keyword) {
        return { error: 'Thiếu từ khóa để tìm hoạt động cần cập nhật' };
    }
    const [activities] = await pool.query(`
        SELECT a.*, e.name as enterprise_name,
               GROUP_CONCAT(DISTINCT atm.type_id) as type_ids,
               GROUP_CONCAT(DISTINCT atm2.target_id) as target_ids
        FROM activities a
        LEFT JOIN enterprises e ON a.enterprise_id = e.id
        LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
        LEFT JOIN activity_target_map atm2 ON atm2.activity_id = a.id
        WHERE a.title LIKE ? AND a.is_deleted = 0
        GROUP BY a.id
        LIMIT 1
    `, [`%${keyword}%`]);

    if (activities.length === 0) {
        return { error: `Không tìm thấy hoạt động có tên khớp với '${keyword}'` };
    }

    const activity = activities[0];
    
    let enterpriseId = activity.enterprise_id;
    let enterpriseName = activity.enterprise_name;
    if (args.enterprise_name) {
        const [ents] = await pool.query('SELECT id, name FROM enterprises WHERE name LIKE ? AND is_deleted = 0 LIMIT 1', [`%${args.enterprise_name}%`]);
        if (ents.length > 0) {
            enterpriseId = ents[0].id;
            enterpriseName = ents[0].name;
        }
    }

    const mergedData = {
        ...activity,
        title: args.title !== undefined ? args.title : activity.title,
        person_in_charge: args.person_in_charge !== undefined ? args.person_in_charge : activity.person_in_charge,
        status: args.status !== undefined ? args.status : activity.status,
        enterprise_id: enterpriseId,
        enterprise_name: enterpriseName,
    };

    return { requires_confirmation: true, actionType: 'update_activity', data: mergedData };
}

const fs = require('fs');
const path = require('path');

async function search_documentation({ query }) {
    if (!query) return { message: 'Vui lòng cung cấp từ khóa tìm kiếm.' };
    const kw = query.toLowerCase();
    const docIds = ['intro', 'accounts', 'enterprises', 'students', 'activities', 'mous', 'tasks', 'notes', 'advanced'];
    const results = [];
    const docsDirPath = path.join(__dirname, '../../../frontend/public/docs');
    
    for (const id of docIds) {
        const filepath = path.join(docsDirPath, `${id}.md`);
        if (fs.existsSync(filepath)) {
            try {
                const text = fs.readFileSync(filepath, 'utf8');
                let matchIdx = text.toLowerCase().indexOf(kw);
                if (matchIdx !== -1) {
                    const start = Math.max(0, matchIdx - 150);
                    const end = Math.min(text.length, matchIdx + kw.length + 150);
                    let snippet = text.substring(start, end);
                    if (start > 0) snippet = '...' + snippet;
                    if (end < text.length) snippet = snippet + '...';
                    
                    results.push({
                        doc_id: id,
                        title: getDocTitle(id),
                        snippet: snippet
                    });
                }
            } catch (e) {
                console.error(`Error reading doc file ${id}:`, e.message);
            }
        }
    }
    
    if (results.length === 0) {
        return { message: 'Không tìm thấy nội dung hướng dẫn phù hợp trong tài liệu.' };
    }
    return {
        results: results,
        message: 'Dưới đây là nội dung tìm thấy trong tài liệu hướng dẫn. Hãy giải thích và hướng dẫn chi tiết cho người dùng dựa trên thông tin này, đồng thời khuyên họ xem thêm tại trang tài liệu.'
    };
}

function getDocTitle(id) {
    const titles = {
        intro: 'Giới thiệu chung',
        accounts: 'Tài khoản hệ thống',
        enterprises: 'Quản lý Doanh nghiệp (Cty)',
        students: 'Quản lý Sinh viên (HS)',
        activities: 'Hoạt động liên kết',
        mous: 'Biên bản ghi nhớ MOU',
        tasks: 'Nhiệm vụ Kanban',
        notes: 'Không gian Ghi chú',
        advanced: 'Công cụ nâng cao'
    };
    return titles[id] || id;
}

// Map tên tool -> hàm thực thi
const toolExecutors = {
    get_enterprise_list,
    get_student_list,
    get_activity_list,
    get_dashboard_stats,
    get_mou_list,
    get_upcoming_activities,
    get_enterprise_ratings,
    get_student_stats_by_enterprise,
    get_enterprise_details,
    get_student_details,
    search_enterprises_by_field,
    get_activity_details,
    get_mou_stats,
    get_high_performing_students,
    get_enterprise_scale_stats,
    get_enterprise_ranking,
    get_enterprise_stats,
    get_student_ranking,
    create_enterprise,
    create_student,
    create_activity,
    update_enterprise,
    update_student,
    update_activity,
    search_documentation,
};

// ---- SYSTEM PROMPT ----
const SYSTEM_PROMPT = `Bạn là **VLU Assistant** - trợ lý AI thông minh, chuyên biệt của hệ thống quản lý liên kết doanh nghiệp Trường Đại học Văn Lang (VLU).

Nhiệm vụ của bạn:
- Trả lời các câu hỏi liên quan đến dữ liệu trong hệ thống bao gồm: doanh nghiệp, sinh viên thực tập, hoạt động hợp tác, MOU, báo cáo thống kê.
- Sử dụng các tool được cung cấp để truy vấn dữ liệu thực tế từ hệ thống.
- Khi người dùng hỏi các câu hỏi có bộ lọc thời gian tương đối (ví dụ: "tuần này", "tháng này", "năm nay", "tuần tới", "gần đây"), hãy đối chiếu với mốc thời gian hệ thống được cung cấp dưới đây, tự tính toán khoảng ngày (YYYY-MM-DD) và truyền vào tham số \`start_date\`, \`end_date\` của các công cụ phù hợp.
- Khi người dùng hỏi các câu hỏi phức tạp hoặc kết hợp (ví dụ: "Công ty FPT Telecom hiện tại có bao nhiêu sinh viên thực tập", "các hoạt động tuần này của ACB", "công ty nào có nhiều sinh viên nhất", "top sinh viên tham gia nhiều hoạt động nhất"):
  + Sử dụng \`get_student_list\` (truyền \`enterprise_name\`) hoặc \`get_enterprise_stats\` để lấy thống kê chi tiết của một công ty cụ thể.
  + Sử dụng \`get_enterprise_ranking\` để trả lời nhanh về xếp hạng doanh nghiệp (nhiều sinh viên thực tập nhất, nhiều hoạt động nhất, rating cao nhất).
  + Sử dụng \`get_student_ranking\` để trả lời các câu hỏi xếp hạng sinh viên (ví dụ: sinh viên tham gia nhiều hoạt động nhất).
  + Kết hợp linh hoạt giữa các tool để tổng hợp thông tin chính xác nhất.
- Khi người dùng hỏi về cách dùng phần mềm, quy trình nghiệp vụ hoặc hướng dẫn sử dụng, hãy sử dụng tool 'search_documentation' để tìm nội dung hướng dẫn phù hợp. Sau đó, giải thích cặn kẽ và hướng dẫn chi tiết cho họ, đồng thời gợi ý họ xem thêm tại trang tài liệu bằng cách sử dụng chính xác liên kết định dạng Markdown: \`[Tên tiêu đề mục](/docs?doc=[doc_id]#[anchor-slug])\` (Ví dụ: \`[Không gian Ghi chú](/docs?doc=notes#khong-gian-ghi-chu)\` hoặc \`[Thông tin đăng nhập mặc định](/docs?doc=accounts#thong-tin-dang-nhap-mac-dinh-moi-truong-thu-nghiem)\`).
  Trong đó:
  + \`doc_id\` là mã của tài liệu chứa mục đó (ví dụ: intro, accounts, enterprises, students, activities, mous, tasks, notes, advanced) được xác định từ kết quả tìm kiếm của tool 'search_documentation'.
  + \`anchor-slug\` là anchor trượt được tạo bằng cách chuyển tiêu đề tiếng Việt của mục đó thành chữ thường không dấu, loại bỏ emoji, kí tự đặc biệt và thay khoảng trắng bằng dấu gạch ngang (ví dụ: "🔑 Thông tin đăng nhập mặc định (Môi trường thử nghiệm)" -> "thong-tin-dang-nhap-mac-dinh-moi-truong-thu-nghiem").
- Thực hiện so sánh, phân tích chuyên sâu các dữ liệu và chỉ số khi được yêu cầu (ví dụ: đối chiếu GPA sinh viên giữa các công ty, tìm kiếm ngành học có tỉ lệ liên kết cao nhất, phân tích cấu trúc doanh nghiệp).
- Khi người dùng muốn THÊM, NHẬP mới hoặc CẬP NHẬT, CHỈNH SỬA một doanh nghiệp, sinh viên, hoặc hoạt động liên kết (hoặc khi nội dung câu hỏi/ghi chú/nhiệm vụ chứa thông tin yêu cầu thêm mới/chỉnh sửa), bạn phải LẬP TỨC gọi các tool tương ứng (create_enterprise, create_student, create_activity, update_enterprise, update_student, update_activity) với các thông tin chi tiết trích xuất được để hiển thị form ngay lập tức trên màn hình (frontend) cho người dùng duyệt, tuyệt đối KHÔNG chỉ trả lời bằng văn bản hỏi lại ý kiến hay đề xuất họ tự đi sửa/tạo.
- Trả lời bằng tiếng Việt, ngắn gọn, cấu trúc rõ ràng (sử dụng markdown bold, bullet points), thân thiện và dùng emoji phù hợp.
- Luôn hướng dẫn người dùng đến trang phù hợp nếu họ muốn xem thêm chi tiết.

Quy tắc BẢO MẬT & PHẠM VI NGHIỆP VỤ nghiêm ngặt:
1. **Giới hạn phạm vi**: Bạn CHỈ được phép giải thích và trả lời các vấn đề trực tiếp thuộc về hệ thống quản lý liên kết doanh nghiệp VLU. Bạn KHÔNG được giải thích lung tung, cung cấp kiến thức ngoài hệ thống (ví dụ: viết code, làm thơ, dịch thuật, trả lời câu hỏi xã hội, khoa học, tin tức chung,...).
2. **Từ chối câu hỏi ngoài hệ thống**: Nếu người dùng hỏi bất kỳ câu hỏi nào không liên quan đến hệ thống hoặc dữ liệu doanh nghiệp/sinh viên/MOU/hoạt động của VLU, bạn phải từ chối thẳng thắn và lịch sự. Hãy trả lời ngắn gọn: "Tôi là trợ lý AI được thiết kế riêng cho Hệ thống Quản lý Liên kết Doanh nghiệp VLU. Tôi không thể hỗ trợ hoặc giải thích các câu hỏi nằm ngoài phạm vi của hệ thống này."
3. **Không thực hiện SQL trực tiếp**: Bạn KHÔNG được trực tiếp thực hiện các câu lệnh ghi SQL (INSERT, UPDATE, DELETE). Đối với các tác vụ thêm hoặc cập nhật dữ liệu, bạn phải gọi các tool tạo/cập nhật yêu cầu (create_..., update_...) để hệ thống hiển thị form xác nhận (modal) cho người dùng tự duyệt ở frontend.
4. **Bảo mật thông tin**: Từ chối trả lời một cách lịch sự bất kỳ câu hỏi nào yêu cầu thông tin nhạy cảm của hệ thống như mật khẩu, mã băm (hash), token bí mật, cấu hình máy chủ hoặc tài khoản đăng nhập của người dùng.
5. **Xử lý hình ảnh**: Nếu người dùng cung cấp hình ảnh (ví dụ: ảnh bảng dữ liệu, ảnh sơ đồ, ảnh chụp văn bản hoặc ảnh báo cáo), hãy tập trung phân tích kỹ nội dung trong ảnh và kết hợp với dữ liệu hệ thống để trả lời chính xác nhất.

Các trang trong hệ thống: /dashboard, /enterprises, /activities, /students, /kanban, /calendar, /mous, /reports/students, /reports/activities, /settings, /docs`;

// ---- MAIN CHAT HANDLER ----
exports.chat = async (req, res) => {
    try {
        const { message, history = [], image } = req.body; // image: { data: 'base64...', mimeType: 'image/png' }
        if (!message || !message.trim()) {
            return res.status(400).json({ reply: 'Vui lòng nhập câu hỏi.' });
        }

        const dateOptions = {
            timeZone: 'Asia/Ho_Chi_Minh',
            weekday: 'long',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        };
        const currentLocalTime = new Date().toLocaleString('vi-VN', dateOptions);
        const dynamicSystemPrompt = `${SYSTEM_PROMPT}\n\n---\nTHÔNG TIN HỆ THỐNG HIỆN TẠI:\n- Thời gian hiện tại của hệ thống: ${currentLocalTime}\n- Hãy luôn sử dụng mốc thời gian này để đối chiếu khi người dùng hỏi các câu hỏi liên quan đến thời gian ("hôm nay", "tháng này", "tuần tới", "năm nay", v.v.).`;

        const model = genAI.getGenerativeModel({
            model: 'gemini-3.1-flash-lite',
            systemInstruction: dynamicSystemPrompt,
            tools,
        });

        // Xây dựng contents array theo chuẩn Gemini:
        // - Map 'assistant' -> 'model'
        // - History phải bắt đầu bằng 'user' (yêu cầu của Gemini API)
        const validHistory = history
            .filter(h => h.role === 'user' || h.role === 'assistant' || h.role === 'model')
            .map(h => ({
                role: h.role === 'assistant' ? 'model' : h.role,
                parts: [{ text: h.content || '' }],
            }));

        // Bỏ các 'model' ở đầu cho đến khi gặp 'user'
        while (validHistory.length > 0 && validHistory[0].role !== 'user') {
            validHistory.shift();
        }

        // Xây dựng parts cho turn của user hiện tại
        const userParts = [];
        if (image && image.data && image.mimeType) {
            userParts.push({
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType
                }
            });
        }
        userParts.push({ text: message });

        // Dùng generateContent với full contents array
        const contents = [
            ...validHistory,
            { role: 'user', parts: userParts },
        ];

        let result = await model.generateContent({ contents });
        let response = result.response;

        // Vòng lặp xử lý Function Calling
        let functionCalls = response.functionCalls?.() ?? [];
        let pendingAction = null;

        while (functionCalls.length > 0) {
            // Thêm model turn (chứa function calls) vào contents
            contents.push({
                role: 'model',
                parts: response.candidates[0].content.parts,
            });

            const functionResponseParts = [];

            for (const call of functionCalls) {
                const toolFn = toolExecutors[call.name];
                let toolResult;

                if (toolFn) {
                    try {
                        toolResult = await toolFn(call.args || {});
                        if (toolResult && toolResult.requires_confirmation) {
                            pendingAction = {
                                actionType: toolResult.actionType,
                                data: toolResult.data
                            };
                        }
                    } catch (err) {
                        console.error(`Tool '${call.name}' error:`, err.message);
                        toolResult = { error: err.message };
                    }
                } else {
                    toolResult = { error: `Tool '${call.name}' không tồn tại` };
                }

                functionResponseParts.push({
                    functionResponse: {
                        name: call.name,
                        response: { result: toolResult },
                    },
                });
            }

            // Thêm function responses vào contents rồi gọi lại
            contents.push({ role: 'user', parts: functionResponseParts });

            result = await model.generateContent({ contents });
            response = result.response;
            functionCalls = response.functionCalls?.() ?? [];
        }

        const reply = response.text();
        res.json({ reply, action: pendingAction });

    } catch (error) {
        console.error('Chatbot error:', error.message);
        console.error('Chatbot error details:', JSON.stringify(error?.errorDetails ?? error?.status ?? '', null, 2));
        res.json({ reply: `❌ Lỗi: ${error.message}` });
    }
};

exports.confirmInsert = async (req, res) => {
    try {
        const { actionType, data } = req.body;
        const facultyId = req.user?.faculty_id || null;

        if (actionType === 'create_enterprise') {
            const { name, tax_code, status = 'Tiềm năng' } = data;
            if (!name) return res.status(400).json({ error: 'Tên doanh nghiệp là bắt buộc' });

            const [existingName] = await pool.query(
                'SELECT id FROM enterprises WHERE name = ? AND (faculty_id = ? OR (faculty_id IS NULL AND ? IS NULL)) AND is_deleted = 0',
                [name, facultyId, facultyId]
            );
            if (existingName.length > 0) {
                return res.status(400).json({ error: 'Tên doanh nghiệp đã tồn tại trong hệ thống' });
            }
            if (tax_code) {
                const [existingTax] = await pool.query(
                    'SELECT id FROM enterprises WHERE tax_code = ? AND (faculty_id = ? OR (faculty_id IS NULL AND ? IS NULL)) AND is_deleted = 0',
                    [tax_code, facultyId, facultyId]
                );
                if (existingTax.length > 0) {
                    return res.status(400).json({ error: 'Mã số thuế đã tồn tại trong hệ thống' });
                }
            }

            const [result] = await pool.query(
                `INSERT INTO enterprises (name, tax_code, status, faculty_id, created_at) 
                 VALUES (?, ?, ?, ?, NOW())`,
                [name, tax_code || null, status, facultyId]
            );
            return res.json({ success: true, insertId: result.insertId });
        }

        if (actionType === 'create_student') {
            const { student_code, name, major, class: className, gpa, status = 'Chờ phân công' } = data;
            if (!student_code || !name) {
                return res.status(400).json({ error: 'Mã số sinh viên và Họ tên sinh viên là bắt buộc' });
            }

            const [existingCode] = await pool.query(
                'SELECT id FROM students WHERE student_code = ? AND is_deleted = 0',
                [student_code]
            );
            if (existingCode.length > 0) {
                return res.status(400).json({ error: 'Mã số sinh viên đã tồn tại trong hệ thống' });
            }

            const [result] = await pool.query(
                `INSERT INTO students (student_code, name, major, class, gpa, status, faculty_id, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [student_code, name, major || null, className || null, gpa || null, status, facultyId]
            );
            return res.json({ success: true, insertId: result.insertId });
        }

        if (actionType === 'create_activity') {
            const { title, person_in_charge, status = 'Đề xuất', enterprise_id } = data;
            if (!title) return res.status(400).json({ error: 'Tên hoạt động là bắt buộc' });

            const finalEnterpriseId = enterprise_id || null;
            if (!finalEnterpriseId) {
                return res.status(400).json({ error: 'Vui lòng chọn doanh nghiệp liên kết cho hoạt động' });
            }

            const [existingActivity] = await pool.query(
                'SELECT id FROM activities WHERE title = ? AND enterprise_id = ? AND is_deleted = 0',
                [title, finalEnterpriseId]
            );
            if (existingActivity.length > 0) {
                return res.status(400).json({ error: 'Hoạt động này đã tồn tại cho doanh nghiệp' });
            }

            const [result] = await pool.query(
                `INSERT INTO activities (enterprise_id, title, person_in_charge, status, faculty_id, created_at) 
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [finalEnterpriseId, title, person_in_charge || null, status, facultyId]
            );
            return res.json({ success: true, insertId: result.insertId });
        }

        return res.status(400).json({ error: `Hành động '${actionType}' không hợp lệ` });
    } catch (error) {
        console.error('Confirm insert error:', error.message);
        res.status(500).json({ error: `Lỗi khi lưu dữ liệu: ${error.message}` });
    }
};
