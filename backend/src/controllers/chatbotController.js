const pool = require('../config/db');

// ====================================================
// VLU Assistant - Chatbot nội bộ (KHÔNG cần API key)
// Hoạt động hoàn toàn offline, truy vấn trực tiếp DB
// ====================================================

// Hàm tìm kiếm intent từ tin nhắn người dùng
function detectIntent(message) {
    const msg = message.toLowerCase().trim();

    // Chào hỏi
    if (/^(chào|hi|hello|xin chào|alo|hey)/.test(msg)) return 'greeting';
    if (/^(cảm ơn|thanks|thank)/.test(msg)) return 'thanks';
    if (/^(giúp|help|hướng dẫn|làm sao|cách)/.test(msg)) return 'help';

    // DN
    if (msg.includes('doanh nghiệp') || msg.includes('công ty') || msg.includes('dn ')) return 'enterprise';
    if (msg.includes('sinh viên') || msg.includes('sv ') || msg.includes('thực tập sinh')) return 'student';
    if (msg.includes('hoạt động') || msg.includes('hợp tác') || msg.includes('workshop') || msg.includes('tuyển dụng')) return 'activity';

    // Stats
    if (msg.includes('thống kê') || msg.includes('số liệu') || msg.includes('báo cáo') || msg.includes('report')) return 'stats';
    if (msg.includes('bao nhiêu') || msg.includes('tổng') || msg.includes('đếm') || msg.includes('count')) return 'count';

    // Tìm kiếm cụ thể
    if (msg.includes('tìm') || msg.includes('search') || msg.includes('tìm kiếm')) return 'search';

    // Chức năng web
    if (msg.includes('trang') || msg.includes('page') || msg.includes('menu') || msg.includes('chức năng') || msg.includes('ở đâu')) return 'navigation';

    // Trạng thái
    if (msg.includes('đang thực tập')) return 'student_active';
    if (msg.includes('hoàn thành')) return 'student_completed';
    if (msg.includes('chờ phân công') || msg.includes('đang chờ')) return 'student_pending';

    return 'unknown';
}

// Hàm trích tên từ câu hỏi (ví dụ: "tìm công ty FPT" -> "FPT")
function extractKeyword(message) {
    const patterns = [
        /tìm (?:công ty|doanh nghiệp|sv|sinh viên|hoạt động)\s+(.+)/i,
        /(?:công ty|doanh nghiệp)\s+(.+?)(?:\s+có|\s+đang|\?|$)/i,
        /(?:sinh viên|sv)\s+(.+?)(?:\s+có|\s+đang|\?|$)/i,
        /tìm\s+(.+)/i,
    ];
    for (const p of patterns) {
        const match = message.match(p);
        if (match) return match[1].trim();
    }
    return null;
}

