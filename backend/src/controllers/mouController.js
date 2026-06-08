const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Font paths (Roboto TTF - ho tro tieng Viet Unicode)
const FONTS = {
    regular: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
    bold: path.join(__dirname, '../fonts/Roboto-Bold.ttf'),
    italic: path.join(__dirname, '../fonts/Roboto-Italic.ttf'),
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
        const { mou_code, enterprise_id, signing_date, partner_contact, org_type, country,
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
            `INSERT INTO mous (mou_code, enterprise_id, signing_date, partner_contact, org_type, country,
                collaboration_scope, executing_unit_id, vlu_contact, tasks_ay24_25,
                next_steps, past_activities, related_data, working_dir, activity_id, file_url, faculty_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [mou_code, enterprise_id, signing_date || null, partner_contact, org_type, country,
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
        const { mou_code, enterprise_id, signing_date, partner_contact, org_type, country,
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

        await pool.query(
            `UPDATE mous SET mou_code=?, enterprise_id=?, signing_date=?, partner_contact=?,
                org_type=?, country=?, collaboration_scope=?, executing_unit_id=?, vlu_contact=?,
                tasks_ay24_25=?, next_steps=?, past_activities=?, related_data=?, working_dir=?, activity_id=?, file_url=?, faculty_id=?
             WHERE id=?`,
            [mou_code, enterprise_id, signing_date || null, partner_contact, org_type, country,
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

// ==================== EXPORT PDF (Roboto TTF - Unicode safe) ====================

exports.generatePdf = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT m.*, e.name as enterprise_name, e.tax_code,
                   d.name as executing_unit_name,
                   ea.building_street, ea.district, ea.province,
                   er.title, er.full_name, er.phone
            FROM mous m
            JOIN enterprises e ON m.enterprise_id = e.id
            LEFT JOIN departments d ON m.executing_unit_id = d.id
            LEFT JOIN enterprise_addresses ea ON ea.enterprise_id = e.id AND ea.is_main = 1
            LEFT JOIN enterprise_representatives er ON er.enterprise_id = e.id AND er.is_primary = 1
            WHERE m.id = ?
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ message: 'MOU not found' });

        const mou = rows[0];
        if (req.user.role !== 'ADMIN' && mou.faculty_id !== req.user.faculty_id) {
            return res.status(403).json({ message: 'Access denied to this MOU' });
        }
        const s = (v) => v || '';

        const signingDate = mou.signing_date
            ? new Date(mou.signing_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '__/__/____';
        const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 60, bottom: 60, left: 70, right: 70 },
            info: { Title: 'Bien Ban Ghi Nho', Author: 'Van Lang University' }
        });

        // Register Roboto for Vietnamese Unicode support
        doc.registerFont('R', FONTS.regular);
        doc.registerFont('B', FONTS.bold);
        doc.registerFont('I', FONTS.italic);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="MOU_${mou.mou_code.replace(/\//g, '-')}.pdf"`);
        doc.pipe(res);

        const PW = doc.page.width;  // 595
        const ML = 70, MR = 525;

        const line = (y, color = '#bbbbbb', w = 0.8) =>
            doc.moveTo(ML, y).lineTo(MR, y).strokeColor(color).lineWidth(w).stroke();

        // ===== HEADER =====
        doc.rect(0, 0, PW, 112).fill('#1a3c6e');

        // Ben trai: VLU
        doc.font('B').fontSize(8).fillColor('#ffffff')
            .text('CONG HOA XA HOI CHU NGHIA VIET NAM', ML, 16, { width: 210, align: 'center' });
        doc.font('R').fontSize(7.5).fillColor('#99ccff')
            .text('Doc lap - Tu do - Hanh phuc', ML, 28, { width: 210, align: 'center' });
        doc.font('B').fontSize(9.5).fillColor('#ffffff')
            .text('TRUONG DAI HOC VAN LANG', ML, 45, { width: 210, align: 'center' });
        doc.font('R').fontSize(7).fillColor('#99ccff')
            .text('69/68 Dang Thuy Tram, P.13, Q.Binh Thanh, TP.HCM', ML, 59, { width: 210, align: 'center' });

        // Ben phai: Tieu de
        doc.font('B').fontSize(21).fillColor('#ffffff')
            .text('BIEN BAN GHI NHO', 295, 18, { width: 230, align: 'center' });
        doc.font('R').fontSize(9).fillColor('#FFD700')
            .text('MEMORANDUM OF UNDERSTANDING', 295, 48, { width: 230, align: 'center' });
        doc.font('B').fontSize(9).fillColor('#99ccff')
            .text('Ma so: ' + mou.mou_code, 295, 65, { width: 230, align: 'center' });

        // ===== INFO BOX =====
        doc.roundedRect(ML, 120, 455, 50, 5).fill('#EEF4FF')
            .roundedRect(ML, 120, 455, 50, 5).strokeColor('#1a3c6e').lineWidth(1).stroke();

        doc.font('B').fontSize(8.5).fillColor('#1a3c6e')
            .text('Ngay ky ket:', 85, 130)
            .text('Loai to chuc:', 250, 130)
            .text('Quoc gia:', 410, 130);
        doc.font('R').fontSize(9).fillColor('#111111')
            .text(signingDate, 85, 143)
            .text(s(mou.org_type) || 'Doanh nghiep', 250, 143)
            .text(s(mou.country) || 'Viet Nam', 410, 143);

        // ===== SECTION I =====
        doc.font('B').fontSize(11).fillColor('#1a3c6e').text('I. CAC BEN THAM GIA', ML, 182);
        line(197, '#1a3c6e', 1);

        // Box Ben A
        doc.roundedRect(ML, 203, 215, 92, 4).fill('#F0F8FF');
        doc.font('B').fontSize(9).fillColor('#1a3c6e').text('BEN A (TRUONG DH VAN LANG)', 80, 210, { width: 195 });
        doc.font('R').fontSize(8.5).fillColor('#333333')
            .text('Dia chi: 69/68 Dang Thuy Tram, P.13,', 80, 226, { width: 195 })
            .text('Q.Binh Thanh, TP. Ho Chi Minh', 80, 238, { width: 195 })
            .text('Dau moi: ' + (s(mou.vlu_contact) || 'Ban QHDN'), 80, 256, { width: 195 })
            .text('Don vi: ' + (s(mou.executing_unit_name) || 'Phong QHDN'), 80, 270, { width: 195 });

        // Box Ben B
        const entUpper = s(mou.enterprise_name).toUpperCase();
        const addr = [mou.building_street, mou.district, mou.province].filter(Boolean).join(', ') || 'Viet Nam';
        doc.roundedRect(300, 203, 225, 92, 4).fill('#FFF8F0');
        doc.font('B').fontSize(9).fillColor('#b84000').text('BEN B (' + entUpper + ')', 310, 210, { width: 205 });
        doc.font('R').fontSize(8.5).fillColor('#333333')
            .text('Dia chi: ' + addr, 310, 226, { width: 205 })
            .text('MST: ' + (s(mou.tax_code) || '---'), 310, 250, { width: 205 })
            .text('Dai dien: ' + s(mou.title) + ' ' + (s(mou.full_name) || '---'), 310, 263, { width: 205 })
            .text('Dien thoai: ' + (s(mou.phone) || '---'), 310, 276, { width: 205 });

        // ===== SECTION II =====
        let cy = 310;
        doc.font('B').fontSize(11).fillColor('#1a3c6e').text('II. PHAM VI HOP TAC', ML, cy);
        line(cy + 15, '#1a3c6e', 1);
        cy += 22;
        doc.font('R').fontSize(9.5).fillColor('#222222')
            .text(s(mou.collaboration_scope) || 'Hai ben hop tac trong dao tao, thuc tap sinh vien, hoi thao chuyen nganh va cac hoat dong hoc thuat khac.',
                ML, cy, { width: 455, align: 'justify', lineGap: 3 });

        // ===== SECTION III =====
        cy = doc.y + 12;
        doc.font('B').fontSize(11).fillColor('#1a3c6e').text('III. NOI DUNG TRIEN KHAI', ML, cy);
        line(cy + 15, '#1a3c6e', 1);
        cy += 22;
        doc.font('R').fontSize(9.5).fillColor('#222222')
            .text(s(mou.tasks_ay24_25) || 'Theo ke hoach duoc hai ben thong nhat trong tung hoc ky.',
                ML, cy, { width: 455, align: 'justify', lineGap: 3 });

        // ===== SECTION IV =====
        cy = doc.y + 12;
        doc.font('B').fontSize(11).fillColor('#1a3c6e').text('IV. KE HOACH TIEP THEO', ML, cy);
        line(cy + 15, '#1a3c6e', 1);
        cy += 22;
        doc.font('R').fontSize(9.5).fillColor('#222222')
            .text(s(mou.next_steps) || 'Hai ben se hop ban cu the de xac dinh lo trinh trien khai.',
                ML, cy, { width: 455, align: 'justify', lineGap: 3 });

        // ===== SIGNATURES =====
        const sy = Math.max(doc.y + 42, 668);
        line(sy - 6, '#1a3c6e', 1);
        doc.font('I').fontSize(8.5).fillColor('#555555')
            .text('TP. Ho Chi Minh, ngay ' + today, ML, sy, { align: 'center', width: 455 });

        doc.font('B').fontSize(10).fillColor('#1a3c6e')
            .text('DAI DIEN BEN A', ML, sy + 14, { width: 200, align: 'center' })
            .text('DAI DIEN BEN B', 295, sy + 14, { width: 200, align: 'center' });
        doc.font('R').fontSize(8.5).fillColor('#555555')
            .text('TRUONG DAI HOC VAN LANG', ML, sy + 27, { width: 200, align: 'center' })
            .text(entUpper, 295, sy + 27, { width: 200, align: 'center' });

        doc.moveTo(90, sy + 95).lineTo(250, sy + 95).strokeColor('#aaa').lineWidth(0.5).stroke();
        doc.moveTo(315, sy + 95).lineTo(475, sy + 95).strokeColor('#aaa').lineWidth(0.5).stroke();
        doc.font('I').fontSize(7.5).fillColor('#999999')
            .text('(Ky, ghi ro ho ten, dong dau)', ML, sy + 99, { width: 200, align: 'center' })
            .text('(Ky, ghi ro ho ten, dong dau)', 295, sy + 99, { width: 200, align: 'center' });

        // ===== FOOTER =====
        doc.rect(0, doc.page.height - 26, PW, 26).fill('#1a3c6e');
        doc.font('R').fontSize(7.5).fillColor('#99ccff')
            .text('Bien ban ghi nho so: ' + mou.mou_code + '  |  Truong Dai hoc Van Lang (c) ' + new Date().getFullYear(),
                0, doc.page.height - 17, { align: 'center', width: PW });

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
  "activity_name": "Ten hoat dong/su kien/chuong trinh (activity) lien quan den MOU nay (neu co)"
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

                // Attempt to match activity if enterprise found
                if (extractedData.activity_name) {
                    const actWords = extractedData.activity_name.toLowerCase().split(' ').slice(0, 3).join('%');
                    const [acts] = await pool.query(`SELECT id, title FROM activities WHERE enterprise_id = ? AND LOWER(title) LIKE ? LIMIT 1`, [enterprise_id, `%${actWords}%`]);
                    if (acts.length > 0) {
                        activity_id = acts[0].id;
                        matched_activity = acts[0].title;
                    }
                }
            }
        }

        // NOTE: Firebase upload is intentionally NOT done here.
        // The client will show a confirmation dialog and call /upload-scan-file separately.
        // We save the local temp file path so the client can send it back for upload.
        // Since we can't keep temp files across requests reliably, we return a flag:
        res.status(200).json({ success: true, extracted: { ...extractedData, enterprise_id, activity_id, matched_activity, file_url: null, needsUploadConfirm: true } });

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
                   ea.building_street, ea.district, ea.province,
                   er.title, er.full_name, er.phone
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

        const s = (v) => v || '';
        const signingDate = mou.signing_date
            ? new Date(mou.signing_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '__/__/____';
        const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 60, bottom: 60, left: 70, right: 70 },
            info: { Title: 'Bien Ban Ghi Nho', Author: 'Van Lang University' }
        });

        doc.registerFont('R', FONTS.regular);
        doc.registerFont('B', FONTS.bold);
        doc.registerFont('I', FONTS.italic);

        // Collect PDF bytes
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        const pdfEndPromise = new Promise((resolve, reject) => {
            doc.on('end', resolve);
            doc.on('error', reject);
        });

        const PW = doc.page.width;
        const ML = 70, MR = 525;
        const line = (y, color = '#bbbbbb', w = 0.8) =>
            doc.moveTo(ML, y).lineTo(MR, y).strokeColor(color).lineWidth(w).stroke();

        doc.rect(0, 0, PW, 112).fill('#1a3c6e');
        doc.font('B').fontSize(8).fillColor('#ffffff')
            .text('CONG HOA XA HOI CHU NGHIA VIET NAM', ML, 16, { width: 210, align: 'center' });
        doc.font('R').fontSize(7.5).fillColor('#99ccff')
            .text('Doc lap - Tu do - Hanh phuc', ML, 28, { width: 210, align: 'center' });
        doc.font('B').fontSize(9.5).fillColor('#ffffff')
            .text('TRUONG DAI HOC VAN LANG', ML, 45, { width: 210, align: 'center' });
        doc.font('R').fontSize(7).fillColor('#99ccff')
            .text('69/68 Dang Thuy Tram, P.13, Q.Binh Thanh, TP.HCM', ML, 59, { width: 210, align: 'center' });
        doc.font('B').fontSize(21).fillColor('#ffffff')
            .text('BIEN BAN GHI NHO', 295, 18, { width: 230, align: 'center' });
        doc.font('R').fontSize(9).fillColor('#FFD700')
            .text('MEMORANDUM OF UNDERSTANDING', 295, 48, { width: 230, align: 'center' });
        doc.font('B').fontSize(9).fillColor('#99ccff')
            .text('Ma so: ' + mou.mou_code, 295, 65, { width: 230, align: 'center' });

        doc.roundedRect(ML, 120, 455, 50, 5).fill('#EEF4FF')
            .roundedRect(ML, 120, 455, 50, 5).strokeColor('#1a3c6e').lineWidth(1).stroke();
        doc.font('B').fontSize(8.5).fillColor('#1a3c6e')
            .text('Ngay ky ket:', 85, 130).text('Loai to chuc:', 250, 130).text('Quoc gia:', 410, 130);
        doc.font('R').fontSize(9).fillColor('#111111')
            .text(signingDate, 85, 143)
            .text(s(mou.org_type) || 'Doanh nghiep', 250, 143)
            .text(s(mou.country) || 'Viet Nam', 410, 143);

        doc.font('B').fontSize(11).fillColor('#1a3c6e').text('I. CAC BEN THAM GIA', ML, 182);
        line(197, '#1a3c6e', 1);
        doc.roundedRect(ML, 203, 215, 92, 4).fill('#F0F8FF');
        doc.font('B').fontSize(9).fillColor('#1a3c6e').text('BEN A (TRUONG DH VAN LANG)', 80, 210, { width: 195 });
        doc.font('R').fontSize(8.5).fillColor('#333333')
            .text('Dia chi: 69/68 Dang Thuy Tram, P.13,', 80, 226, { width: 195 })
            .text('Q.Binh Thanh, TP. Ho Chi Minh', 80, 238, { width: 195 })
            .text('Dau moi: ' + (s(mou.vlu_contact) || 'Ban QHDN'), 80, 256, { width: 195 })
            .text('Don vi: ' + (s(mou.executing_unit_name) || 'Phong QHDN'), 80, 270, { width: 195 });

        const entUpper = s(mou.enterprise_name).toUpperCase();
        const addr = [mou.building_street, mou.district, mou.province].filter(Boolean).join(', ') || 'Viet Nam';
        doc.roundedRect(300, 203, 225, 92, 4).fill('#FFF8F0');
        doc.font('B').fontSize(9).fillColor('#b84000').text('BEN B (' + entUpper + ')', 310, 210, { width: 205 });
        doc.font('R').fontSize(8.5).fillColor('#333333')
            .text('Dia chi: ' + addr, 310, 226, { width: 205 })
            .text('MST: ' + (s(mou.tax_code) || '---'), 310, 250, { width: 205 })
            .text('Dai dien: ' + s(mou.title) + ' ' + (s(mou.full_name) || '---'), 310, 263, { width: 205 })
            .text('Dien thoai: ' + (s(mou.phone) || '---'), 310, 276, { width: 205 });

        let cy = 310;
        doc.font('B').fontSize(11).fillColor('#1a3c6e').text('II. PHAM VI HOP TAC', ML, cy);
        line(cy + 15, '#1a3c6e', 1); cy += 22;
        doc.font('R').fontSize(9.5).fillColor('#222222')
            .text(s(mou.collaboration_scope) || 'Hai ben hop tac trong dao tao, thuc tap sinh vien, hoi thao chuyen nganh va cac hoat dong hoc thuat khac.',
                ML, cy, { width: 455, align: 'justify', lineGap: 3 });

        cy = doc.y + 12;
        doc.font('B').fontSize(11).fillColor('#1a3c6e').text('III. NOI DUNG TRIEN KHAI', ML, cy);
        line(cy + 15, '#1a3c6e', 1); cy += 22;
        doc.font('R').fontSize(9.5).fillColor('#222222')
            .text(s(mou.tasks_ay24_25) || 'Theo ke hoach duoc hai ben thong nhat trong tung hoc ky.',
                ML, cy, { width: 455, align: 'justify', lineGap: 3 });

        cy = doc.y + 12;
        doc.font('B').fontSize(11).fillColor('#1a3c6e').text('IV. KE HOACH TIEP THEO', ML, cy);
        line(cy + 15, '#1a3c6e', 1); cy += 22;
        doc.font('R').fontSize(9.5).fillColor('#222222')
            .text(s(mou.next_steps) || 'Hai ben se hop ban cu the de xac dinh lo trinh trien khai.',
                ML, cy, { width: 455, align: 'justify', lineGap: 3 });

        const sy = Math.max(doc.y + 42, 668);
        line(sy - 6, '#1a3c6e', 1);
        doc.font('I').fontSize(8.5).fillColor('#555555')
            .text('TP. Ho Chi Minh, ngay ' + today, ML, sy, { align: 'center', width: 455 });
        doc.font('B').fontSize(10).fillColor('#1a3c6e')
            .text('DAI DIEN BEN A', ML, sy + 14, { width: 200, align: 'center' })
            .text('DAI DIEN BEN B', 295, sy + 14, { width: 200, align: 'center' });
        doc.font('R').fontSize(8.5).fillColor('#555555')
            .text('TRUONG DAI HOC VAN LANG', ML, sy + 27, { width: 200, align: 'center' })
            .text(entUpper, 295, sy + 27, { width: 200, align: 'center' });
        doc.moveTo(90, sy + 95).lineTo(250, sy + 95).strokeColor('#aaa').lineWidth(0.5).stroke();
        doc.moveTo(315, sy + 95).lineTo(475, sy + 95).strokeColor('#aaa').lineWidth(0.5).stroke();
        doc.font('I').fontSize(7.5).fillColor('#999999')
            .text('(Ky, ghi ro ho ten, dong dau)', ML, sy + 99, { width: 200, align: 'center' })
            .text('(Ky, ghi ro ho ten, dong dau)', 295, sy + 99, { width: 200, align: 'center' });
        doc.rect(0, doc.page.height - 26, PW, 26).fill('#1a3c6e');
        doc.font('R').fontSize(7.5).fillColor('#99ccff')
            .text('Bien ban ghi nho so: ' + mou.mou_code + '  |  Truong Dai hoc Van Lang (c) ' + new Date().getFullYear(),
                0, doc.page.height - 17, { align: 'center', width: PW });

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
            'SELECT id FROM action_history WHERE entity_type = "MOU" AND entity_id = ? AND action_type = "DELETE" ORDER BY created_at DESC LIMIT 1',
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
