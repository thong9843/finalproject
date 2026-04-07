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
            try {
                const name = r['Tên doanh nghiệp'] || r['name'] || r['ten_doanh_nghiep'];
                const tax_code = r['Mã số thuế'] || r['tax_code'] || r['ma_so_thue'] || '';
                const industry = r['Lĩnh vực'] || r['industry'] || r['linh_vuc'] || '';
                const address = r['Địa chỉ'] || r['address'] || r['dia_chi'] || '';
                const email = r['Email'] || r['email'] || '';
                const phone = r['Số điện thoại'] || r['phone'] || r['so_dien_thoai'] || '';
                const status = r['Trạng thái'] || r['status'] || 'Tiềm năng';

                if (!name) { errors.push(`Dòng ${i + 2}: Thiếu tên doanh nghiệp`); continue; }

                const facultyId = req.user.role === 'ADMIN' ? (r['faculty_id'] || null) : req.user.faculty_id;

                await pool.query(
                    'INSERT INTO enterprises (name, tax_code, industry, address, email, phone, status, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [name, tax_code, industry, address, email, phone, status, facultyId]
                );
                inserted++;
            } catch (e) {
                errors.push(`Dòng ${i + 2}: ${e.message}`);
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
            try {
                const title = r['Tên hoạt động'] || r['title'] || r['ten_hoat_dong'];
                const enterprise_id = r['enterprise_id'] || r['ma_doanh_nghiep'];
                const type = r['Loại hình'] || r['type'] || r['loai_hinh'] || 'Khác';
                const description = r['Mô tả'] || r['description'] || r['mo_ta'] || '';
                const start_date = r['Ngày bắt đầu'] || r['start_date'] || r['ngay_bat_dau'] || null;
                const end_date = r['Ngày kết thúc'] || r['end_date'] || r['ngay_ket_thuc'] || null;
                const status = r['Trạng thái'] || r['status'] || 'Chờ triển khai';

                if (!title) { errors.push(`Dòng ${i + 2}: Thiếu tên hoạt động`); continue; }
                if (!enterprise_id) { errors.push(`Dòng ${i + 2}: Thiếu mã doanh nghiệp`); continue; }

                const facultyId = req.user.role === 'ADMIN' ? (r['faculty_id'] || null) : req.user.faculty_id;

                await pool.query(
                    'INSERT INTO activities (enterprise_id, title, type, description, start_date, end_date, status, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [enterprise_id, title, type, description, start_date, end_date, status, facultyId]
                );
                inserted++;
            } catch (e) {
                errors.push(`Dòng ${i + 2}: ${e.message}`);
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
                const enterprise_id = r['enterprise_id'] || r['ma_doanh_nghiep'] || null;
                const position = r['Vị trí'] || r['position'] || r['vi_tri'] || '';
                const status = r['Trạng thái'] || r['status'] || 'Chờ phân công';
                const gpa = r['GPA'] || r['gpa'] || null;
                const start_date = r['Ngày bắt đầu'] || r['start_date'] || r['ngay_bat_dau'] || null;
                const end_date = r['Ngày kết thúc'] || r['end_date'] || r['ngay_ket_thuc'] || null;

                if (!student_code || !name) { errors.push(`Dòng ${i + 2}: Thiếu MSSV hoặc Họ tên`); continue; }

                const facultyId = req.user.role === 'ADMIN' ? (r['faculty_id'] || null) : req.user.faculty_id;

                await pool.query(
                    `INSERT INTO students (student_code, name, email, class, major, advisor, enterprise_id, position, status, gpa, start_date, end_date, faculty_id) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [student_code, name, email, className, major, advisor, enterprise_id, position, status, gpa, start_date, end_date, facultyId]
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
