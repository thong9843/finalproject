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
    return XLSX.utils.sheet_to_json(sheet);
}

// Import Doanh nghiệp
const importEnterprises = async (req, res) => {
    try {
        const rows = parseFileToJSON(req.file.buffer, req.file.originalname);
        let inserted = 0;
        let errors = [];

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                const name = r['Tên doanh nghiệp'] || r['name'] || r['ten_doanh_nghiep'];
                const tax_code = r['Mã số thuế'] || r['tax_code'] || r['ma_so_thue'] || null;
                const scaleStr = r['Quy mô'] || r['scale'] || '';
                const fieldStr = r['Lĩnh vực'] || r['fields'] || '';
                const is_hcmc = r['Ở TP.HCM'] ? (r['Ở TP.HCM'].toString().toLowerCase() === 'có' || r['Ở TP.HCM'] === 1) : true;
                
                const rep_title = r['Danh xưng'] || null;
                const rep_full_name = r['Họ và tên'] || null;
                const rep_role = r['Chức vụ'] || null;
                const rep_phone = r['Số điện thoại'] || null;
                const rep_email = r['Email'] || null;

                const building_street = r['Địa chỉ'] || null; // Tương đương Đường/Tòa nhà
                const district = r['Quận/Huyện'] || null;
                const province = r['Tỉnh/Thành'] || null;
                const country = r['Quốc gia'] || 'Việt Nam';

                const status = r['Trạng thái'] || r['status'] || 'Tiềm năng';
                const department_id = r['Bộ môn ID'] || r['department_id'] || null;
                const facultyId = req.user.role === 'ADMIN' ? (r['faculty_id'] || null) : req.user.faculty_id;

                if (!name) { errors.push(`Dòng ${i + 2}: Thiếu tên doanh nghiệp`); continue; }

                // 1. Map scale string to scale_id
                let scale_id = null;
                if (scaleStr) {
                    const [scaleRows] = await conn.query('SELECT id FROM scales WHERE name LIKE ? LIMIT 1', [`%${scaleStr}%`]);
                    if (scaleRows.length > 0) scale_id = scaleRows[0].id;
                }

                // 2. Insert into enterprises
                const [result] = await conn.query(
                    'INSERT INTO enterprises (name, tax_code, scale_id, is_hcmc, status, department_id, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [name, tax_code, scale_id, is_hcmc, status, department_id, facultyId]
                );
                const enterpriseId = result.insertId;

                // 3. Insert into enterprise_representatives
                if (rep_full_name || rep_phone || rep_email) {
                    await conn.query(
                        'INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) VALUES (?, ?, ?, ?, ?, ?, 1)',
                        [enterpriseId, rep_title, rep_full_name, rep_role, rep_phone, rep_email]
                    );
                }

                // 4. Insert into enterprise_addresses
                if (building_street || district || province) {
                    await conn.query(
                        'INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) VALUES (?, ?, ?, ?, ?, 1)',
                        [enterpriseId, building_street, district, province, country]
                    );
                }

                // 5. Insert into enterprise_fields (many-to-many)
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

        res.json({ message: `Import thành công ${inserted}/${rows.length} doanh nghiệp`, inserted, total: rows.length, errors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Import Hoạt động
const importActivities = async (req, res) => {
    try {
        const rows = parseFileToJSON(req.file.buffer, req.file.originalname);
        let inserted = 0;
        let errors = [];

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                const title = r['Tên hoạt động'] || r['title'] || r['ten_hoat_dong'];
                const enterprise_id = r['Mã doanh nghiệp (ID)'] || r['enterprise_id'];
                const typeStr = r['Loại hình'] || r['type'] || r['loai_hinh'] || 'Khác';
                const targetStr = r['Đối tượng'] || '';
                const detail = r['Mô tả'] || r['detail'] || r['mo_ta'] || '';
                
                // Format DD/MM/YYYY to YYYY-MM-DD if needed, but assuming ISO format from export for simplicity, 
                // or just leave it if MySQL accepts it / handle Date object if parsed by xlsx.
                let start_date = r['Ngày bắt đầu'] || r['start_date'] || null;
                let end_date = r['Ngày kết thúc'] || r['end_date'] || null;
                let collaboration_date = r['Ngày hợp tác'] || r['collaboration_date'] || null;

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

                const status = r['Trạng thái'] || r['status'] || 'Đề xuất';
                const facultyId = req.user.role === 'ADMIN' ? (r['faculty_id'] || null) : req.user.faculty_id;

                if (!title) { errors.push(`Dòng ${i + 2}: Thiếu tên hoạt động`); continue; }
                if (!enterprise_id) { errors.push(`Dòng ${i + 2}: Thiếu mã doanh nghiệp (ID)`); continue; }

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

        res.json({ message: `Import thành công ${inserted}/${rows.length} hoạt động`, inserted, total: rows.length, errors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Import Sinh viên
const importStudents = async (req, res) => {
    try {
        const rows = parseFileToJSON(req.file.buffer, req.file.originalname);
        let inserted = 0;
        let errors = [];

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            try {
                const student_code = r['MSSV'] || r['student_code'] || r['mssv'];
                const name = r['Họ tên'] || r['name'] || r['ho_ten'];
                const email = r['Email'] || r['email'] || '';
                const className = r['Lớp'] || r['class'] || r['lop'] || '';
                const major = r['Ngành học'] || r['major'] || r['nganh_hoc'] || '';
                const advisor = r['Giảng viên HD'] || r['advisor'] || r['gvhd'] || '';
                const activity_id = r['Mã hoạt động (ID)'] || r['activity_id'] || null;
                const position = r['Vị trí'] || r['position'] || r['vi_tri'] || '';
                const status = r['Trạng thái'] || r['status'] || 'Chờ phân công';
                const gpa = r['GPA'] || r['gpa'] || null;
                
                const parseDateStr = (d) => {
                    if (!d) return null;
                    if (typeof d === 'string' && d.includes('/')) {
                        const parts = d.split('/');
                        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    return d;
                };
                const start_date = parseDateStr(r['Ngày bắt đầu'] || r['start_date'] || r['ngay_bat_dau'] || null);
                const end_date = parseDateStr(r['Ngày kết thúc'] || r['end_date'] || r['ngay_ket_thuc'] || null);

                if (!student_code || !name) { errors.push(`Dòng ${i + 2}: Thiếu MSSV hoặc Họ tên`); continue; }

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

        res.json({ message: `Import thành công ${inserted}/${rows.length} sinh viên`, inserted, total: rows.length, errors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { upload, importEnterprises, importActivities, importStudents };
