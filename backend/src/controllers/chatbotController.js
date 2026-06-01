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
                description: 'Lấy danh sách doanh nghiệp đang liên kết với VLU. Có thể tìm theo tên hoặc lọc theo trạng thái.',
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
                    },
                    required: [],
                },
            },
            {
                name: 'get_student_list',
                description: 'Lấy danh sách sinh viên thực tập. Có thể tìm theo tên/MSSV hoặc lọc theo trạng thái.',
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
                    },
                    required: [],
                },
            },
            {
                name: 'get_activity_list',
                description: 'Lấy danh sách hoạt động hợp tác giữa VLU và doanh nghiệp. Có thể tìm theo tên hoặc lọc theo trạng thái.',
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
                description: 'Lấy danh sách biên bản ghi nhớ (MOU) đã ký kết giữa VLU và doanh nghiệp.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        keyword: {
                            type: 'STRING',
                            description: 'Tìm theo tên doanh nghiệp hoặc mã MOU (tùy chọn)',
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
                description: 'Thống kê số lượng sinh viên thực tập phân theo từng doanh nghiệp và ngành học.',
                parameters: {
                    type: 'OBJECT',
                    properties: {},
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
                description: 'Yêu cầu thêm sinh viên thực tập mới vào hệ thống. AI trích xuất mã số sinh viên, họ tên, ngành học, lớp, GPA, trạng thái.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        student_code: { type: 'STRING', description: 'Mã số sinh viên (MSSV)' },
                        name: { type: 'STRING', description: 'Họ và tên sinh viên' },
                        major: { type: 'STRING', description: 'Ngành học (tùy chọn)' },
                        class: { type: 'STRING', description: 'Lớp học (tùy chọn)' },
                        gpa: { type: 'NUMBER', description: 'Điểm trung bình tích lũy GPA (tùy chọn)' },
                        status: { type: 'STRING', description: 'Trạng thái: Chờ phân công | Đang thực tập | Hoàn thành | Đã nghỉ (tùy chọn)' }
                    },
                    required: ['student_code', 'name']
                }
            },
            {
                name: 'create_activity',
                description: 'Yêu cầu thêm hoạt động liên kết doanh nghiệp mới vào hệ thống. AI trích xuất tên hoạt động, người phụ trách, trạng thái.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        title: { type: 'STRING', description: 'Tên hoạt động liên kết' },
                        person_in_charge: { type: 'STRING', description: 'Người phụ trách phía nhà trường (tùy chọn)' },
                        status: { type: 'STRING', description: 'Trạng thái: Đề xuất | Phê duyệt nội bộ | Đã triển khai | Đã kết thúc (tùy chọn)' }
                    },
                    required: ['title']
                }
            },
        ],
    },
];

// ---- TOOL IMPLEMENTATIONS ----

async function get_enterprise_list({ keyword, status } = {}) {
    let query = `
        SELECT e.name, e.status, e.tax_code, s.name as scale_name,
               rep.full_name as rep_name, rep.phone as rep_phone,
               (SELECT COUNT(*) FROM students sv WHERE sv.enterprise_id = e.id) as student_count
        FROM enterprises e
        LEFT JOIN scales s ON e.scale_id = s.id
        LEFT JOIN enterprise_representatives rep ON rep.enterprise_id = e.id AND rep.is_primary = 1
        WHERE 1=1`;
    const params = [];

    if (keyword) {
        query += ' AND e.name LIKE ?';
        params.push(`%${keyword}%`);
    }
    if (status) {
        query += ' AND e.status = ?';
        params.push(status);
    }
    query += ' ORDER BY e.created_at DESC LIMIT 10';

    const [rows] = await pool.query(query, params);
    return rows;
}

