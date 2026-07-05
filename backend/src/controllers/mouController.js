const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Font paths (Times New Roman TTF - ho tro tieng Viet Unicode)
const FONTS = {
    regular: path.join(__dirname, '../fonts/times.ttf'),
    bold: path.join(__dirname, '../fonts/timesbd.ttf'),
    italic: path.join(__dirname, '../fonts/timesi.ttf'),
    boldItalic: path.join(__dirname, '../fonts/timesbi.ttf'),
};

// ==================== CRUD ====================

exports.getAll = async (req, res) => {
    try {
        let query = `
            SELECT m.*, e.name as enterprise_name, d.name as executing_unit_name, a.title as activity_title, f.name as faculty_name
            FROM mous m
            JOIN enterprises e ON m.enterprise_id = e.id
            LEFT JOIN departments d ON m.executing_unit_id = d.id
            LEFT JOIN activities a ON m.activity_id = a.id
            LEFT JOIN faculties f ON m.faculty_id = f.id
            WHERE m.is_deleted = ?
        `;
        const showDeleted = req.query.is_deleted === '1' || req.query.is_deleted === 'true';
        let params = [showDeleted ? 1 : 0];
        
        if (req.user.role !== 'ADMIN') {
            query += ' AND m.faculty_id = ?';
            params.push(req.user.faculty_id);
        } else if (req.query.faculty_id) {
            query += ' AND m.faculty_id = ?';
            params.push(req.query.faculty_id);
        }

        if (req.query.enterprise_id) {
            query += ' AND m.enterprise_id = ?';
            params.push(req.query.enterprise_id);
        }

        query += ' ORDER BY m.created_at DESC';
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*
            FROM mous m
            WHERE m.id = ? AND m.is_deleted = 0`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        const mou = rows[0];
        if (req.user.role !== 'ADMIN' && mou.faculty_id !== req.user.faculty_id) {
            return res.status(403).json({ message: 'Access denied to this MOU' });
        }
        res.status(200).json(mou);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { mou_code, enterprise_id, signing_date, end_date, partner_contact, org_type, country,
            collaboration_scope, executing_unit_id, vlu_contact, tasks_ay24_25,
            next_steps, past_activities, related_data, working_dir, activity_id, file_url } = req.body;

        let { faculty_id } = req.body;

        if (mou_code) {
            const [existingMou] = await pool.query(
                'SELECT id FROM mous WHERE mou_code = ? AND is_deleted = 0',
                [mou_code]
            );
            if (existingMou.length > 0) {
                return res.status(400).json({ message: 'Mã MOU đã tồn tại trong hệ thống.' });
            }
        }

        const [ents] = await pool.query('SELECT faculty_id FROM enterprises WHERE id = ?', [enterprise_id]);
        if (ents.length === 0) {
            return res.status(400).json({ message: 'Enterprise not found' });
        }

        if (req.user.role !== 'ADMIN') {
            if (ents[0].faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ message: 'Enterprise does not belong to your faculty' });
            }
            faculty_id = req.user.faculty_id;
        } else {
            // Admin role: fallback to enterprise's faculty_id if none provided
            if (!faculty_id) {
                faculty_id = ents[0].faculty_id;
            }
        }

        const [result] = await pool.query(
            `INSERT INTO mous (mou_code, enterprise_id, signing_date, end_date, expiry_email_sent, partner_contact, org_type, country,
                collaboration_scope, executing_unit_id, vlu_contact, tasks_ay24_25,
                next_steps, past_activities, related_data, working_dir, activity_id, file_url, faculty_id)
             VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [mou_code, enterprise_id, signing_date || null, end_date || null, partner_contact, org_type, country,
                collaboration_scope, executing_unit_id || null, vlu_contact, tasks_ay24_25,
                next_steps, past_activities, related_data, working_dir, activity_id || null, file_url || null, faculty_id]
        );
        const mouId = result.insertId;

        // Log creation
        const [newMou] = await pool.query('SELECT * FROM mous WHERE id = ?', [mouId]);
        const historyHelper = require('../utils/historyHelper');
        await historyHelper.logCreate(pool, {
            entityType: 'MOU',
            entityId: mouId,
            entityName: mou_code,
            facultyId: newMou[0].faculty_id,
            changedBy: req.user.id,
            newValue: { mou: newMou[0] }
        });

        res.status(201).json({ id: mouId, message: 'Created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { mou_code, enterprise_id, signing_date, end_date, partner_contact, org_type, country,
            collaboration_scope, executing_unit_id, vlu_contact, tasks_ay24_25,
            next_steps, past_activities, related_data, working_dir, activity_id, file_url } = req.body;

        let { faculty_id } = req.body;

        const [oldMou] = await pool.query('SELECT * FROM mous WHERE id = ?', [id]);
        if (oldMou.length === 0) {
            return res.status(404).json({ message: 'MOU not found' });
        }

        if (mou_code) {
            const [existingMou] = await pool.query(
                'SELECT id FROM mous WHERE mou_code = ? AND id != ? AND is_deleted = 0',
                [mou_code, id]
            );
            if (existingMou.length > 0) {
                return res.status(400).json({ message: 'Mã MOU đã tồn tại trong hệ thống.' });
            }
        }

        const [ents] = await pool.query('SELECT faculty_id FROM enterprises WHERE id = ?', [enterprise_id]);
        if (ents.length === 0) {
            return res.status(400).json({ message: 'Enterprise not found' });
        }

        if (req.user.role !== 'ADMIN') {
            if (oldMou[0].faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ message: 'Access denied to this MOU' });
            }
            if (ents[0].faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ message: 'New enterprise does not belong to your faculty' });
            }
            faculty_id = req.user.faculty_id;
        } else {
            // Admin: fallback to existing faculty_id if none provided
            if (!faculty_id) {
                faculty_id = oldMou[0].faculty_id;
            }
        }

        const oldValue = { mou: oldMou[0] };

        let expiryEmailSent = oldMou[0].expiry_email_sent;
        if (end_date !== oldMou[0].end_date) {
            expiryEmailSent = 0;
        }

        await pool.query(
            `UPDATE mous SET mou_code=?, enterprise_id=?, signing_date=?, end_date=?, expiry_email_sent=?, partner_contact=?,
                org_type=?, country=?, collaboration_scope=?, executing_unit_id=?, vlu_contact=?,
                tasks_ay24_25=?, next_steps=?, past_activities=?, related_data=?, working_dir=?, activity_id=?, file_url=?, faculty_id=?
             WHERE id=?`,
            [mou_code, enterprise_id, signing_date || null, end_date || null, expiryEmailSent, partner_contact, org_type, country,
                collaboration_scope, executing_unit_id || null, vlu_contact, tasks_ay24_25,
                next_steps, past_activities, related_data, working_dir, activity_id || null, file_url || null, faculty_id, id]
        );

        // Fetch new values for logging
        const [newMou] = await pool.query('SELECT * FROM mous WHERE id = ?', [id]);
        const newValue = { mou: newMou[0] };

        const historyHelper = require('../utils/historyHelper');
        await historyHelper.logUpdate(pool, {
            entityType: 'MOU',
            entityId: id,
            entityName: mou_code,
            facultyId: newMou[0].faculty_id,
            changedBy: req.user.id,
            oldValue,
            newValue
        });

        res.status(200).json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await pool.query(`
            SELECT m.faculty_id, m.mou_code, m.is_deleted
            FROM mous m 
            WHERE m.id = ?`, [id]);

        if (existing.length === 0) {
            return res.status(404).json({ message: 'MOU not found' });
        }

        if (req.user.role !== 'ADMIN' && existing[0].faculty_id !== req.user.faculty_id) {
            return res.status(403).json({ message: 'Access denied to this MOU' });
        }

        if (existing[0].is_deleted === 1) {
            return res.status(400).json({ message: 'MOU này đã được xóa trước đó.' });
        }

        const [mouRows] = await pool.query('SELECT * FROM mous WHERE id = ?', [id]);
        const oldValue = { mou: mouRows[0] };

        // Soft delete
        await pool.query('UPDATE mous SET is_deleted = 1 WHERE id = ?', [id]);

        const historyHelper = require('../utils/historyHelper');
        await historyHelper.logDelete(pool, {
            entityType: 'MOU',
            entityId: id,
            entityName: existing[0].mou_code,
            facultyId: existing[0].faculty_id,
            changedBy: req.user.id,
            oldValue
        });

        res.status(200).json({ message: 'Deleted successfully (soft delete)' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Shared helper function to render beautiful MOU PDF
function renderMouPdf(doc, mou) {
    const s = (v) => v || '';
    const signingDate = mou.signing_date
        ? new Date(mou.signing_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '__/__/____';
    const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Register Times New Roman fonts
    doc.registerFont('R', FONTS.regular);
    doc.registerFont('B', FONTS.bold);
    doc.registerFont('I', FONTS.italic);
    doc.registerFont('BI', FONTS.boldItalic);

    const PW = doc.page.width;
    const ML = 54;
    const MR = PW - 54;
    const contentWidth = MR - ML; // 487.28

    // --- Page Header ---
    // Col 1: VLU Info (left aligned)
    doc.font('B').fontSize(10).fillColor('#1a3c6e');
    doc.text('TRƯỜNG ĐẠI HỌC VĂN LANG', ML, 54, { width: 220, align: 'center' });
    doc.font('R').fontSize(9).fillColor('#555555');
    doc.text('Đơn vị thực hiện: ' + (s(mou.executing_unit_name) || 'Phòng QHDN'), ML, 70, { width: 220, align: 'center' });

    // Col 2: National Header (right aligned)
    doc.font('B').fontSize(10).fillColor('#111111');
    doc.text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', 280, 54, { width: 260, align: 'center' });
    doc.font('B').fontSize(10);
    doc.text('Độc lập - Tự do - Hạnh phúc', 280, 70, { width: 260, align: 'center' });
    
    // Draw a small line under national header
    doc.moveTo(360, 84).lineTo(460, 84).strokeColor('#333333').lineWidth(1).stroke();

    // Space
    doc.moveDown(2);

    // --- Title ---
    const startY = 110;
    doc.font('B').fontSize(16).fillColor('#1a3c6e');
    doc.text('BIÊN BẢN GHI NHỚ HỢP TÁC (MOU)', ML, startY, { width: contentWidth, align: 'center' });
    doc.font('BI').fontSize(11).fillColor('#555555');
    doc.text('(MEMORANDUM OF UNDERSTANDING)', ML, startY + 22, { width: contentWidth, align: 'center' });
    doc.font('I').fontSize(10).fillColor('#111111');
    doc.text('Số / Code: ' + mou.mou_code, ML, startY + 38, { width: contentWidth, align: 'center' });

    doc.moveDown(1.5);

    // --- Introduction ---
    doc.font('I').fontSize(10.5).fillColor('#333333');
    doc.text('- Căn cứ vào kế hoạch hợp tác và định hướng phát triển của hai đơn vị;\n- Nhằm phát huy thế mạnh của mỗi bên trong công tác đào tạo, nghiên cứu khoa học và phát triển nguồn nhân lực chất lượng cao.', { align: 'justify', lineGap: 3 });
    doc.moveDown(0.5);
    doc.font('R').fontSize(11).fillColor('#111111');
    doc.text(`Hôm nay, ngày ${signingDate}, tại Trường Đại học Văn Lang, các bên gồm có:`, { lineGap: 3 });
    doc.moveDown(0.5);

    // --- Section I: Partners ---
    doc.font('B').fontSize(12).fillColor('#1a3c6e').text('I. THÔNG TIN CÁC BÊN THAM GIA', { underline: true });
    doc.moveDown(0.5);

    // Ben A Box
    doc.rect(ML, doc.y, contentWidth, 75).fill('#f9fafb').strokeColor('#1a3c6e').lineWidth(0.5).stroke();
    let boxY = doc.y + 8;
    doc.font('B').fontSize(10.5).fillColor('#1a3c6e').text('BÊN A: TRƯỜNG ĐẠI HỌC VĂN LANG (VLU)', ML + 10, boxY);
    doc.font('R').fontSize(10).fillColor('#333333');
    doc.text('• Địa chỉ: 69/68 Đặng Thùy Trâm, P.13, Q.Bình Thạnh, TP. Hồ Chí Minh', ML + 15, boxY + 18);
    doc.text('• Đại diện liên hệ: ' + (s(mou.vlu_contact) || 'Phòng Quan hệ Doanh nghiệp'), ML + 15, boxY + 32);
    doc.text('• Bộ phận thực hiện: ' + (s(mou.executing_unit_name) || 'Phòng QHDN'), ML + 15, boxY + 46);

    doc.y = boxY + 75;
    doc.moveDown(0.5);

    // Ben B Box
    const entAddress = [mou.building_street, mou.district, mou.province, mou.address_country || mou.country].filter(Boolean).join(', ') || 'Chưa cập nhật';
    doc.rect(ML, doc.y, contentWidth, 105).fill('#fcfdff').strokeColor('#b84000').lineWidth(0.5).stroke();
    boxY = doc.y + 8;
    doc.font('B').fontSize(10.5).fillColor('#b84000').text('BÊN B: ' + s(mou.enterprise_name).toUpperCase(), ML + 10, boxY);
    doc.font('R').fontSize(10).fillColor('#333333');
    doc.text('• Địa chỉ: ' + entAddress, ML + 15, boxY + 18, { width: contentWidth - 30 });
    doc.text('• Người đại diện: ' + s(mou.title) + ' ' + (s(mou.full_name) || 'Chưa cập nhật') + (mou.rep_role ? ` (Chức vụ: ${mou.rep_role})` : ''), ML + 15, boxY + 44);
    doc.text('• Điện thoại: ' + (s(mou.phone) || '---') + '   |   Email: ' + (s(mou.rep_email) || '---'), ML + 15, boxY + 58);
    doc.text('• Mã số thuế: ' + (s(mou.tax_code) || '---') + '   |   Liên hệ đối tác: ' + (s(mou.partner_contact) || '---'), ML + 15, boxY + 72);
    doc.text('• Quốc gia: ' + (s(mou.country) || 'Việt Nam') + '   |   Loại tổ chức: ' + (s(mou.org_type) || 'Doanh nghiệp'), ML + 15, boxY + 86);

    doc.y = boxY + 105;
    doc.moveDown(1);

    // --- Section II: Scope ---
    doc.font('B').fontSize(12).fillColor('#1a3c6e').text('II. PHẠM VI HỢP TÁC', { underline: true });
    doc.moveDown(0.4);
    doc.font('R').fontSize(10.5).fillColor('#111111');
    doc.text(s(mou.collaboration_scope) || 'Hai bên cùng thống nhất hợp tác trên tinh thần tự nguyện, hỗ trợ lẫn nhau trong các hoạt động liên kết đào tạo, kiến tập, thực tập cho sinh viên, ngày hội tuyển dụng, hội thảo khoa học và chia sẻ nguồn nhân lực.', { align: 'justify', lineGap: 3 });
    doc.moveDown(0.8);

    // --- Section III: Tasks ---
    doc.font('B').fontSize(12).fillColor('#1a3c6e').text('III. NỘI DUNG TRIỂN KHAI CHI TIẾT (NIÊN KHÓA 2024 - 2025)', { underline: true });
    doc.moveDown(0.4);
    doc.font('R').fontSize(10.5).fillColor('#111111');
    doc.text(s(mou.tasks_ay24_25) || 'Các nội dung chi tiết sẽ được cụ thể hóa bằng các hợp đồng, kế hoạch thực hiện riêng cho từng học kỳ hoặc từng hoạt động cụ thể.', { align: 'justify', lineGap: 3 });
    doc.moveDown(0.8);

    // --- Section IV: Next Steps ---
    doc.font('B').fontSize(12).fillColor('#1a3c6e').text('IV. KẾ HOẠCH TIẾP THEO', { underline: true });
    doc.moveDown(0.4);
    doc.font('R').fontSize(10.5).fillColor('#111111');
    doc.text(s(mou.next_steps) || 'Hai bên sẽ chỉ định các đầu mối phụ trách để thường xuyên trao đổi, lên lịch họp chi tiết nhằm hiện thực hóa các nội dung đã ghi nhớ.', { align: 'justify', lineGap: 3 });
    doc.moveDown(0.8);

    // --- Section V: History & Others ---
    if (mou.past_activities || mou.related_data || mou.working_dir) {
        doc.font('B').fontSize(12).fillColor('#1a3c6e').text('V. CÁC THÔNG TIN BỔ SUNG & LỊCH SỬ HỢP TÁC', { underline: true });
        doc.moveDown(0.4);
        doc.font('R').fontSize(10.5).fillColor('#111111');
        
        if (mou.past_activities) {
            doc.font('B').fontSize(10).fillColor('#333333').text('1. Lịch sử / Các hoạt động đã triển khai trước đó:');
            doc.font('R').fontSize(10).fillColor('#111111').text(mou.past_activities, { align: 'justify', lineGap: 2 });
            doc.moveDown(0.4);
        }
        if (mou.related_data) {
            doc.font('B').fontSize(10).fillColor('#333333').text('2. Các ghi chú / Dữ liệu liên quan khác:');
            doc.font('R').fontSize(10).fillColor('#111111').text(mou.related_data, { align: 'justify', lineGap: 2 });
            doc.moveDown(0.4);
        }
        if (mou.working_dir) {
            doc.font('B').fontSize(10).fillColor('#333333').text('3. Thư mục lưu trữ làm việc của dự án:');
            doc.font('R').fontSize(10).fillColor('#111111').text(mou.working_dir, { lineGap: 2 });
            doc.moveDown(0.4);
        }
        doc.moveDown(0.4);
    }

    // Check if we need a new page for signatures (if close to bottom)
    if (doc.y > 640) {
        doc.addPage();
    } else {
        doc.moveDown(1.5);
    }

    // --- Signatures ---
    const sy = doc.y;
    doc.font('I').fontSize(10).fillColor('#555555')
        .text('TP. Hồ Chí Minh, ngày ' + today, ML, sy, { align: 'center', width: contentWidth });
    doc.moveDown(0.5);

    const sigY = doc.y;
    doc.font('B').fontSize(11).fillColor('#1a3c6e')
        .text('ĐẠI DIỆN BÊN A', ML, sigY, { width: contentWidth / 2, align: 'center' })
        .text('ĐẠI DIỆN BÊN B', ML + contentWidth / 2, sigY, { width: contentWidth / 2, align: 'center' });
    
    doc.font('R').fontSize(9).fillColor('#555555')
        .text('TRƯỜNG ĐẠI HỌC VĂN LANG', ML, sigY + 15, { width: contentWidth / 2, align: 'center' })
        .text(s(mou.enterprise_name).toUpperCase(), ML + contentWidth / 2, sigY + 15, { width: contentWidth / 2, align: 'center' });

    doc.font('I').fontSize(8.5).fillColor('#888888')
        .text('(Ký tên, ghi rõ họ tên và đóng dấu)', ML, sigY + 95, { width: contentWidth / 2, align: 'center' })
        .text('(Ký tên, ghi rõ họ tên và đóng dấu)', ML + contentWidth / 2, sigY + 95, { width: contentWidth / 2, align: 'center' });

    // --- Page Number / Footer on every page ---
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        // Header line & logo or text
        doc.moveTo(ML, 95).lineTo(MR, 95).strokeColor('#dddddd').lineWidth(0.5).stroke();
        
        // Footer line & text
        doc.moveTo(ML, doc.page.height - 40).lineTo(MR, doc.page.height - 40).strokeColor('#dddddd').lineWidth(0.5).stroke();
        doc.font('I').fontSize(8).fillColor('#777777')
            .text(`Biên bản ghi nhớ hợp tác số: ${mou.mou_code} | Trường Đại học Văn Lang © ${new Date().getFullYear()}`, ML, doc.page.height - 32, { width: contentWidth })
            .text(`Trang ${i + 1} / ${pages.count}`, ML, doc.page.height - 32, { width: contentWidth, align: 'right' });
    }
}

exports.generatePdf = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT m.*, e.name as enterprise_name, e.tax_code,
                   d.name as executing_unit_name,
                   ea.building_street, ea.district, ea.province, ea.country as address_country,
                   er.title, er.full_name, er.phone, er.email as rep_email, er.role as rep_role
            FROM mous m
            JOIN enterprises e ON m.enterprise_id = e.id
            LEFT JOIN departments d ON m.executing_unit_id = d.id
            LEFT JOIN enterprise_addresses ea ON ea.enterprise_id = e.id AND ea.is_main = 1
            LEFT JOIN enterprise_representatives er ON er.enterprise_id = e.id AND er.is_primary = 1
            WHERE m.id = ?
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ message: 'MOU không tồn tại' });

        const mou = rows[0];
        if (req.user.role !== 'ADMIN' && mou.faculty_id !== req.user.faculty_id) {
            return res.status(403).json({ message: 'Không có quyền truy cập MOU này' });
        }

        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 60, bottom: 60, left: 54, right: 54 },
            bufferPages: true,
            info: { Title: 'Bien Ban Ghi Nho Hoptac VLU', Author: 'Van Lang University' }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="MOU_${mou.mou_code.replace(/\//g, '-')}.pdf"`);
        doc.pipe(res);

        renderMouPdf(doc, mou);

        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        if (!res.headersSent) res.status(500).json({ message: error.message });
    }
};

// ==================== AI SCAN DOCUMENT ====================

exports.scanDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Vui long upload file anh hoac PDF' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ message: 'GEMINI_API_KEY chua duoc cau hinh' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

        const fileBuffer = fs.readFileSync(req.file.path);
        const base64Data = fileBuffer.toString('base64');

        let mimeType = req.file.mimetype;
        if (!mimeType || mimeType === 'application/octet-stream') {
            const ext = path.extname(req.file.originalname).toLowerCase();
            const mm = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf' };
            mimeType = mm[ext] || 'image/jpeg';
        }

        const prompt = `Ban la chuyen gia trich xuat thong tin tu tai lieu hop dong/bien ban ghi nho (MOU).
