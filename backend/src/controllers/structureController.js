const pool = require('../config/db');

exports.getClusters = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clusters ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDepartments = async (req, res) => {
    try {
        let query = 'SELECT d.*, f.name AS faculty_name FROM departments d LEFT JOIN faculties f ON d.faculty_id = f.id';
        let params = [];
        if (req.user && req.user.role !== 'ADMIN') {
            query += ' WHERE d.faculty_id = ?';
            params.push(req.user.faculty_id);
        }
        query += ' ORDER BY d.name ASC';
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getActivityTypes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM act_types ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getScales = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM scales ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFields = async (req, res) => {
    try {
        let query = 'SELECT f.*, fac.name AS faculty_name FROM fields f LEFT JOIN faculties fac ON f.faculty_id = fac.id';
        let params = [];
        if (req.user && req.user.role !== 'ADMIN') {
            query += ' WHERE f.faculty_id = 0 OR f.faculty_id = ?';
            params.push(req.user.faculty_id);
        }
        query += ' ORDER BY f.id ASC';
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getActTypes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM act_types ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTargets = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM targets ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFaculties = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM faculties ORDER BY name ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Activity Types CRUD
exports.createActivityType = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên loại hoạt động không được để trống' });
        const [result] = await pool.query('INSERT INTO act_types (name) VALUES (?)', [name]);
        res.status(201).json({ message: 'Thêm mới thành công', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateActivityType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên loại hoạt động không được để trống' });
        const [result] = await pool.query('UPDATE act_types SET name = ? WHERE id = ?', [name, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy loại hoạt động' });
        }
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteActivityType = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM act_types WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy loại hoạt động' });
        }
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({ message: 'Không thể xóa loại hoạt động này vì đã được sử dụng ở dữ liệu khác' });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};

// Fields CRUD
exports.createField = async (req, res) => {
    try {
        const { name, faculty_id } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên lĩnh vực không được để trống' });

        let finalFacultyId = faculty_id;
        if (req.user.role !== 'ADMIN') {
            finalFacultyId = req.user.faculty_id;
        } else if (finalFacultyId === undefined) {
            finalFacultyId = 0; // Default to shared (0) for admin
        }

        const [result] = await pool.query('INSERT INTO fields (name, faculty_id) VALUES (?, ?)', [name, finalFacultyId]);
        res.status(201).json({ message: 'Thêm mới thành công', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateField = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, faculty_id } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên lĩnh vực không được để trống' });

        // Check ownership if not admin
        if (req.user.role !== 'ADMIN') {
            const [field] = await pool.query('SELECT faculty_id FROM fields WHERE id = ?', [id]);
            if (field.length === 0) return res.status(404).json({ message: 'Không tìm thấy lĩnh vực' });
            if (field[0].faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa lĩnh vực của khoa khác hoặc lĩnh vực dùng chung' });
            }
        }

        let query = 'UPDATE fields SET name = ?';
        let params = [name];
        
        if (req.user.role === 'ADMIN' && faculty_id !== undefined) {
            query += ', faculty_id = ?';
            params.push(faculty_id);
        }
        
        query += ' WHERE id = ?';
        params.push(id);

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lĩnh vực' });
        }
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete field
exports.deleteField = async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership if not admin
        if (req.user.role !== 'ADMIN') {
            const [field] = await pool.query('SELECT faculty_id FROM fields WHERE id = ?', [id]);
            if (field.length === 0) return res.status(404).json({ message: 'Không tìm thấy lĩnh vực' });
            if (field[0].faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ message: 'Bạn không có quyền xóa lĩnh vực của khoa khác hoặc lĩnh vực dùng chung' });
            }
        }

        const [result] = await pool.query('DELETE FROM fields WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lĩnh vực' });
        }
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({ message: 'Không thể xóa lĩnh vực này vì đã được sử dụng ở dữ liệu khác' });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};

// Departments CRUD
exports.createDepartment = async (req, res) => {
    try {
        const { name, faculty_id } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên bộ môn không được để trống' });
        
        let finalFacultyId = faculty_id;
        if (req.user.role !== 'ADMIN') {
            finalFacultyId = req.user.faculty_id;
        }
        
        if (!finalFacultyId) {
            return res.status(400).json({ message: 'Vui lòng xác định Khoa cho bộ môn' });
        }

        const [result] = await pool.query('INSERT INTO departments (name, faculty_id) VALUES (?, ?)', [name, finalFacultyId]);
        res.status(201).json({ message: 'Thêm mới thành công', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, faculty_id } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên bộ môn không được để trống' });

        // Check ownership if not admin
        if (req.user.role !== 'ADMIN') {
            const [dept] = await pool.query('SELECT faculty_id FROM departments WHERE id = ?', [id]);
            if (dept.length === 0) return res.status(404).json({ message: 'Không tìm thấy bộ môn' });
            if (dept[0].faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bộ môn của khoa khác' });
            }
        }

        let query = 'UPDATE departments SET name = ?';
        let params = [name];
        
        if (req.user.role === 'ADMIN' && faculty_id) {
            query += ', faculty_id = ?';
            params.push(faculty_id);
        }
        
        query += ' WHERE id = ?';
        params.push(id);

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bộ môn' });
        }
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership if not admin
        if (req.user.role !== 'ADMIN') {
            const [dept] = await pool.query('SELECT faculty_id FROM departments WHERE id = ?', [id]);
            if (dept.length === 0) return res.status(404).json({ message: 'Không tìm thấy bộ môn' });
            if (dept[0].faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ message: 'Bạn không có quyền xóa bộ môn của khoa khác' });
            }
        }

        const [result] = await pool.query('DELETE FROM departments WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bộ môn' });
        }
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({ message: 'Không thể xóa bộ môn này vì đã được sử dụng ở dữ liệu khác' });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};