async function get_student_list({ keyword, status } = {}) {
    let query = `
        SELECT s.student_code, s.name, s.major, s.class, s.status, s.gpa,
               e.name as enterprise_name, a.title as activity_title
        FROM students s
        LEFT JOIN enterprises e ON s.enterprise_id = e.id
        LEFT JOIN activities a ON s.activity_id = a.id
        WHERE 1=1`;
    const params = [];

    if (keyword) {
        query += ' AND (s.name LIKE ? OR s.student_code LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
        query += ' AND s.status = ?';
        params.push(status);
    }
    query += ' ORDER BY s.created_at DESC LIMIT 10';

    const [rows] = await pool.query(query, params);
    return rows;
}

async function get_activity_list({ keyword, status } = {}) {
    let query = `
        SELECT a.title, a.status, a.start_date, a.end_date, a.person_in_charge,
               e.name as enterprise_name,
               GROUP_CONCAT(DISTINCT act.name ORDER BY act.name SEPARATOR ', ') as type_names,
               (SELECT COUNT(*) FROM students sv WHERE sv.activity_id = a.id) as student_count
        FROM activities a
        JOIN enterprises e ON a.enterprise_id = e.id
        LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
        LEFT JOIN act_types act ON act.id = atm.type_id
        WHERE 1=1`;
    const params = [];

    if (keyword) {
        query += ' AND a.title LIKE ?';
        params.push(`%${keyword}%`);
    }
    if (status) {
        query += ' AND a.status = ?';
        params.push(status);
    }
    query += ' GROUP BY a.id ORDER BY a.created_at DESC LIMIT 10';

    const [rows] = await pool.query(query, params);
    return rows;
}

async function get_dashboard_stats() {
    const [[{ total: totalEnterprises }]] = await pool.query("SELECT COUNT(*) as total FROM enterprises");
    const [[{ total: collaborating }]] = await pool.query("SELECT COUNT(*) as total FROM enterprises WHERE status = 'Đang triển khai'");
    const [[{ total: totalStudents }]] = await pool.query("SELECT COUNT(*) as total FROM students");
    const [[{ total: interning }]] = await pool.query("SELECT COUNT(*) as total FROM students WHERE status = 'Đang thực tập'");
    const [[{ total: totalActivities }]] = await pool.query("SELECT COUNT(*) as total FROM activities");
    const [[{ total: activeActivities }]] = await pool.query("SELECT COUNT(*) as total FROM activities WHERE status = 'Đã triển khai'");
    const [[{ avgGpa }]] = await pool.query("SELECT ROUND(AVG(gpa), 2) as avgGpa FROM students WHERE gpa IS NOT NULL");

    const [byType] = await pool.query(`
        SELECT act.name as type_name, COUNT(DISTINCT a.id) as count
        FROM activities a
        LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
        LEFT JOIN act_types act ON act.id = atm.type_id
        GROUP BY act.name ORDER BY count DESC
    `);

    const [byStatus] = await pool.query(`
        SELECT status, COUNT(*) as count FROM enterprises GROUP BY status ORDER BY count DESC
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

async function get_mou_list({ keyword } = {}) {
    let query = `
        SELECT m.mou_code, m.signing_date, m.org_type, m.country,
               m.vlu_contact, m.partner_contact, m.collaboration_scope,
               e.name as enterprise_name, d.name as executing_unit
        FROM mous m
        JOIN enterprises e ON m.enterprise_id = e.id
        LEFT JOIN departments d ON m.executing_unit_id = d.id
        WHERE 1=1`;
    const params = [];

    if (keyword) {
        query += ' AND (e.name LIKE ? OR m.mou_code LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
    }
    query += ' ORDER BY m.created_at DESC LIMIT 10';

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
        WHERE a.start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
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
            WHERE e.name LIKE ?
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
        GROUP BY e.id, e.name
        HAVING avg_overall >= 3
        ORDER BY avg_overall DESC, rating_count DESC
        LIMIT 10
    `);
    return rows;
}

