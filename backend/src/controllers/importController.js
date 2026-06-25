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

const ALIAS_MAP = {
    students: {
        'mssv': ['mssv', 'student_code', 'student code', 'mã sinh viên', 'ma sinh vien', 'mã sv', 'ma sv', 'mã số sinh viên', 'ma so sinh vien'],
        'họ tên': ['họ tên', 'ho ten', 'họ và tên', 'ho va ten', 'tên', 'ten', 'name', 'tên sinh viên', 'ten sinh vien', 'họ & tên'],
        'email': ['email', 'thư điện tử', 'thu dien tu'],
        'lớp': ['lớp', 'lop', 'class', 'lớp học', 'lop hoc'],
        'ngành học': ['ngành học', 'nganh hoc', 'ngành', 'nganh', 'major', 'chuyên ngành', 'chuyen nganh'],
        'giảng viên hd': ['giảng viên hd', 'giang vien hd', 'giảng viên hướng dẫn', 'giang vien huong dan', 'gvhd', 'advisor', 'gv hướng dẫn', 'gv huong dan'],
        'nơi thực tập/làm việc': ['nơi thực tập/làm việc', 'noi thuc tap/lam viec', 'nơi thực tập / làm việc', 'nơi thực tập', 'noi thuc tap', 'tên doanh nghiệp', 'ten doanh nghiep', 'doanh nghiệp', 'doanh nghiep', 'công ty', 'cong ty', 'enterprise', 'enterprise_name'],
        'mã doanh nghiệp (id)': ['mã doanh nghiệp (id)', 'enterprise_id', 'mã doanh nghiệp', 'ma doanh nghiep'],
        'hoạt động tham gia': ['hoạt động tham gia', 'hoat dong tham gia', 'hoạt động', 'hoat dong', 'tên hoạt động', 'ten hoat dong', 'activity', 'activity_title'],
        'mã hoạt động (id)': ['mã hoạt động (id)', 'activity_id', 'mã hoạt động', 'ma hoat dong'],
        'vị trí': ['vị trí', 'vi tri', 'position', 'vị trí thực tập', 'vi tri thuc tap'],
        'trạng thái': ['trạng thái', 'trang thai', 'status'],
        'gpa': ['gpa', 'điểm', 'diem', 'điểm trung bình', 'diem trung binh'],
        'ngày bắt đầu': ['ngày bắt đầu', 'ngay bat dau', 'start_date', 'start date', 'từ ngày', 'tu ngay'],
        'ngày kết thúc': ['ngày kết thúc', 'ngay ket thuc', 'end_date', 'end date', 'đến ngày', 'den ngay']
    },
    enterprises: {
        'tên doanh nghiệp': ['tên doanh nghiệp', 'ten doanh nghiep', 'name', 'tên công ty', 'ten cong ty', 'tên', 'ten', 'doanh nghiệp', 'doanh nghiep'],
        'mã số thuế': ['mã số thuế', 'ma so thue', 'tax_code', 'tax code', 'mst'],
        'quy mô': ['quy mô', 'quy mo', 'scale', 'scale_name'],
        'lĩnh vực': ['lĩnh vực', 'linh vuc', 'fields', 'ngành nghề', 'nganh nghe'],
        'ở tp.hcm': ['ở tp.hcm', 'o tp.hcm', 'is_hcmc', 'tp.hcm', 'hcm', 'tphcm', 'ở tphcm'],
        'danh xưng': ['danh xưng', 'danh xung', 'rep_title', 'title'],
        'họ và tên': ['họ và tên', 'ho va ten', 'rep_name', 'rep_full_name', 'người đại diện', 'nguoi dai dien', 'họ tên', 'ho ten'],
        'chức vụ': ['chức vụ', 'chuc vu', 'rep_role', 'role'],
        'số điện thoại': ['số điện thoại', 'so dien thoai', 'rep_phone', 'sđt', 'sdt', 'phone'],
        'email': ['email', 'rep_email'],
        'địa chỉ': ['địa chỉ', 'dia chi', 'building_street', 'address', 'địa chỉ chi tiết'],
        'quận/huyện': ['quận/huyện', 'quan/huyen', 'district'],
        'tỉnh/thành': ['tỉnh/thành', 'tinh/thanh', 'province', 'tỉnh/thành phố'],
        'quốc gia': ['quốc gia', 'quoc gia', 'country'],
        'bộ môn id': ['bộ môn id', 'bo mon id', 'department_id'],
        'trạng thái': ['trạng thái', 'trang thai', 'status']
    },
    activities: {
        'tên hoạt động': ['tên hoạt động', 'ten hoat dong', 'title', 'activity_title'],
        'tên doanh nghiệp': ['tên doanh nghiệp', 'ten doanh nghiep', 'enterprise_name', 'doanh nghiệp', 'doanh nghiep', 'công ty', 'cong ty'],
        'mã doanh nghiệp (id)': ['mã doanh nghiệp (id)', 'enterprise_id', 'mã doanh nghiệp', 'ma doanh nghiep'],
        'loại hình': ['loại hình', 'loai hinh', 'type', 'activity_type', 'loại hình hoạt động'],
        'đối tượng': ['đối tượng', 'doi tuong', 'target'],
        'mô tả': ['mô tả', 'mo ta', 'detail', 'mô tả nội dung', 'description', 'nội dung'],
        'ngày bắt đầu': ['ngày bắt đầu', 'ngay bat dau', 'start_date'],
        'ngày kết thúc': ['ngày kết thúc', 'ngay ket thuc', 'end_date'],
        'thời gian bắt đầu': ['thời gian bắt đầu', 'thoi gian bat dau', 'start_time', 'start time', 'giờ bắt đầu', 'gio bat dau'],
        'thời gian kết thúc': ['thời gian kết thúc', 'thoi gian ket thuc', 'end_time', 'end time', 'giờ kết thúc', 'gio ket thuc'],
        'người phụ trách': ['người phụ trách', 'nguoi phu trach', 'person_in_charge', 'person in charge', 'phụ trách', 'phu trach'],
        'nhiệm vụ': ['nhiệm vụ', 'nhiem vu', 'tasks', 'công việc', 'cong viec'],
        'ngày hợp tác': ['ngày hợp tác', 'ngay hop tac', 'collaboration_date'],
        'trạng thái': ['trạng thái', 'trang thai', 'status']
    },
    mous: {
        'mã mou': ['mã mou', 'ma mou', 'mou_code', 'mã biên bản', 'ma bien ban'],
        'tên doanh nghiệp': ['tên doanh nghiệp', 'ten doanh nghiep', 'enterprise_name', 'doanh nghiệp', 'doanh nghiep', 'công ty', 'cong ty', 'đối tác', 'doi tac'],
        'mã doanh nghiệp (id)': ['mã doanh nghiệp (id)', 'enterprise_id', 'mã doanh nghiệp', 'ma doanh nghiep'],
        'ngày ký': ['ngày ký', 'ngay ky', 'signing_date', 'ngày ký kết', 'ngay ky ket'],
        'đầu mối đối tác': ['đầu mối đối tác', 'dau moi doi tac', 'partner_contact', 'đại diện đối tác'],
        'loại tổ chức': ['loại tổ chức', 'loai to chuc', 'org_type', 'phân loại tổ chức'],
        'quốc gia': ['quốc gia', 'quoc gia', 'country'],
        'mảng hợp tác': ['mảng hợp tác', 'mang hop tac', 'collaboration_scope', 'phạm vi hợp tác'],
        'bộ môn id': ['bộ môn id', 'bo mon id', 'executing_unit_id', 'department_id'],
        'bộ môn triển khai': ['bộ môn triển khai', 'bo mon trien khai', 'executing_unit_name', 'department_name'],
        'đầu mối vlu': ['đầu mối vlu', 'dau moi vlu', 'vlu_contact'],
        'nhiệm vụ': ['nhiệm vụ', 'nhiem vu', 'tasks_ay24_25'],
        'bước tiếp theo': ['bước tiếp theo', 'buoc tiep theo', 'next_steps'],
        'hoạt động đã qua': ['hoạt động đã qua', 'hoat dong da qua', 'past_activities'],
        'số liệu liên quan': ['số liệu liên quan', 'so lieu lien quan', 'related_data'],
        'thư mục làm việc': ['thư mục làm việc', 'thu muc lam viec', 'working_dir', 'working dir', 'folder'],
        'hoạt động liên kết': ['hoạt động liên kết', 'hoat dong lien ket', 'activity_title', 'hoạt động', 'hoat dong', 'tên hoạt động', 'ten hoat dong', 'activity'],
        'mã hoạt động (id)': ['mã hoạt động (id)', 'activity_id', 'mã hoạt động', 'ma hoat dong'],
        'link tài liệu': ['link tài liệu', 'link tai lieu', 'file_url', 'file url']
    }
};