Doc tai lieu nay va trich xuat cac truong sau. Tra ve KET QUA DUY NHAT dang JSON hop le (khong them text ngoai JSON):

{
  "mou_code": "Ma bien ban (VD: MOU-2024-001, neu khong co hay tao dua theo context)",
  "enterprise_name": "Ten day du cua cong ty/to chuc doi tac (Ben B)",
  "signing_date": "Ngay ky dinh dang YYYY-MM-DD (neu co, neu khong de null)",
  "partner_contact": "Ten nguoi dai dien/lien he cua doi tac",
  "org_type": "Loai to chuc (VD: Tap doan, Cong ty TNHH, Truong dai hoc...)",
  "country": "Quoc gia cua doi tac",
  "collaboration_scope": "Noi dung/pham vi hop tac chinh (tom tat ngan gon)",
  "vlu_contact": "Ten nguoi dai dien cua Truong Dai hoc Van Lang (Ben A)",
  "tasks_ay24_25": "Cac nhiem vu/cong tac da/se trien khai",
  "next_steps": "Buoc tiep theo hoac ke hoach sap toi",
  "past_activities": "Cac hoat dong da thuc hien truoc do (neu co)",
  "related_data": "So lieu lien quan (neu co)",
  "tax_code": "Ma so thue cua doi tac (neu co)",
  "activity_name": "Ten hoat dong/su kien/chuong trinh (activity) lien quan den MOU nay (neu co)",
  "executing_unit": "Ten khoa hoac don vi trien khai thuc hien phia Truong Dai hoc Van Lang (VD: Khoa Cong nghe thong tin, Phong QHDN...)"
}