async function get_student_stats_by_enterprise() {
    const [byEnterprise] = await pool.query(`
        SELECT e.name as enterprise,
               COUNT(s.id) as total,
               SUM(CASE WHEN s.status = 'Đang thực tập' THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN s.status = 'Hoàn thành' THEN 1 ELSE 0 END) as completed,
               ROUND(AVG(s.gpa), 2) as avg_gpa
        FROM students s
        JOIN enterprises e ON s.enterprise_id = e.id
        WHERE s.enterprise_id IS NOT NULL
        GROUP BY e.id, e.name
        ORDER BY total DESC
        LIMIT 10
    `);

    const [byMajor] = await pool.query(`
        SELECT major, COUNT(*) as count, ROUND(AVG(gpa), 2) as avg_gpa
        FROM students
        WHERE major IS NOT NULL
        GROUP BY major
        ORDER BY count DESC
        LIMIT 8
    `);

    return { byEnterprise, byMajor };
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
    create_enterprise,
    create_student,
    create_activity,
};

// ---- SYSTEM PROMPT ----
const SYSTEM_PROMPT = `Bạn là **VLU Assistant** - trợ lý AI thông minh của hệ thống quản lý liên kết doanh nghiệp Trường Đại học Văn Lang (VLU).

Nhiệm vụ của bạn:
- Trả lời câu hỏi về doanh nghiệp, sinh viên thực tập, hoạt động hợp tác, MOU, báo cáo thống kê
- Sử dụng các tool được cung cấp để truy vấn dữ liệu thực tế từ hệ thống
- Thực hiện so sánh, phân tích chuyên sâu các dữ liệu và chỉ số khi được yêu cầu (ví dụ: đối chiếu GPA sinh viên giữa các công ty, tìm kiếm ngành học có tỉ lệ liên kết cao nhất, phân tích biểu đồ, phân tích cấu trúc doanh nghiệp).
- Khi người dùng muốn THÊM hoặc NHẬP mới một doanh nghiệp, sinh viên, hoặc hoạt động liên kết, bạn hãy gọi tool create_enterprise, create_student hoặc create_activity tương ứng để thu thập và chuẩn bị dữ liệu.
- Trả lời bằng tiếng Việt, ngắn gọn, cấu trúc rõ ràng (sử dụng markdown bold, bullet points), thân thiện và dùng emoji phù hợp
- Luôn hướng dẫn người dùng đến trang phù hợp nếu họ muốn xem thêm chi tiết

Quy tắc BẢO MẬT & NGHIỆP VỤ nghiêm ngặt:
1. Bạn KHÔNG được trực tiếp thực hiện các câu lệnh ghi SQL (INSERT, UPDATE, DELETE). Đối với các tác vụ thêm dữ liệu mới, bạn phải gọi các tool tạo yêu cầu (create_...) để hệ thống hiển thị form xác nhận (modal) cho người dùng tự duyệt ở frontend.
2. Từ chối trả lời một cách lịch sự bất kỳ câu hỏi nào yêu cầu thông tin nhạy cảm của hệ thống như mật khẩu, mã băm (hash), token bí mật, cấu hình máy chủ hoặc tài khoản đăng nhập của người dùng.
3. Không trả lời các câu hỏi ngoài phạm vi nghiệp vụ quản lý liên kết doanh nghiệp của VLU.
4. Nếu người dùng cung cấp hình ảnh (ví dụ: ảnh bảng dữ liệu, ảnh sơ đồ, ảnh chụp văn bản hoặc ảnh báo cáo), hãy tập trung phân tích kỹ nội dung trong ảnh và kết hợp với dữ liệu hệ thống để trả lời chính xác nhất.

Các trang trong hệ thống: /dashboard, /enterprises, /activities, /students, /kanban, /calendar, /mous, /reports/students, /reports/activities, /settings`;

// ---- MAIN CHAT HANDLER ----
exports.chat = async (req, res) => {
    try {
        const { message, history = [], image } = req.body; // image: { data: 'base64...', mimeType: 'image/png' }
        if (!message || !message.trim()) {
            return res.status(400).json({ reply: 'Vui lòng nhập câu hỏi.' });
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: SYSTEM_PROMPT,
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
