const pool = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        let query = 'SELECT e.*, f.name as faculty_name FROM enterprises e LEFT JOIN faculties f ON e.faculty_id = f.id WHERE 1=1';
        let params = [];
        
        if (req.user.role !== 'ADMIN') {
            query += ' AND e.faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        const status = req.query.status;
        if (status) {
            query += ' AND e.status = ?';
            params.push(status);
        }

        const [enterprises] = await pool.query(query, params);
        res.status(200).json(enterprises);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const id = req.params.id;
        let query = 'SELECT e.*, f.name as faculty_name FROM enterprises e LEFT JOIN faculties f ON e.faculty_id = f.id WHERE e.id = ?';
        let params = [id];

        if (req.user.role !== 'ADMIN') {
            query += ' AND e.faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        const [enterprises] = await pool.query(query, params);
        if (enterprises.length === 0) {
            return res.status(404).json({ message: 'Enterprise not found' });
        }

        // Fetch activities
        const [activities] = await pool.query('SELECT * FROM activities WHERE enterprise_id = ? ORDER BY created_at DESC', [id]);
        
        res.status(200).json({ ...enterprises[0], activities });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, tax_code, industry, address, email, phone, status, faculty_id } = req.body;
        
        const finalFacultyId = req.user.role === 'ADMIN' ? faculty_id : req.user.faculty_id;

        const [result] = await pool.query(
            'INSERT INTO enterprises (name, tax_code, industry, address, email, phone, status, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, tax_code, industry, address, email, phone, status || 'Tiềm năng', finalFacultyId]
        );
        res.status(201).json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, tax_code, industry, address, email, phone, status, faculty_id } = req.body;

        // Check ownership
        let checkQuery = 'SELECT status FROM enterprises WHERE id = ?';
        let checkParams = [id];
        if (req.user.role !== 'ADMIN') {
            checkQuery += ' AND faculty_id = ?';
            checkParams.push(req.user.faculty_id);
        }
        
        const [existing] = await pool.query(checkQuery, checkParams);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Enterprise not found or unauthorized' });
        }

        const oldStatus = existing[0].status;
        let collaboration_dateQueryPart = '';
        if (status === 'Đang hợp tác' && oldStatus !== 'Đang hợp tác') {
            collaboration_dateQueryPart = ', collaboration_date = CURRENT_DATE()';
        } else if (status !== 'Đang hợp tác') {
            // Might need to reset or keep it, usually we keep it or set to NULL. Better keep it for history or let user decide
            // But logic says: "Khi cập nhật doanh nghiệp sang 'Đang hợp tác', hệ thống tự động ghi nhận ngày hiện tại làm collaboration_date"
        }

        const query = `UPDATE enterprises SET name=?, tax_code=?, industry=?, address=?, email=?, phone=?, status=? ${collaboration_dateQueryPart} WHERE id=?`;
        await pool.query(query, [name, tax_code, industry, address, email, phone, status, id]);
        
        res.status(200).json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const id = req.params.id;
        let query = 'DELETE FROM enterprises WHERE id = ?';
        let params = [id];

        if (req.user.role !== 'ADMIN') {
            query += ' AND faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Enterprise not found or unauthorized' });
        }

        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