Neu khong tim thay thong tin, de null. Tra ve JSON thuan tuy khong co markdown.`;

        const result = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType } }]);
        const responseText = result.response.text();

        let extractedData;
        try {
            const clean = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            extractedData = JSON.parse(clean);
        } catch {
            const m = responseText.match(/\{[\s\S]*\}/);
            if (m) extractedData = JSON.parse(m[0]);
            else throw new Error('AI khong tra ve JSON hop le');
        }

        let enterprise_id = null;
        let activity_id = null;
        let matched_activity = null;
        let executing_unit_id = null;
        let matched_executing_unit = null;

        // 1. Try to find enterprise first
        if (extractedData.enterprise_name) {
            const words = extractedData.enterprise_name.toLowerCase().split(' ').slice(0, 3).join('%');
            let query = `SELECT id, name FROM enterprises WHERE LOWER(name) LIKE ?`;
            let params = [`%${words}%`];
            if (req.user.role !== 'ADMIN') {
                query += ' AND faculty_id = ?';
                params.push(req.user.faculty_id);
            }
            query += ' LIMIT 1';
            const [ents] = await pool.query(query, params);
            if (ents.length > 0) {
                enterprise_id = ents[0].id;
                extractedData.matched_enterprise = ents[0].name;
            }
        }

        // 2. Try to find activity
        if (extractedData.activity_name) {
            const actWords = extractedData.activity_name.toLowerCase().split(' ').slice(0, 3).join('%');
            
            // First attempt: search within the matched enterprise
            if (enterprise_id) {
                const [acts] = await pool.query(
                    `SELECT id, title FROM activities WHERE enterprise_id = ? AND LOWER(title) LIKE ? LIMIT 1`,
                    [enterprise_id, `%${actWords}%`]
                );
                if (acts.length > 0) {
                    activity_id = acts[0].id;
                    matched_activity = acts[0].title;
                }
            }

            // Second attempt: search globally (if not found in first attempt or no enterprise matched)
            if (!activity_id) {
                let actQuery = `SELECT id, title, enterprise_id FROM activities WHERE LOWER(title) LIKE ?`;
                let actParams = [`%${actWords}%`];
                if (req.user.role !== 'ADMIN') {
                    actQuery += ' AND faculty_id = ?';
                    actParams.push(req.user.faculty_id);
                }
                actQuery += ' LIMIT 1';
                const [acts] = await pool.query(actQuery, actParams);
                if (acts.length > 0) {
                    activity_id = acts[0].id;
                    matched_activity = acts[0].title;
                    
                    // If enterprise wasn't matched, resolve it from the found activity
                    if (!enterprise_id && acts[0].enterprise_id) {
                        const [ents] = await pool.query(`SELECT id, name FROM enterprises WHERE id = ?`, [acts[0].enterprise_id]);
                        if (ents.length > 0) {
                            enterprise_id = ents[0].id;
                            extractedData.matched_enterprise = ents[0].name;
                        }
                    }
                }
            }
        }

        // 3. Try to find executing unit (department)
        if (extractedData.executing_unit) {
            const depWords = extractedData.executing_unit.toLowerCase().split(' ').slice(0, 3).join('%');
            let depQuery = `SELECT id, name FROM departments WHERE LOWER(name) LIKE ?`;
            let depParams = [`%${depWords}%`];
            if (req.user.role !== 'ADMIN') {
                depQuery += ' AND faculty_id = ?';
                depParams.push(req.user.faculty_id);
            }
            depQuery += ' LIMIT 1';
            const [deps] = await pool.query(depQuery, depParams);
            if (deps.length > 0) {
                executing_unit_id = deps[0].id;
                matched_executing_unit = deps[0].name;
            }
        }

        // NOTE: Firebase upload is intentionally NOT done here.
        // The client will show a confirmation dialog and call /upload-scan-file separately.
        // We save the local temp file path so the client can send it back for upload.
        // Since we can't keep temp files across requests reliably, we return a flag:
        res.status(200).json({ success: true, extracted: { ...extractedData, enterprise_id, activity_id, matched_activity, executing_unit_id, matched_executing_unit, file_url: null, needsUploadConfirm: true } });

        // Clean up temp file
        try { fs.unlinkSync(req.file.path); } catch (e) { }

    } catch (error) {
        if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch (e) { } }
        console.error('AI Scan error:', error);
        res.status(500).json({ success: false, message: 'Loi phan tich tai lieu: ' + error.message });
    }
};

// ==================== UPLOAD FILE TO FIREBASE (Manual) ====================

/**
 * POST /mous/:id/upload-file
 * Upload a user-provided file to Firebase and update MOU.file_url.
 */
exports.uploadFile = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file để tải lên.' });

        // Access check
        const [rows] = await pool.query(`SELECT m.faculty_id FROM mous m WHERE m.id = ? AND m.is_deleted = 0`, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'MOU không tồn tại.' });
        if (req.user.role !== 'ADMIN' && rows[0].faculty_id !== req.user.faculty_id) {
            return res.status(403).json({ message: 'Không có quyền truy cập MOU này.' });
        }

        const bucket = require('../config/firebase');
        if (!bucket) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
            return res.status(400).json({ message: 'Firebase Storage chưa được cấu hình.' });
        }

        let mimeType = req.file.mimetype;
        if (!mimeType || mimeType === 'application/octet-stream') {
            const ext = path.extname(req.file.originalname).toLowerCase();
            const mm = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf' };
            mimeType = mm[ext] || 'application/octet-stream';
        }

        const destFileName = `mous/${Date.now()}_${path.basename(req.file.originalname)}`;
        const uploadRes = await bucket.upload(req.file.path, {
            destination: destFileName,
            metadata: { contentType: mimeType }
        });
        const file = uploadRes[0];
        const encodedPath = encodeURIComponent(file.name);
        const file_url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

        // Update DB
        await pool.query('UPDATE mous SET file_url = ? WHERE id = ?', [file_url, id]);

        try { fs.unlinkSync(req.file.path); } catch (e) {}

        res.status(200).json({ success: true, file_url, message: 'Đã tải lên và liên kết tài liệu thành công!' });
    } catch (error) {
        if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
        console.error('Upload file error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ==================== UPLOAD SCAN FILE TO FIREBASE (After AI confirm) ====================

/**
 * POST /mous/upload-scan-file
 * Called when user has confirmed they want to upload the scanned file to Firebase.
 * The file is re-uploaded by the frontend. Returns the Firebase URL for the client
 * to fill into the form (file_url field).
 */
exports.uploadScanFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file để tải lên.' });

        const bucket = require('../config/firebase');
        if (!bucket) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
            return res.status(400).json({ message: 'Firebase Storage chưa được cấu hình.' });
        }

        let mimeType = req.file.mimetype;
        if (!mimeType || mimeType === 'application/octet-stream') {
            const ext = path.extname(req.file.originalname).toLowerCase();
            const mm = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf' };
            mimeType = mm[ext] || 'application/octet-stream';
        }

        const destFileName = `mous/${Date.now()}_${path.basename(req.file.originalname)}`;
        const uploadRes = await bucket.upload(req.file.path, {
            destination: destFileName,
            metadata: { contentType: mimeType }
        });
        const file = uploadRes[0];
        const encodedPath = encodeURIComponent(file.name);
        const file_url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

        try { fs.unlinkSync(req.file.path); } catch (e) {}

        res.status(200).json({ success: true, file_url, message: 'Đã tải lên Firebase thành công!' });
    } catch (error) {
        if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
        console.error('Upload scan file error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ==================== GENERATE PDF AND UPLOAD TO FIREBASE ====================

/**
 * POST /mous/:id/generate-pdf-upload
 * Generates a PDF from MOU data and uploads it to Firebase Storage,
 * then updates mous.file_url in DB.
 */
exports.generatePdfAndUpload = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT m.*, e.name as enterprise_name, e.tax_code,
                   d.name as executing_unit_name,
                   ea.building_street, ea.district, ea.province, ea.country as address_country,
                   er.title, er.full_name, er.phone, er.email as rep_email, er.role as rep_role
            FROM mous m
            JOIN enterprises e ON m.enterprise_id = e.id
            LEFT JOIN departments d ON m.executing_unit_id = d.id
            LEFT JOIN enterprise_addresses ea ON ea.enterprise_id = e.id AND ea.is_main = 1
            LEFT JOIN enterprise_representatives er ON er.enterprise_id = e.id AND er.is_primary = 1
            WHERE m.id = ?
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ message: 'MOU không tồn tại.' });
        const mou = rows[0];
        if (req.user.role !== 'ADMIN' && mou.faculty_id !== req.user.faculty_id) {
            return res.status(403).json({ message: 'Không có quyền truy cập MOU này.' });
        }

        const bucket = require('../config/firebase');
        if (!bucket) return res.status(400).json({ message: 'Firebase Storage chưa được cấu hình.' });

        // Generate PDF in memory (stream to buffer)
        const PDFDocument = require('pdfkit');
        const { PassThrough } = require('stream');

        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 60, bottom: 60, left: 54, right: 54 },
            bufferPages: true,
            info: { Title: 'Bien Ban Ghi Nho Hoptac VLU', Author: 'Van Lang University' }
        });

        // Collect PDF bytes
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        const pdfEndPromise = new Promise((resolve, reject) => {
            doc.on('end', resolve);
            doc.on('error', reject);
        });

        renderMouPdf(doc, mou);

        doc.end();
        await pdfEndPromise;

        const pdfBuffer = Buffer.concat(chunks);

        // Upload buffer to Firebase
        const tmpPath = path.join(require('os').tmpdir(), `mou-${id}-${Date.now()}.pdf`);
        fs.writeFileSync(tmpPath, pdfBuffer);

        const destFileName = `mous/${Date.now()}_MOU_${mou.mou_code.replace(/[\/\\:*?"<>|]/g, '-')}.pdf`;
        const uploadRes = await bucket.upload(tmpPath, {
            destination: destFileName,
            metadata: { contentType: 'application/pdf' }
        });
        const uploadedFile = uploadRes[0];
        const encodedPath = encodeURIComponent(uploadedFile.name);
        const file_url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

        try { fs.unlinkSync(tmpPath); } catch (e) {}

        // Update DB
        await pool.query('UPDATE mous SET file_url = ? WHERE id = ?', [file_url, id]);

        res.status(200).json({ success: true, file_url, message: 'Đã tạo PDF và tải lên Firebase thành công!' });
    } catch (error) {
        console.error('Generate PDF upload error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.restore = async (req, res) => {
    try {
        const id = req.params.id;
        const [logRows] = await pool.query(
            'SELECT id FROM action_history WHERE entity_type = "MOU" AND entity_id = ? AND action_type = "DELETE" ORDER BY changed_at DESC LIMIT 1',
            [id]
        );
        if (logRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lịch sử xóa để khôi phục MOU này.' });
        }
        req.params.id = logRows[0].id;
        const historyController = require('./historyController');
        return historyController.restore(req, res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEmailLogs = async (req, res) => {
    try {
        const logDir = path.join(__dirname, '..', '..', 'uploads', 'email-logs');
        if (!fs.existsSync(logDir)) {
            return res.status(200).json([]);
        }
        const files = fs.readdirSync(logDir).filter(f => f.endsWith('.json'));
        const logs = [];
        for (const file of files) {
            const filePath = path.join(logDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            try {
                const email = JSON.parse(content);
                // Admins see all, managers see emails sent to them
                if (req.user.role === 'ADMIN' || email.to === req.user.email) {
                    logs.push(email);
                }
            } catch (e) {
                console.error('Error parsing email log:', file, e.message);
            }
        }
        logs.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.triggerExpiryCheck = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'FACULTY_MANAGER') {
            return res.status(403).json({ message: 'Không có quyền thực hiện hành động này.' });
        }
        const { checkMOUExpirations } = require('../utils/scheduler');
        const count = await checkMOUExpirations();
        res.status(200).json({ message: 'Kích hoạt kiểm tra hoàn tất!', count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