const standardizeRowKeys = (row, entityType) => {
    const standardized = {};
    const typeMapping = ALIAS_MAP[entityType] || {};
    
    // First, convert row keys to lowercase and trim
    const normalizedRow = {};
    for (const key in row) {
        normalizedRow[key.trim().toLowerCase()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
    }

    // Map according to our ALIAS_MAP
    for (const canonicalKey in typeMapping) {
        const aliases = typeMapping[canonicalKey];
        // Find if any of the aliases exists in the normalized row
        const matchedAlias = aliases.find(alias => alias in normalizedRow);
        if (matchedAlias !== undefined) {
            standardized[canonicalKey] = normalizedRow[matchedAlias];
        } else {
            // Default to fallback to check if canonical key exists as is
            standardized[canonicalKey] = normalizedRow[canonicalKey] !== undefined ? normalizedRow[canonicalKey] : undefined;
        }
    }

    // Keep any other keys that were not mapped, just in case
    for (const key in normalizedRow) {
        let isMapped = false;
        for (const canonicalKey in typeMapping) {
            if (typeMapping[canonicalKey].includes(key)) {
                isMapped = true;
                break;
            }
        }
        if (!isMapped) {
            standardized[key] = normalizedRow[key];
        }
    }

    return standardized;
};

// Hàm đọc file Excel/CSV từ buffer -> JSON
function parseFileToJSON(buffer, originalname, type) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet);

    // Chuẩn hóa và ánh xạ các cột dữ liệu theo aliases
    return rawRows.map(row => standardizeRowKeys(row, type));
}