// Xử lý từng intent
const handlers = {
    greeting: async () => ({
        reply: 'Xin chào! 👋 Tôi là **VLU Assistant**, trợ lý nội bộ của hệ thống quản lý liên kết doanh nghiệp.\n\nBạn có thể hỏi tôi về:\n• 📊 Số liệu doanh nghiệp, sinh viên\n• 🏢 Danh sách doanh nghiệp đang hợp tác\n• 👨‍🎓 Sinh viên đang thực tập\n• 📋 Hoạt động hợp tác gần nhất\n• 🧭 Hướng dẫn sử dụng hệ thống'
    }),

    thanks: async () => ({
        reply: 'Không có gì ạ! 😊 Nếu cần hỏi thêm gì, cứ nhắn cho tôi nhé!'
    }),

    help: async () => ({
        reply: '🧭 **Hướng dẫn sử dụng hệ thống:**\n\n• **/dashboard** – Trang tổng quan\n• **/enterprises** – Quản lý doanh nghiệp\n• **/activities** – Quản lý hoạt động hợp tác\n• **/students** – Quản lý sinh viên thực tập\n• **/reports/students** – Báo cáo SV theo công ty\n• **/reports/activities** – Báo cáo hoạt động\n• **/settings** – Cài đặt hệ thống\n\nBạn có thể hỏi tôi "có bao nhiêu sinh viên?" hoặc "danh sách doanh nghiệp" để xem số liệu!'
    }),

    navigation: async () => ({
        reply: '🧭 **Các trang chính trong hệ thống:**\n\n• 🏠 Trang chủ → **/dashboard**\n• 🏢 Quản lý DN → **/enterprises**\n• 📋 Hoạt động → **/activities**\n• 👨‍🎓 Sinh viên → **/students**\n• 📊 Báo cáo SV → **/reports/students**\n• 📈 Báo cáo HĐ → **/reports/activities**\n• ⚙️ Cài đặt → **/settings**'
    }),

    enterprise: async (msg) => {
        const keyword = extractKeyword(msg);
        let rows;
        if (keyword) {
            [rows] = await pool.query(
                `SELECT e.name, e.status, 
                 (SELECT COUNT(*) FROM students s WHERE s.enterprise_id = e.id) as sv
                 FROM enterprises e WHERE e.name LIKE ? ORDER BY e.id DESC LIMIT 5`,
                [`%${keyword}%`]
            );
        } else {
            [rows] = await pool.query(
                `SELECT e.name, e.status, 
                 (SELECT COUNT(*) FROM students s WHERE s.enterprise_id = e.id) as sv
                 FROM enterprises e ORDER BY e.id DESC LIMIT 8`
            );
        }
        if (rows.length === 0) return { reply: `🔍 Không tìm thấy doanh nghiệp${keyword ? ` "${keyword}"` : ''}. Bạn có thể xem tất cả tại **/enterprises**.` };

        let reply = `🏢 **Danh sách doanh nghiệp${keyword ? ` tìm thấy "${keyword}"` : ''}** (${rows.length}):\n\n`;
        rows.forEach((r, i) => {
            const icon = r.status === 'active' ? '🟢' : r.status === 'potential' ? '🔵' : '🟡';
            reply += `${i + 1}. ${icon} **${r.name}**\n   └ ${r.status} · ${r.sv} sinh viên\n`;
        });
        reply += `\n📄 Xem chi tiết tại **/enterprises**`;
        return { reply };
    },

    student: async (msg) => {
        const keyword = extractKeyword(msg);
        let rows;
        if (keyword) {
            [rows] = await pool.query(
                `SELECT s.student_code, s.name, s.major, s.status, s.gpa, e.name as en
                 FROM students s LEFT JOIN enterprises e ON s.enterprise_id = e.id
                 WHERE s.name LIKE ? OR s.student_code LIKE ? ORDER BY s.created_at DESC LIMIT 5`,
                [`%${keyword}%`, `%${keyword}%`]
            );
        } else {
            [rows] = await pool.query(
                `SELECT s.student_code, s.name, s.major, s.status, s.gpa, e.name as en
                 FROM students s LEFT JOIN enterprises e ON s.enterprise_id = e.id
                 ORDER BY s.created_at DESC LIMIT 8`
            );
        }
        if (rows.length === 0) return { reply: `🔍 Không tìm thấy sinh viên${keyword ? ` "${keyword}"` : ''}. Xem tất cả tại **/students**.` };

        let reply = `👨‍🎓 **Danh sách sinh viên${keyword ? ` "${keyword}"` : ''}** (${rows.length}):\n\n`;
        rows.forEach((r, i) => {
            const icon = r.status === 'interning' ? '🟢' : r.status === 'completed' ? '✅' : '⏳';
            reply += `${i + 1}. ${icon} **${r.name}** (${r.student_code})\n   └ ${r.major || 'N/A'} · ${r.en || 'Chưa phân công'} · GPA: ${r.gpa || 'N/A'}\n`;
        });
        reply += `\n📄 Xem chi tiết tại **/students**`;
        return { reply };
    },

    student_active: async () => {
        const [rows] = await pool.query(
            `SELECT s.name, s.student_code, e.name as en FROM students s 
             LEFT JOIN enterprises e ON s.enterprise_id = e.id WHERE s.status = 'interning'`
        );
        let reply = `🟢 **${rows.length} sinh viên đang thực tập:**\n\n`;
        rows.forEach((r, i) => {
            reply += `${i + 1}. **${r.name}** (${r.student_code}) → ${r.en || 'N/A'}\n`;
        });
        return { reply };
    },

    student_completed: async () => {
        const [rows] = await pool.query(
            `SELECT s.name, s.student_code, e.name as en FROM students s 
             LEFT JOIN enterprises e ON s.enterprise_id = e.id WHERE s.status = 'completed'`
        );
        let reply = `✅ **${rows.length} sinh viên đã hoàn thành:**\n\n`;
        rows.forEach((r, i) => {
            reply += `${i + 1}. **${r.name}** (${r.student_code}) → ${r.en || 'N/A'}\n`;
        });
        return { reply };
    },

    student_pending: async () => {
        const [rows] = await pool.query(
            `SELECT s.name, s.student_code, s.major FROM students s WHERE s.status = 'pending'`
        );
        let reply = `⏳ **${rows.length} sinh viên đang chờ phân công:**\n\n`;
        rows.forEach((r, i) => {
            reply += `${i + 1}. **${r.name}** (${r.student_code}) – ${r.major || 'N/A'}\n`;
        });
        reply += `\nĐể phân công, vào **/students** → Chỉnh sửa → Chọn công ty.`;
        return { reply };
    },

    activity: async () => {
        const [rows] = await pool.query(
            `SELECT a.title, a.status, e.name as en, t.name as type_name
             FROM activities a 
             JOIN enterprises e ON a.enterprise_id = e.id
             LEFT JOIN act_types t ON a.type_id = t.id
             ORDER BY a.created_at DESC LIMIT 8`
        );
        if (rows.length === 0) return { reply: '📋 Chưa có hoạt động nào. Tạo mới tại **/activities**.' };

        let reply = `📋 **Hoạt động hợp tác gần nhất** (${rows.length}):\n\n`;
        rows.forEach((r, i) => {
            const icon = r.status === 'active' ? '🟢' : r.status === 'completed' ? '✅' : '🟡';
            reply += `${i + 1}. ${icon} **${r.title}**\n   └ ${r.en} · ${r.type_name || 'N/A'} · ${r.status}\n`;
        });
        reply += `\n📄 Xem chi tiết tại **/activities**`;
        return { reply };
    },

    stats: async () => {
        const [ent] = await pool.query('SELECT COUNT(*) as c FROM enterprises');
        const [stu] = await pool.query('SELECT COUNT(*) as c FROM students');
        const [act] = await pool.query('SELECT COUNT(*) as c FROM activities');
        const [activeS] = await pool.query("SELECT COUNT(*) as c FROM students WHERE status='interning'");
        const [activeE] = await pool.query("SELECT COUNT(*) as c FROM enterprises WHERE status='active'");
        const [activeA] = await pool.query("SELECT COUNT(*) as c FROM activities WHERE status='active'");
        const [avgGpa] = await pool.query("SELECT ROUND(AVG(gpa),2) as a FROM students WHERE gpa IS NOT NULL");
        const [byType] = await pool.query("SELECT t.name, COUNT(a.id) as c FROM activities a JOIN act_types t ON a.type_id = t.id GROUP BY t.name ORDER BY c DESC");

        let reply = `📊 **Thống kê tổng quan hệ thống:**\n\n`;
        reply += `🏢 Doanh nghiệp: **${ent[0].c}** (Đang hợp tác: ${activeE[0].c})\n`;
        reply += `👨‍🎓 Sinh viên: **${stu[0].c}** (Đang thực tập: ${activeS[0].c})\n`;
        reply += `📋 Hoạt động: **${act[0].c}** (Đang hoạt động: ${activeA[0].c})\n`;
        reply += `🎯 GPA trung bình: **${avgGpa[0].a || 'N/A'}**\n`;

        if (byType.length > 0) {
            reply += `\n📈 **Hoạt động theo loại hình:**\n`;
            byType.forEach(r => { reply += `• ${r.name}: ${r.c}\n`; });
        }
        reply += `\n📊 Xem biểu đồ chi tiết tại **/reports/students** hoặc **/reports/activities**`;
        return { reply };
    },

    count: async (msg) => {
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('doanh nghiệp') || lowerMsg.includes('công ty')) {
            const [r] = await pool.query('SELECT COUNT(*) as c FROM enterprises');
            const [a] = await pool.query("SELECT COUNT(*) as c FROM enterprises WHERE status='active'");
            return { reply: `🏢 Hệ thống hiện có **${r[0].c} doanh nghiệp**, trong đó **${a[0].c}** đang hợp tác. Xem chi tiết tại **/enterprises**.` };
        }
        if (lowerMsg.includes('sinh viên') || lowerMsg.includes('sv')) {
            const [r] = await pool.query('SELECT COUNT(*) as c FROM students');
            const [a] = await pool.query("SELECT COUNT(*) as c FROM students WHERE status='interning'");
            return { reply: `👨‍🎓 Hệ thống có **${r[0].c} sinh viên**, trong đó **${a[0].c}** đang thực tập. Xem chi tiết tại **/students**.` };
        }
        if (lowerMsg.includes('hoạt động')) {
            const [r] = await pool.query('SELECT COUNT(*) as c FROM activities');
            const [a] = await pool.query("SELECT COUNT(*) as c FROM activities WHERE status='active'");
            return { reply: `📋 Hệ thống có **${r[0].c} hoạt động**, trong đó **${a[0].c}** đang hoạt động. Xem chi tiết tại **/activities**.` };
        }
        const [e] = await pool.query('SELECT COUNT(*) as c FROM enterprises');
        const [s] = await pool.query('SELECT COUNT(*) as c FROM students');
        const [a] = await pool.query('SELECT COUNT(*) as c FROM activities');
        return { reply: `📊 Tổng quan: **${e[0].c}** doanh nghiệp · **${s[0].c}** sinh viên · **${a[0].c}** hoạt động.` };
    },

    search: async (msg) => {
        const keyword = extractKeyword(msg);
        if (!keyword) return { reply: '🔍 Vui lòng cho biết bạn muốn tìm gì? VD: "tìm công ty FPT" hoặc "tìm sinh viên Nguyễn"' };

        const [ent] = await pool.query('SELECT name, status FROM enterprises WHERE name LIKE ? LIMIT 3', [`%${keyword}%`]);
        const [stu] = await pool.query('SELECT name, student_code, status FROM students WHERE name LIKE ? OR student_code LIKE ? LIMIT 3', [`%${keyword}%`, `%${keyword}%`]);
        const [act] = await pool.query('SELECT title, status FROM activities WHERE title LIKE ? LIMIT 3', [`%${keyword}%`]);

        let reply = `🔍 **Kết quả tìm kiếm "${keyword}":**\n\n`;
        if (ent.length > 0) { reply += `🏢 **Doanh nghiệp:**\n`; ent.forEach(r => { reply += `• ${r.name} (${r.status})\n`; }); reply += '\n'; }
        if (stu.length > 0) { reply += `👨‍🎓 **Sinh viên:**\n`; stu.forEach(r => { reply += `• ${r.name} - ${r.student_code} (${r.status})\n`; }); reply += '\n'; }
        if (act.length > 0) { reply += `📋 **Hoạt động:**\n`; act.forEach(r => { reply += `• ${r.title} (${r.status})\n`; }); }
        if (ent.length === 0 && stu.length === 0 && act.length === 0) { reply = `🔍 Không tìm thấy kết quả nào cho "${keyword}".`; }
        return { reply };
    },

    unknown: async () => ({
        reply: '🤔 Tôi chưa hiểu câu hỏi của bạn. Bạn có thể thử:\n\n• "Có bao nhiêu sinh viên?"\n• "Danh sách doanh nghiệp"\n• "Hoạt động hợp tác gần nhất"\n• "Thống kê hệ thống"\n• "Tìm công ty FPT"\n• "Hướng dẫn sử dụng"'
    }),
};

exports.chat = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) return res.status(400).json({ reply: 'Vui lòng nhập câu hỏi.' });

        const intent = detectIntent(message);
        const handler = handlers[intent] || handlers.unknown;
        const result = await handler(message);

        res.json(result);
    } catch (error) {
        console.error('Chatbot error:', error.message);
        res.json({ reply: '❌ Đã xảy ra lỗi. Vui lòng thử lại.' });
    }
};
