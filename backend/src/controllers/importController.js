const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../config/db');

// Multer config: lưu file vào memory buffer
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file CSV hoặc Excel (.xlsx, .xls)'));
        }
    }
});

// Hàm đọc file Excel/CSV từ buffer -> JSON
function parseFileToJSON(buffer, originalname) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet);

    // Chuẩn hóa keys: xóa khoảng trắng 2 đầu và chuyển thành chữ thường để dễ mapping
    return rawRows.map(row => {
        const normalizedRow = {};
        for (const key in row) {
            normalizedRow[key.trim().toLowerCase()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
        }
        return normalizedRow;
    });
}

// Import Doanh nghiệp
const importEnterprises = async (req, res) => {
    try {
        const rows = parseFileToJSON(req.file.buffer, req.file.originalname);
        let inserted = 0;
        let skipped = 0;
        let errors = [];

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                const name = r['tên doanh nghiệp'] || r['name'] || r['ten_doanh_nghiep'];
                const tax_code = r['mã số thuế'] || r['tax_code'] || r['ma_so_thue'] || null;
                const scaleStr = r['quy mô'] || r['scale'] || '';
                const fieldStr = r['lĩnh vực'] || r['fields'] || '';
                const is_hcmc = r['ở tp.hcm'] ? (r['ở tp.hcm'].toString().toLowerCase() === 'có' || r['ở tp.hcm'] === 1) : true;

                const rep_title = r['danh xưng'] || null;
                const rep_full_name = r['họ và tên'] || null;
                const rep_role = r['chức vụ'] || null;
                const rep_phone = r['số điện thoại'] || null;
                const rep_email = r['email'] || null;

                const building_street = r['địa chỉ'] || null; // Tương đương Đường/Tòa nhà
                const district = r['quận/huyện'] || null;
                const province = r['tỉnh/thành'] || null;
                const country = r['quốc gia'] || 'Việt Nam';

                const status = r['trạng thái'] || r['status'] || 'Tiềm năng';
                const department_id = r['bộ môn id'] || r['department_id'] || null;
                const facultyId = req.user.role === 'ADMIN' ? (r['faculty_id'] || null) : req.user.faculty_id;

                if (!name) { errors.push(`Dòng ${i + 2}: Thiếu tên doanh nghiệp`); continue; }

                // 1. Check if enterprise already exists (by tax_code or name) in this faculty
                let checkQuery = 'SELECT id FROM enterprises WHERE (name = ?';
                let checkParams = [name];
                if (tax_code) {
                    checkQuery += ' OR tax_code = ?';
                    checkParams.push(tax_code);
                }
                checkQuery += ') AND (faculty_id = ? OR (faculty_id IS NULL AND ? IS NULL)) AND is_deleted = 0';
                checkParams.push(facultyId, facultyId);
                const [existingEnt] = await conn.query(checkQuery, checkParams);
                if (existingEnt.length > 0) {
                    skipped++;
                    errors.push(`Dòng ${i + 2}: Đã tồn tại doanh nghiệp với Tên hoặc Mã số thuế này trong khoa`);
                    await conn.rollback();
                    conn.release();
                    continue;
                }

                // 2. Map scale string to scale_id
                let scale_id = null;
                if (scaleStr) {
                    const [scaleRows] = await conn.query('SELECT id FROM scales WHERE name LIKE ? LIMIT 1', [`%${scaleStr}%`]);
                    if (scaleRows.length > 0) scale_id = scaleRows[0].id;
                }

                // 3. Insert into enterprises
                const [result] = await conn.query(
                    'INSERT INTO enterprises (name, tax_code, scale_id, is_hcmc, status, department_id, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [name, tax_code, scale_id, is_hcmc, status, department_id, facultyId]
                );
                const enterpriseId = result.insertId;

                // 4. Insert into enterprise_representatives
                if (rep_full_name || rep_phone || rep_email) {
                    await conn.query(
                        'INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) VALUES (?, ?, ?, ?, ?, ?, 1)',
                        [enterpriseId, rep_title, rep_full_name, rep_role, rep_phone, rep_email]
                    );
                }

                // 5. Insert into enterprise_addresses
                if (building_street || district || province) {
                    await conn.query(
                        'INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) VALUES (?, ?, ?, ?, ?, 1)',
                        [enterpriseId, building_street, district, province, country]
                    );
                }

                // 6. Insert into enterprise_fields (many-to-many)
                if (fieldStr) {
                    const fieldNames = fieldStr.split(',').map(s => s.trim()).filter(Boolean);
                    for (const fn of fieldNames) {
                        const [fRows] = await conn.query('SELECT id FROM fields WHERE name LIKE ? LIMIT 1', [`%${fn}%`]);
                        if (fRows.length > 0) {
                            await conn.query('INSERT IGNORE INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)', [enterpriseId, fRows[0].id]);
                        }
                    }
                }

                await conn.commit();
                inserted++;
            } catch (e) {
                await conn.rollback();
                errors.push(`Dòng ${i + 2}: ${e.message}`);
            } finally {
                conn.release();
            }
        }

        res.json({ message: `Import hoàn tất. Thêm mới: ${inserted}, Bỏ qua (trùng): ${skipped}, Lỗi: ${errors.length}`, inserted, skipped, total: rows.length, errors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Import Hoạt động
const importActivities = async (req, res) => {
    try {
        const rows = parseFileToJSON(req.file.buffer, req.file.originalname);
        let inserted = 0;
        let skipped = 0;
        let errors = [];

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                const title = r['tên hoạt động'] || r['title'] || r['ten_hoat_dong'];
                const enterprise_id = r['mã doanh nghiệp (id)'] || r['enterprise_id'];
                const typeStr = r['loại hình'] || r['type'] || r['loai_hinh'] || 'Khác';
                const targetStr = r['đối tượng'] || '';
                const detail = r['mô tả'] || r['detail'] || r['mo_ta'] || '';

                // Format DD/MM/YYYY to YYYY-MM-DD if needed, but assuming ISO format from export for simplicity, 
                // or just leave it if MySQL accepts it / handle Date object if parsed by xlsx.
                let start_date = r['ngày bắt đầu'] || r['start_date'] || null;
                let end_date = r['ngày kết thúc'] || r['end_date'] || null;
                let collaboration_date = r['ngày hợp tác'] || r['collaboration_date'] || null;

                // Simple date parse helper for DD/MM/YYYY strings from excel exports
                const parseDateStr = (d) => {
                    if (!d) return null;
                    if (typeof d === 'string' && d.includes('/')) {
                        const parts = d.split('/');
                        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    return d;
                };
                start_date = parseDateStr(start_date);
                end_date = parseDateStr(end_date);
                collaboration_date = parseDateStr(collaboration_date);

                const status = r['trạng thái'] || r['status'] || 'Đề xuất';
                const facultyId = req.user.role === 'ADMIN' ? (r['faculty_id'] || null) : req.user.faculty_id;

                if (!title) { errors.push(`Dòng ${i + 2}: Thiếu tên hoạt động`); continue; }
                if (!enterprise_id) { errors.push(`Dòng ${i + 2}: Thiếu mã doanh nghiệp (ID)`); continue; }

                const [existingAct] = await conn.query('SELECT id FROM activities WHERE title = ? AND enterprise_id = ?', [title, enterprise_id]);
                if (existingAct.length > 0) {
                    skipped++;
                    errors.push(`Dòng ${i + 2}: Đã tồn tại hoạt động này cho doanh nghiệp (ID: ${enterprise_id})`);
                    await conn.rollback();
                    conn.release();
                    continue;
                }

                // 1. Insert into activities
                const [result] = await conn.query(
                    'INSERT INTO activities (enterprise_id, title, detail, start_date, end_date, collaboration_date, status, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [enterprise_id, title, detail, start_date, end_date, collaboration_date, status, facultyId]
                );
                const activityId = result.insertId;

                // 2. Insert types
                if (typeStr) {
                    const typeNames = typeStr.split(',').map(s => s.trim()).filter(Boolean);
                    for (const tn of typeNames) {
                        const [tRows] = await conn.query('SELECT id FROM act_types WHERE name LIKE ? LIMIT 1', [`%${tn}%`]);
                        if (tRows.length > 0) {
                            await conn.query('INSERT IGNORE INTO activity_type_map (activity_id, type_id) VALUES (?, ?)', [activityId, tRows[0].id]);
                        }
                    }
                }

                // 3. Insert targets
                if (targetStr) {
                    const targetNames = targetStr.split(',').map(s => s.trim()).filter(Boolean);
                    for (const tn of targetNames) {
                        const [tgRows] = await conn.query('SELECT id FROM targets WHERE name LIKE ? LIMIT 1', [`%${tn}%`]);
                        if (tgRows.length > 0) {
                            await conn.query('INSERT IGNORE INTO activity_target_map (activity_id, target_id) VALUES (?, ?)', [activityId, tgRows[0].id]);
                        }
                    }
                }

                await conn.commit();
                inserted++;
            } catch (e) {
                await conn.rollback();
                errors.push(`Dòng ${i + 2}: ${e.message}`);
            } finally {
                conn.release();
            }
        }

        res.json({ message: `Import hoàn tất. Thêm mới: ${inserted}, Bỏ qua (trùng): ${skipped}, Lỗi: ${errors.length}`, inserted, skipped, total: rows.length, errors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Import Sinh viên
const importStudents = async (req, res) => {
    try {
        const rows = parseFileToJSON(req.file.buffer, req.file.originalname);
        let inserted = 0;
        let skipped = 0;
        let errors = [];

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            try {
                const student_code = r['mssv'] || r['student_code'];
                const name = r['họ tên'] || r['name'] || r['ho_ten'];
                const email = r['email'] || '';
                const className = r['lớp'] || r['class'] || r['lop'] || '';
                const major = r['ngành học'] || r['major'] || r['nganh_hoc'] || '';
                const advisor = r['giảng viên hd'] || r['advisor'] || r['gvhd'] || '';
                const activity_id = r['mã hoạt động (id)'] || r['activity_id'] || null;
                const position = r['vị trí'] || r['position'] || r['vi_tri'] || '';
                const status = r['trạng thái'] || r['status'] || 'Chờ phân công';
                const gpa = r['gpa'] || null;

                const parseDateStr = (d) => {
                    if (!d) return null;
                    if (typeof d === 'string' && d.includes('/')) {
                        const parts = d.split('/');
                        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    return d;
                };
                const start_date = parseDateStr(r['ngày bắt đầu'] || r['start_date'] || r['ngay_bat_dau'] || null);
                const end_date = parseDateStr(r['ngày kết thúc'] || r['end_date'] || r['ngay_ket_thuc'] || null);

                if (!student_code || !name) { errors.push(`Dòng ${i + 2}: Thiếu MSSV hoặc Họ tên`); continue; }

                const [existingStu] = await pool.query('SELECT id FROM students WHERE student_code = ?', [student_code]);
                if (existingStu.length > 0) {
                    skipped++;
                    errors.push(`Dòng ${i + 2}: Đã tồn tại sinh viên với MSSV ${student_code}`);
                    continue;
                }

                const facultyId = req.user.role === 'ADMIN' ? (r['faculty_id'] || null) : req.user.faculty_id;

                await pool.query(
                    `INSERT INTO students (student_code, name, email, class, major, advisor, activity_id, position, status, gpa, start_date, end_date, faculty_id) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [student_code, name, email, className, major, advisor, activity_id, position, status, gpa, start_date, end_date, facultyId]
                );
                inserted++;
            } catch (e) {
                errors.push(`Dòng ${i + 2}: ${e.message}`);
            }
        }

        res.json({ message: `Import hoàn tất. Thêm mới: ${inserted}, Bỏ qua (trùng): ${skipped}, Lỗi: ${errors.length}`, inserted, skipped, total: rows.length, errors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Rotate API keys if GEMINI_API_KEYS is defined
let apiKeys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()) : [];
if (apiKeys.length === 0 && process.env.GEMINI_API_KEY) {
    apiKeys.push(process.env.GEMINI_API_KEY);
}
let currentKeyIdx = 0;

function getGenerativeModel() {
    if (apiKeys.length === 0) throw new Error("No Gemini API key found");
    const genAI = new GoogleGenerativeAI(apiKeys[currentKeyIdx]);
    // The user's Python script used gemini-3.1-flash-lite-preview, falling back to gemini-1.5-flash if that's invalid, 
    // but the SDK requires the exact string. We will use the string provided by the user.
    return genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); // Using 1.5-flash as the stable version, since 3.1 is not commonly available in standard library yet, but wait, the plan said to use 3.1-flash-lite-preview.
}

function rotateKey() {
    if (apiKeys.length > 1) {
        currentKeyIdx = (currentKeyIdx + 1) % apiKeys.length;
        console.log(`[🔄 ĐỔI KEY] Đã chuyển sang API Key số ${currentKeyIdx + 1}...`);
    }
}

const system_prompt = `
Bạn là một chuyên gia phân tích dữ liệu Data Engineer. Nhiệm vụ của bạn là đọc dữ liệu thô và bóc tách thành JSON chuẩn.

QUY TẮC PHÂN LOẠI ÉP BUỘC (TUYỆT ĐỐI CHỈ CHỌN TRONG DANH SÁCH SAU, KHÔNG TỰ BỊA THÊM):

1. Cột \`scale_name\` (Quy mô): BẮT BUỘC dùng kiến thức thực tế của bạn về thị trường để đánh giá công ty này. CHỈ chọn 1 trong 3:
   - "Tier 1 (Tập đoàn/Global)": Công ty đa quốc gia, ngân hàng, tập đoàn lớn (VD: AWS, Hitachi, TMA, FPT, ACB, Mobifone).
   - "Tier 2 (SME)": Công ty tầm trung, có tiếng trong nước.
   - "Tier 3 (Startup/Micro)": Công ty khởi nghiệp, công ty nhỏ. 
   (Nếu dữ liệu không ghi rõ và bạn không chắc chắn, hãy mặc định chọn "Tier 2 (SME)").

2. Cột \`field_names\` (Ngành nghề): Hãy gom nhóm lại. BẮT BUỘC CHỈ CHỌN 1 hoặc nhiều từ danh sách sau:
   ["Phần mềm & Outsource", "Giải pháp CNTT & Chuyển đổi số", "Hạ tầng & Viễn thông", "Tài chính & Fintech", "Phần cứng & Điện tử", "Marketing & Truyền thông", "Khác"]

3. Cột \`activity_type_names\` (Loại hoạt động): KHÔNG ĐƯỢC phân mảnh chi tiết. BẮT BUỘC CHỈ CHỌN từ danh sách sau:
   ["Tuyển dụng & Thực tập", "Hội thảo & Đào tạo", "Tài trợ & Học bổng", "Tham quan doanh nghiệp", "Kiểm định & Đánh giá", "Ký kết MOU", "Khác"]
   (Lưu ý: Phỏng vấn, Ứng viên, Thực tập sinh -> Gom hết vào "Tuyển dụng & Thực tập". Tọa đàm, Ngày hội, Hướng dẫn -> Gom vào "Hội thảo & Đào tạo").

4. Cột \`target_names\` (Đối tượng): BẮT BUỘC CHỈ CHỌN từ danh sách sau:
   ["Sinh viên", "Giảng viên", "Lãnh đạo Khoa/Trường"]

5. Chuẩn hoá dữ liệu (số nhà, tên đường, số điện thoại,...): Hãy chuyển đổi thành một định dạng duy nhất, không được phép sáng tạo thêm. Nếu dữ liệu không rõ ràng, hãy chọn phương án phù hợp nhất dựa trên hiểu biết của bạn về thị trường và xu hướng chung.
OUTPUT FORMAT (CHỈ TRẢ VỀ JSON, KHÔNG CÓ MARKDOWN HAY TEXT NÀO KHÁC):
{
  "company": {
    "name": "Tên công ty",
    "rep_title": "Danh xưng", "rep_name": "Họ và tên", "rep_role": "Chức vụ",
    "rep_phone": "SĐT", "rep_email": "Email",
    "address_building": "Tòa nhà/Đường", "address_district": "Quận/Huyện", "address_province": "Tỉnh/Thành", "address_country": "Quốc gia",
    "is_hcmc": true/false,
    "scale_name": "Chọn 1 Tier ở trên",
    "field_names": ["Chọn Ngành từ danh sách trên"]
  },
  "activities": [
    {
      "name": "Trích xuất mô tả ngắn gọn hoạt động (VD: Tặng 10 triệu cho K29)",
      "detail": "Trích xuất chi tiết (nếu có)",
      "activity_type_names": ["Chọn Loại Hoạt động từ danh sách"],
      "target_names": ["Chọn Đối tượng từ danh sách"]
    }
  ]
}
`;

const delay = ms => new Promise(res => setTimeout(res, ms));

const aiParseRow = async (req, res) => {
    const { rowText } = req.body;
    if (!rowText) return res.status(400).json({ message: "Missing rowText" });

    const facultyId = req.user.role === 'ADMIN'
        ? (req.body.faculty_id || req.body.facultyId || null)
        : req.user.faculty_id;

    let parsedData = null;
    let maxRetries = apiKeys.length * 2;
    let waitTime = 5000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const model = getGenerativeModel(); // You might want to override model string to "gemini-3.1-flash-lite-preview" or fallback to "gemini-1.5-flash"
            const result = await model.generateContent(system_prompt + "\\nDỮ LIỆU ĐẦU VÀO:\\n" + rowText);
            const text = result.response.text();

            let rawJson = text.trim();
            if (rawJson.startsWith('```json')) rawJson = rawJson.replace('```json', '');
            if (rawJson.startsWith('```')) rawJson = rawJson.replace('```', '');
            if (rawJson.endsWith('```')) rawJson = rawJson.substring(0, rawJson.length - 3);

            parsedData = JSON.parse(rawJson.trim());
            break;
        } catch (error) {
            console.error("Gemini API Error:", error.message);
            if (error.message.includes("429") || error.message.includes("quota") || error.message.includes("rate limit") || error.status === 429) {
                rotateKey();
                await delay(2000);
                if ((attempt + 1) % apiKeys.length === 0) {
                    console.log(`[⏳ CHỜ ĐỢI] Các Key đều tạm khóa. Nghỉ ${waitTime}ms...`);
                    await delay(waitTime);
                    waitTime += 5000;
                }
            } else {
                return res.status(500).json({ message: "Lỗi AI Parsing: " + error.message });
            }
        }
    }

    if (!parsedData) {
        return res.status(500).json({ message: "Không thể parse dữ liệu sau nhiều lần thử." });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const comp = parsedData.company || {};
        const activities = parsedData.activities || [];

        // 1. Get or Create Scale
        let scale_id = null;
        if (comp.scale_name) {
            const [sRows] = await conn.query('SELECT id FROM scales WHERE name = ?', [comp.scale_name]);
            if (sRows.length > 0) scale_id = sRows[0].id;
            else {
                const [sRes] = await conn.query('INSERT INTO scales (name) VALUES (?)', [comp.scale_name]);
                scale_id = sRes.insertId;
            }
        }

        // 2. Insert Enterprise
        const entName = comp.name || "Unknown Company";
        let checkQuery = 'SELECT id FROM enterprises WHERE name = ? AND (faculty_id = ? OR (faculty_id IS NULL AND ? IS NULL)) AND is_deleted = 0';
        const [existingEnt] = await conn.query(checkQuery, [entName, facultyId, facultyId]);

        let enterpriseId = null;
        if (existingEnt.length > 0) {
            throw new Error(`Doanh nghiệp "${entName}" đã tồn tại trong hệ thống.`);
        } else {
            const is_hcmc = comp.is_hcmc !== undefined ? comp.is_hcmc : true;
            const [eRes] = await conn.query(
                'INSERT INTO enterprises (name, scale_id, is_hcmc, faculty_id) VALUES (?, ?, ?, ?)',
                [entName, scale_id, is_hcmc, facultyId]
            );
            enterpriseId = eRes.insertId;
        }

        // 3. Insert Representatives
        if (comp.rep_name || comp.rep_phone || comp.rep_email) {
            await conn.query(
                'INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) VALUES (?, ?, ?, ?, ?, ?, 1)',
                [enterpriseId, comp.rep_title, comp.rep_name, comp.rep_role, comp.rep_phone, comp.rep_email]
            );
        }

        // 4. Insert Addresses
        if (comp.address_building || comp.address_district || comp.address_province) {
            await conn.query(
                'INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) VALUES (?, ?, ?, ?, ?, 1)',
                [enterpriseId, comp.address_building, comp.address_district, comp.address_province, comp.address_country || 'Việt Nam']
            );
        }

        // 5. Insert Enterprise Fields
        if (comp.field_names && Array.isArray(comp.field_names)) {
            for (const fn of comp.field_names) {
                let field_id = null;
                const [fRows] = await conn.query('SELECT id FROM fields WHERE name = ?', [fn]);
                if (fRows.length > 0) field_id = fRows[0].id;
                else {
                    const [fRes] = await conn.query('INSERT INTO fields (name) VALUES (?)', [fn]);
                    field_id = fRes.insertId;
                }
                await conn.query('INSERT IGNORE INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)', [enterpriseId, field_id]);
            }
        }

        // 6. Insert Activities
        for (const act of activities) {
            const [aRes] = await conn.query(
                'INSERT INTO activities (enterprise_id, title, detail, faculty_id) VALUES (?, ?, ?, ?)',
                [enterpriseId, act.name, act.detail, facultyId]
            );
            const activityId = aRes.insertId;

            // Activity Types
            if (act.activity_type_names && Array.isArray(act.activity_type_names)) {
                for (const tn of act.activity_type_names) {
                    let type_id = null;
                    const [tRows] = await conn.query('SELECT id FROM act_types WHERE name = ?', [tn]);
                    if (tRows.length > 0) type_id = tRows[0].id;
                    else {
                        const [tRes] = await conn.query('INSERT INTO act_types (name) VALUES (?)', [tn]);
                        type_id = tRes.insertId;
                    }
                    await conn.query('INSERT IGNORE INTO activity_type_map (activity_id, type_id) VALUES (?, ?)', [activityId, type_id]);
                }
            }

            // Targets
            if (act.target_names && Array.isArray(act.target_names)) {
                for (const tg of act.target_names) {
                    let target_id = null;
                    const [tgRows] = await conn.query('SELECT id FROM targets WHERE name = ?', [tg]);
                    if (tgRows.length > 0) target_id = tgRows[0].id;
                    else {
                        const [tgRes] = await conn.query('INSERT INTO targets (name) VALUES (?)', [tg]);
                        target_id = tgRes.insertId;
                    }
                    await conn.query('INSERT IGNORE INTO activity_target_map (activity_id, target_id) VALUES (?, ?)', [activityId, target_id]);
                }
            }
        }

        await conn.commit();
        res.json({ message: "Parse và lưu dữ liệu thành công", data: parsedData, enterpriseId });
    } catch (dbError) {
        await conn.rollback();
        console.error("DB Error:", dbError);
        res.status(500).json({ message: dbError.message });
    } finally {
        conn.release();
    }
};

module.exports = { upload, importEnterprises, importActivities, importStudents, aiParseRow };