// Import Doanh nghiệp
const importEnterprises = async (req, res) => {
    try {
        const rows = req.file ? parseFileToJSON(req.file.buffer, req.file.originalname, 'enterprises') : req.body.rows;
        let inserted = 0;
        let skipped = 0;
        let errors = [];
        const facultyId = req.user.role === 'ADMIN' ? (req.body.faculty_id || null) : req.user.faculty_id;

        if (!facultyId) {
            return res.status(400).json({ message: "Thiếu thông tin Khoa quản lý." });
        }

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                const name = r['tên doanh nghiệp'] || r['name'] || r['ten_doanh_nghiep'];
                const tax_code = r['mã số thuế'] || r['tax_code'] || r['ma_so_thue'] || null;
                const scaleStr = r['quy mô'] || r['scale'] || '';
                const fieldStr = r['lĩnh vực'] || r['fields'] || '';
                const is_hcmc = r['ở tp.hcm'] ? (r['ở tp.hcm'].toString().toLowerCase() === 'có' || r['ở tp.hcm'] === 1 || r['ở tp.hcm'].toString().toLowerCase() === 'true') : true;

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
                
                // Lookup department ID by name if ID not provided
                let department_id = r['bộ môn id'] || r['department_id'] || null;
                const deptName = r['bộ môn'] || r['department_name'] || r['department'] || '';
                if (deptName && !department_id) {
                    const [deptRows] = await conn.query('SELECT id FROM departments WHERE name LIKE ? AND faculty_id = ? LIMIT 1', [`%${deptName}%`, facultyId]);
                    if (deptRows.length > 0) {
                        department_id = deptRows[0].id;
                    }
                }

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
                    const fieldNames = typeof fieldStr === 'string' ? fieldStr.split(',').map(s => s.trim()).filter(Boolean) : [fieldStr];
                    for (const fn of fieldNames) {
                        const [fRows] = await conn.query('SELECT id FROM fields WHERE name LIKE ? AND (faculty_id = 0 OR faculty_id = ?) LIMIT 1', [`%${fn}%`, facultyId || 0]);
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
        const rows = req.file ? parseFileToJSON(req.file.buffer, req.file.originalname, 'activities') : req.body.rows;
        let inserted = 0;
        let skipped = 0;
        let errors = [];
        const facultyId = req.user.role === 'ADMIN' ? (req.body.faculty_id || null) : req.user.faculty_id;

        if (!facultyId) {
            return res.status(400).json({ message: "Thiếu thông tin Khoa quản lý." });
        }

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                const title = r['tên hoạt động'] || r['title'] || r['ten_hoat_dong'];
                
                // Lookup enterprise ID by name if not provided directly
                let enterprise_id = r['mã doanh nghiệp (id)'] || r['enterprise_id'] || null;
                const entName = r['tên doanh nghiệp'] || r['enterprise_name'] || r['enterprise'] || '';
                if (entName && !enterprise_id) {
                    const [entRows] = await conn.query('SELECT id FROM enterprises WHERE name = ? AND faculty_id = ? AND is_deleted = 0 LIMIT 1', [entName.trim(), facultyId]);
                    if (entRows.length > 0) {
                        enterprise_id = entRows[0].id;
                    }
                }

                const typeStr = r['loại hình'] || r['type'] || r['loai_hinh'] || 'Khác';
                const targetStr = r['đối tượng'] || '';
                const detail = r['mô tả'] || r['detail'] || r['mo_ta'] || '';

                let start_date = r['ngày bắt đầu'] || r['start_date'] || null;
                let end_date = r['ngày kết thúc'] || r['end_date'] || null;
                let collaboration_date = r['ngày hợp tác'] || r['collaboration_date'] || null;

                const start_time = r['thời gian bắt đầu'] || r['start_time'] || null;
                const end_time = r['thời gian kết thúc'] || r['end_time'] || null;
                const person_in_charge = r['người phụ trách'] || r['person_in_charge'] || null;
                const tasksRaw = r['nhiệm vụ'] || r['tasks'] || null;
                let tasks = null;
                if (tasksRaw) {
                    try {
                        if (typeof tasksRaw === 'string') {
                            if (tasksRaw.trim().startsWith('[') || tasksRaw.trim().startsWith('{')) {
                                tasks = JSON.parse(tasksRaw);
                            } else {
                                tasks = tasksRaw.split(',').map(t => t.trim()).filter(Boolean);
                            }
                        } else {
                            tasks = tasksRaw;
                        }
                    } catch (e) {
                        tasks = [tasksRaw];
                    }
                }
                const tasksJson = tasks ? JSON.stringify(tasks) : null;

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

                if (!title) { errors.push(`Dòng ${i + 2}: Thiếu tên hoạt động`); continue; }
                if (!enterprise_id) { errors.push(`Dòng ${i + 2}: Thiếu mã doanh nghiệp (ID) hoặc Không tìm thấy tên doanh nghiệp`); continue; }

                const [existingAct] = await conn.query('SELECT id FROM activities WHERE title = ? AND enterprise_id = ? AND is_deleted = 0', [title, enterprise_id]);
                if (existingAct.length > 0) {
                    skipped++;
                    errors.push(`Dòng ${i + 2}: Đã tồn tại hoạt động này cho doanh nghiệp (ID: ${enterprise_id})`);
                    await conn.rollback();
                    conn.release();
                    continue;
                }

                // 1. Insert into activities
                const [result] = await conn.query(
                    'INSERT INTO activities (enterprise_id, title, detail, start_date, end_date, start_time, end_time, person_in_charge, tasks, collaboration_date, status, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [enterprise_id, title, detail, start_date, end_date, start_time, end_time, person_in_charge, tasksJson, collaboration_date, status, facultyId]
                );
                const activityId = result.insertId;

                // 2. Insert types
                if (typeStr) {
                    const typeNames = typeof typeStr === 'string' ? typeStr.split(',').map(s => s.trim()).filter(Boolean) : [typeStr];
                    for (const tn of typeNames) {
                        const [tRows] = await conn.query('SELECT id FROM act_types WHERE name LIKE ? LIMIT 1', [`%${tn}%`]);
                        if (tRows.length > 0) {
                            await conn.query('INSERT IGNORE INTO activity_type_map (activity_id, type_id) VALUES (?, ?)', [activityId, tRows[0].id]);
                        }
                    }
                }

                // 3. Insert targets
                if (targetStr) {
                    const targetNames = typeof targetStr === 'string' ? targetStr.split(',').map(s => s.trim()).filter(Boolean) : [targetStr];
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
        const rows = req.file ? parseFileToJSON(req.file.buffer, req.file.originalname, 'students') : req.body.rows;
        let inserted = 0;
        let skipped = 0;
        let errors = [];
        const facultyId = req.user.role === 'ADMIN' ? (req.body.faculty_id || null) : req.user.faculty_id;

        if (!facultyId) {
            return res.status(400).json({ message: "Thiếu thông tin Khoa quản lý." });
        }

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                const student_code = r['mssv'] || r['student_code'];
                const name = r['họ tên'] || r['name'] || r['ho_ten'];
                const email = r['email'] || '';
                const className = r['lớp'] || r['class'] || r['lop'] || '';
                const major = r['ngành học'] || r['major'] || r['nganh_hoc'] || '';
                const advisor = r['giảng viên hd'] || r['advisor'] || r['gvhd'] || '';
                
                // Lookup enterprise and activity by name if IDs not provided directly
                let enterprise_id = r['mã doanh nghiệp (id)'] || r['enterprise_id'] || null;
                const entName = r['nơi thực tập/làm việc'] || r['enterprise_name'] || r['enterprise'] || '';
                if (entName && !enterprise_id) {
                    const [entRows] = await conn.query('SELECT id FROM enterprises WHERE name = ? AND faculty_id = ? AND is_deleted = 0 LIMIT 1', [entName.trim(), facultyId]);
                    if (entRows.length > 0) {
                        enterprise_id = entRows[0].id;
                    }
                }

                let activity_id = r['mã hoạt động (id)'] || r['activity_id'] || null;
                const actTitle = r['hoạt động tham gia'] || r['activity_title'] || r['activity'] || '';
                if (actTitle && !activity_id) {
                    const [actRows] = await conn.query('SELECT id FROM activities WHERE title = ? AND faculty_id = ? AND is_deleted = 0 LIMIT 1', [actTitle.trim(), facultyId]);
                    if (actRows.length > 0) {
                        activity_id = actRows[0].id;
                    }
                }

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

                const [existingStu] = await conn.query('SELECT id FROM students WHERE student_code = ? AND is_deleted = 0', [student_code]);
                if (existingStu.length > 0) {
                    skipped++;
                    errors.push(`Dòng ${i + 2}: Đã tồn tại sinh viên với MSSV ${student_code}`);
                    await conn.rollback();
                    conn.release();
                    continue;
                }

                await conn.query(
                    `INSERT INTO students (student_code, name, email, class, major, advisor, activity_id, enterprise_id, position, status, gpa, start_date, end_date, faculty_id) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [student_code, name, email, className, major, advisor, activity_id, enterprise_id, position, status, gpa, start_date, end_date, facultyId]
                );

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

// Import MOUs
const importMous = async (req, res) => {
    try {
        const rows = req.file ? parseFileToJSON(req.file.buffer, req.file.originalname, 'mous') : req.body.rows;
        let inserted = 0;
        let skipped = 0;
        let errors = [];
        const facultyId = req.user.role === 'ADMIN' ? (req.body.faculty_id || null) : req.user.faculty_id;

        if (!facultyId) {
            return res.status(400).json({ message: "Thiếu thông tin Khoa quản lý." });
        }

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();

                const mou_code = r['mã mou'] || r['mou_code'] || r['ma_mou'];
                let enterprise_id = r['mã doanh nghiệp (id)'] || r['enterprise_id'] || null;
                const entName = r['tên doanh nghiệp'] || r['enterprise_name'] || r['enterprise'] || '';
                
                // Lookup enterprise by name if ID not provided
                if (entName && !enterprise_id) {
                    const [entRows] = await conn.query('SELECT id FROM enterprises WHERE name = ? AND faculty_id = ? AND is_deleted = 0 LIMIT 1', [entName.trim(), facultyId]);
                    if (entRows.length > 0) {
                        enterprise_id = entRows[0].id;
                    }
                }

                // If enterprise still doesn't exist, we skip or throw error
                if (!enterprise_id) {
                    throw new Error(`Doanh nghiệp "${entName || 'Chưa xác định'}" không tồn tại trên hệ thống.`);
                }

                let signing_date = r['ngày ký'] || r['signing_date'] || null;
                const parseDateStr = (d) => {
                    if (!d) return null;
                    if (typeof d === 'string' && d.includes('/')) {
                        const parts = d.split('/');
                        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    return d;
                };
                signing_date = parseDateStr(signing_date);

                const partner_contact = r['đầu mối đối tác'] || r['partner_contact'] || '';
                const org_type = r['loại tổ chức'] || r['org_type'] || '';
                const country = r['quốc gia'] || r['country'] || 'Việt Nam';
                const collaboration_scope = r['mảng hợp tác'] || r['collaboration_scope'] || '';
                
                let executing_unit_id = r['bộ môn id'] || r['executing_unit_id'] || null;
                const deptName = r['bộ môn triển khai'] || r['executing_unit_name'] || '';
                if (deptName && !executing_unit_id) {
                    const [deptRows] = await conn.query('SELECT id FROM departments WHERE name LIKE ? AND faculty_id = ? LIMIT 1', [`%${deptName}%`, facultyId]);
                    if (deptRows.length > 0) {
                        executing_unit_id = deptRows[0].id;
                    }
                }

                const vlu_contact = r['đầu mối vlu'] || r['vlu_contact'] || '';
                const tasks_ay24_25 = r['nhiệm vụ'] || r['tasks_ay24_25'] || '';
                const next_steps = r['bước tiếp theo'] || r['next_steps'] || '';
                const past_activities = r['hoạt động đã qua'] || r['past_activities'] || '';
                const related_data = r['số liệu liên quan'] || r['related_data'] || '';
                const working_dir = r['thư mục làm việc'] || r['working_dir'] || '';

                let activity_id = r['mã hoạt động (id)'] || r['activity_id'] || null;
                const actTitle = r['hoạt động liên kết'] || r['activity_title'] || r['activity'] || '';
                if (actTitle && !activity_id) {
                    const [actRows] = await conn.query('SELECT id FROM activities WHERE title = ? AND faculty_id = ? AND is_deleted = 0 LIMIT 1', [actTitle.trim(), facultyId]);
                    if (actRows.length > 0) {
                        activity_id = actRows[0].id;
                    }
                }

                const file_url = r['link tài liệu'] || r['file_url'] || '';

                if (!mou_code) {
                    throw new Error('Thiếu mã MOU');
                }

                const [existing] = await conn.query('SELECT id FROM mous WHERE mou_code = ? AND is_deleted = 0', [mou_code]);
                if (existing.length > 0) {
                    skipped++;
                    await conn.rollback();
                    conn.release();
                    continue;
                }

                await conn.query(`
                    INSERT INTO mous (
                        mou_code, enterprise_id, signing_date, partner_contact, org_type, country,
                        collaboration_scope, executing_unit_id, vlu_contact, tasks_ay24_25, next_steps, past_activities, related_data, working_dir, activity_id, file_url, faculty_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [mou_code, enterprise_id, signing_date, partner_contact, org_type, country, collaboration_scope, executing_unit_id, vlu_contact, tasks_ay24_25, next_steps, past_activities, related_data, working_dir, activity_id, file_url, facultyId]);
                
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

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getGenerativeModel() {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY chưa được cấu hình");
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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

3. Cột \`activity_type_names\` (Loại hoạt động): KHÔNG ĐƯỢC phân mạch chi tiết. BẮT BUỘC CHỈ CHỌN từ danh sách sau:
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
    const { rowText, companyName } = req.body;
    if (!rowText) return res.status(400).json({ message: "Missing rowText" });

    const facultyId = req.user.role === 'ADMIN'
        ? (req.body.faculty_id || req.body.facultyId || null)
        : req.user.faculty_id;

    try {
        // ── PRE-CHECK: bỏ qua ngay nếu công ty đã tồn tại, không tốn token AI ──
        if (companyName && companyName.trim()) {
            const [existing] = await pool.query(
                'SELECT id FROM enterprises WHERE name = ? AND (faculty_id = ? OR (faculty_id IS NULL AND ? IS NULL)) AND is_deleted = 0',
                [companyName.trim(), facultyId, facultyId]
            );
            if (existing.length > 0) {
                return res.status(409).json({ message: `Doanh nghiệp "${companyName.trim()}" đã tồn tại trong hệ thống (bỏ qua, không gọi AI).` });
            }
        }

        // ── GỌI AI ──
        let parsedData = null;
        const maxRetries = 3;
        let waitTime = 5000;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const model = getGenerativeModel();
                const result = await model.generateContent(system_prompt + "\nDỮ LIỆU ĐẦU VÀO:\n" + rowText);
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
                    console.log(`[⏳ CHỜ ĐỢI] Rate limit, thử lại sau ${waitTime}ms...`);
                    await delay(waitTime);
                    waitTime += 5000;
                } else {
                    return res.status(500).json({ message: "Lỗi AI Parsing: " + error.message });
                }
            }
        }

        if (!parsedData) {
            return res.status(500).json({ message: "Không thể parse dữ liệu sau nhiều lần thử." });
        }

        // ── LƯU VÀO DB ──
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
                    const [fRows] = await conn.query('SELECT id FROM fields WHERE name = ? AND (faculty_id = 0 OR faculty_id = ?)', [fn, facultyId || 0]);
                    if (fRows.length > 0) field_id = fRows[0].id;
                    else {
                        const [fRes] = await conn.query('INSERT INTO fields (name, faculty_id) VALUES (?, ?)', [fn, facultyId || 0]);
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

    } catch (outerError) {
        console.error("aiParseRow error:", outerError.message);
        if (!res.headersSent) {
            res.status(500).json({ message: "Lỗi xử lý: " + outerError.message });
        }
    }
};

const validateEnterprises = async (req, res) => {
    try {
        const rows = req.body.rows || [];
        const facultyId = req.user.role === 'ADMIN' ? (req.body.faculty_id || null) : req.user.faculty_id;
        const validatedRows = [];

        if (!facultyId) {
            return res.status(400).json({ message: "Thiếu thông tin Khoa quản lý." });
        }

        const conn = await pool.getConnection();
        try {
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i];
                const name = r['tên doanh nghiệp'] || r['name'] || r['ten_doanh_nghiep'];
                const tax_code = r['mã số thuế'] || r['tax_code'] || r['ma_so_thue'] || null;
                const scaleStr = r['quy mô'] || r['scale'] || '';
                const fieldStr = r['lĩnh vực'] || r['fields'] || '';
                const rep_full_name = r['họ và tên'] || r['rep_name'] || r['rep_full_name'] || null;
                const rep_phone = r['số điện thoại'] || r['rep_phone'] || null;
                const rep_email = r['email'] || r['rep_email'] || null;
                const building_street = r['địa chỉ'] || r['building_street'] || null;

                const errors = [];
                const warnings = [];
                let status = 'success';

                if (!name) {
                    errors.push('Thiếu Tên doanh nghiệp.');
                    status = 'error';
                }

                if (name) {
                    // Check duplicate
                    let checkQuery = 'SELECT id FROM enterprises WHERE (name = ?';
                    let checkParams = [name];
                    if (tax_code) {
                        checkQuery += ' OR tax_code = ?';
                        checkParams.push(tax_code);
                    }
                    checkQuery += ') AND (faculty_id = ? OR (faculty_id IS NULL AND ? IS NULL)) AND is_deleted = 0 LIMIT 1';
                    checkParams.push(facultyId, facultyId);

                    const [existing] = await conn.query(checkQuery, checkParams);
                    if (existing.length > 0) {
                        errors.push('Doanh nghiệp đã tồn tại trong Khoa này.');
                        status = 'duplicate';
                    }
                }

                if (status !== 'error' && status !== 'duplicate') {
                    if (!tax_code) warnings.push('Thiếu Mã số thuế.');
                    if (!scaleStr) warnings.push('Thiếu Quy mô doanh nghiệp.');
                    if (!fieldStr) warnings.push('Thiếu Lĩnh vực.');
                    if (!rep_full_name) warnings.push('Thiếu Họ tên người đại diện.');
                    if (!rep_phone && !rep_email) warnings.push('Thiếu Số điện thoại và Email liên hệ.');
                    if (!building_street) warnings.push('Thiếu Địa chỉ.');

                    if (warnings.length > 0) {
                        status = 'warning';
                    }
                }

                validatedRows.push({ row: r, status, errors, warnings });
            }
        } finally {
            conn.release();
        }

        res.json({ validatedRows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const validateActivities = async (req, res) => {
    try {
        const rows = req.body.rows || [];
        const facultyId = req.user.role === 'ADMIN' ? (req.body.faculty_id || null) : req.user.faculty_id;
        const validatedRows = [];

        if (!facultyId) {
            return res.status(400).json({ message: "Thiếu thông tin Khoa quản lý." });
        }

        const conn = await pool.getConnection();
        try {
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i];
                const title = r['tên hoạt động'] || r['title'] || r['ten_hoat_dong'];
                const entName = r['tên doanh nghiệp'] || r['enterprise_name'] || r['enterprise'] || '';
                let enterprise_id = r['mã doanh nghiệp (id)'] || r['enterprise_id'] || null;

                const errors = [];
                const warnings = [];
                let status = 'success';

                if (!title) {
                    errors.push('Thiếu Tên hoạt động.');
                    status = 'error';
                }

                // Check parent enterprise existence
                let matchedEntId = enterprise_id;
                if (entName && !matchedEntId) {
                    const [entRows] = await conn.query('SELECT id FROM enterprises WHERE name = ? AND faculty_id = ? AND is_deleted = 0 LIMIT 1', [entName.trim(), facultyId]);
                    if (entRows.length > 0) {
                        matchedEntId = entRows[0].id;
                    }
                }

                if (!matchedEntId) {
                    errors.push(`Doanh nghiệp "${entName || 'Chưa xác định'}" không tồn tại trên hệ thống. Cần import doanh nghiệp này trước.`);
                    status = 'error';
                }

                if (title && matchedEntId) {
                    // Check duplicate
                    const [existing] = await conn.query('SELECT id FROM activities WHERE title = ? AND enterprise_id = ? AND is_deleted = 0 LIMIT 1', [title, matchedEntId]);
                    if (existing.length > 0) {
                        errors.push('Hoạt động này đã được khởi tạo cho doanh nghiệp này.');
                        status = 'duplicate';
                    }
                }

                if (status !== 'error' && status !== 'duplicate') {
                    if (!r['loại hình'] && !r['type'] && !r['loai_hinh']) warnings.push('Thiếu Loại hình hoạt động.');
                    if (!r['đối tượng'] && !r['target']) warnings.push('Thiếu Đối tượng tham gia.');
                    if (!r['ngày bắt đầu'] && !r['start_date'] && !r['ngay_bat_dau']) warnings.push('Thiếu Ngày bắt đầu.');
                    
                    if (warnings.length > 0) {
                        status = 'warning';
                    }
                }

                validatedRows.push({ row: r, status, errors, warnings });
            }
        } finally {
            conn.release();
        }

        res.json({ validatedRows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const validateMous = async (req, res) => {
    try {
        const rows = req.body.rows || [];
        const facultyId = req.user.role === 'ADMIN' ? (req.body.faculty_id || null) : req.user.faculty_id;
        const validatedRows = [];

        if (!facultyId) {
            return res.status(400).json({ message: "Thiếu thông tin Khoa quản lý." });
        }

        const conn = await pool.getConnection();
        try {
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i];
                const mou_code = r['mã mou'] || r['mou_code'] || r['ma_mou'];
                const entName = r['tên doanh nghiệp'] || r['enterprise_name'] || r['enterprise'] || '';
                let enterprise_id = r['mã doanh nghiệp (id)'] || r['enterprise_id'] || null;
                const deptName = r['bộ môn triển khai'] || r['executing_unit_name'] || '';
                let executing_unit_id = r['bộ môn id'] || r['executing_unit_id'] || null;

                const errors = [];
                const warnings = [];
                let status = 'success';

                if (!mou_code) {
                    errors.push('Thiếu Mã MOU.');
                    status = 'error';
                }

                // Check enterprise dependency
                let matchedEntId = enterprise_id;
                if (entName && !matchedEntId) {
                    const [entRows] = await conn.query('SELECT id FROM enterprises WHERE name = ? AND faculty_id = ? AND is_deleted = 0 LIMIT 1', [entName.trim(), facultyId]);
                    if (entRows.length > 0) {
                        matchedEntId = entRows[0].id;
                    }
                }

                if (!matchedEntId) {
                    errors.push(`Doanh nghiệp "${entName || 'Chưa xác định'}" không tồn tại trên hệ thống. Cần import doanh nghiệp này trước.`);
                    status = 'error';
                }

                // Check executing unit (department) dependency
                if (deptName && !executing_unit_id) {
                    const [deptRows] = await conn.query('SELECT id FROM departments WHERE name LIKE ? AND faculty_id = ? LIMIT 1', [`%${deptName}%`, facultyId]);
                    if (deptRows.length === 0) {
                        warnings.push(`Bộ môn triển khai "${deptName}" không tồn tại trên hệ thống.`);
                    }
                }

                // Check activity dependency if provided
                const actTitle = r['hoạt động liên kết'] || r['activity_title'] || r['activity'] || '';
                let activity_id = r['mã hoạt động (id)'] || r['activity_id'] || null;
                if ((actTitle || activity_id) && status !== 'error') {
                    let matchedActId = activity_id;
                    if (actTitle && !matchedActId) {
                        const [actRows] = await conn.query('SELECT id FROM activities WHERE title = ? AND faculty_id = ? AND is_deleted = 0 LIMIT 1', [actTitle.trim(), facultyId]);
                        if (actRows.length > 0) {
                            matchedActId = actRows[0].id;
                        }
                    }
                    if (!matchedActId) {
                        errors.push(`Hoạt động "${actTitle || 'Chưa xác định'}" không tồn tại trên hệ thống. Cần import hoạt động này trước.`);
                        status = 'error';
                    }
                }

                if (mou_code) {
                    // Check duplicate
                    const [existing] = await conn.query('SELECT id FROM mous WHERE mou_code = ? AND is_deleted = 0 LIMIT 1', [mou_code]);
                    if (existing.length > 0) {
                        errors.push('Mã MOU đã tồn tại trên hệ thống.');
                        status = 'duplicate';
                    }
                }

                if (status !== 'error' && status !== 'duplicate') {
                    if (!r['ngày ký'] && !r['signing_date'] && !r['ngay_ky']) warnings.push('Thiếu Ngày ký kết.');
                    if (!r['đầu mối đối tác'] && !r['partner_contact']) warnings.push('Thiếu Thông tin đầu mối đối tác.');
                    if (!r['đầu mối vlu'] && !r['vlu_contact']) warnings.push('Thiếu Thông tin đầu mối VLU.');
                    if (!r['mảng hợp tác'] && !r['collaboration_scope']) warnings.push('Thiếu Mảng hợp tác.');

                    if (warnings.length > 0) {
                        status = 'warning';
                    }
                }

                validatedRows.push({ row: r, status, errors, warnings });
            }
        } finally {
            conn.release();
        }

        res.json({ validatedRows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const validateStudents = async (req, res) => {
    try {
        const rows = req.body.rows || [];
        const facultyId = req.user.role === 'ADMIN' ? (req.body.faculty_id || null) : req.user.faculty_id;
        const validatedRows = [];

        if (!facultyId) {
            return res.status(400).json({ message: "Thiếu thông tin Khoa quản lý." });
        }

        const conn = await pool.getConnection();
        try {
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i];
                const student_code = r['mssv'] || r['student_code'];
                const name = r['họ tên'] || r['name'] || r['ho_ten'];
                const actTitle = r['hoạt động tham gia'] || r['activity_title'] || r['activity'] || '';
                let activity_id = r['mã hoạt động (id)'] || r['activity_id'] || null;

                const errors = [];
                const warnings = [];
                let status = 'success';

                if (!student_code || !name) {
                    errors.push('Thiếu MSSV hoặc Họ tên sinh viên.');
                    status = 'error';
                }

                // Check activity dependency if provided
                if ((actTitle || activity_id) && status !== 'error') {
                    let matchedActId = activity_id;
                    if (actTitle && !matchedActId) {
                        const [actRows] = await conn.query('SELECT id FROM activities WHERE title = ? AND faculty_id = ? AND is_deleted = 0 LIMIT 1', [actTitle.trim(), facultyId]);
                        if (actRows.length > 0) {
                            matchedActId = actRows[0].id;
                        }
                    }

                    if (!matchedActId) {
                        errors.push(`Hoạt động "${actTitle || 'Chưa xác định'}" không tồn tại trên hệ thống. Cần import hoạt động này trước.`);
                        status = 'error';
                    }
                }

                if (student_code) {
                    // Check duplicate
                    const [existing] = await conn.query('SELECT id FROM students WHERE student_code = ? AND is_deleted = 0 LIMIT 1', [student_code]);
                    if (existing.length > 0) {
                        errors.push('Sinh viên với MSSV này đã tồn tại trên hệ thống.');
                        status = 'duplicate';
                    }
                }

                if (status !== 'error' && status !== 'duplicate') {
                    if (!r['lớp'] && !r['class'] && !r['lop']) warnings.push('Thiếu lớp học.');
                    if (!r['ngành học'] && !r['major'] && !r['nganh_hoc']) warnings.push('Thiếu Ngành học.');
                    if (!r['gpa']) warnings.push('Thiếu Điểm GPA.');

                    if (warnings.length > 0) {
                        status = 'warning';
                    }
                }

                validatedRows.push({ row: r, status, errors, warnings });
            }
        } finally {
            conn.release();
        }

        res.json({ validatedRows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { upload, importEnterprises, importActivities, importStudents, importMous, aiParseRow, validateEnterprises, validateActivities, validateMous, validateStudents };
