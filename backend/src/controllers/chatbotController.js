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
};

// ---- SYSTEM PROMPT ----
const SYSTEM_PROMPT = `Bạn là **VLU Assistant** - trợ lý AI thông minh của hệ thống quản lý liên kết doanh nghiệp Trường Đại học Văn Lang (VLU).

Nhiệm vụ của bạn:
- Trả lời câu hỏi về doanh nghiệp, sinh viên thực tập, hoạt động hợp tác, MOU, báo cáo
- Sử dụng các tool được cung cấp để truy vấn dữ liệu thực tế từ hệ thống
- Trả lời bằng tiếng Việt, ngắn gọn và thân thiện, dùng emoji phù hợp
- Luôn hướng dẫn người dùng đến trang phù hợp nếu họ muốn xem thêm chi tiết

Các trang trong hệ thống: /dashboard, /enterprises, /activities, /students, /kanban, /calendar, /mous, /reports/students, /reports/activities, /settings`;

// ---- MAIN CHAT HANDLER ----
exports.chat = async (req, res) => {
    try {
        const { message, history = [] } = req.body;
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

        // Dùng generateContent với full contents array — stable hơn startChat + tools trong SDK v0.24
        const contents = [
            ...validHistory,
            { role: 'user', parts: [{ text: message }] },
        ];

        let result = await model.generateContent({ contents });
        let response = result.response;

        // Vòng lặp xử lý Function Calling
        let functionCalls = response.functionCalls?.() ?? [];

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
        res.json({ reply });

    } catch (error) {
        console.error('Chatbot error:', error.message);
        console.error('Chatbot error details:', JSON.stringify(error?.errorDetails ?? error?.status ?? '', null, 2));
        res.json({ reply: `❌ Lỗi: ${error.message}` });
    }
};
