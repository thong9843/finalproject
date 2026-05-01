const pool = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        let query = `
            SELECT s.*, 
                   e.name as enterprise_name, 
                   f.name as faculty_name
            FROM students s 
            LEFT JOIN enterprises e ON s.enterprise_id = e.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            WHERE 1=1`;
        let params = [];

        if (req.user.role !== 'ADMIN') {
            query += ' AND s.faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        const { status: statusFilter, search, enterprise_id, major, date_from, date_to, sort_by, sort_order } = req.query;

        if (statusFilter) {
            query += ' AND s.status = ?';
            params.push(statusFilter);
        }

        if (search) {
            query += ' AND (s.student_code LIKE ? OR s.name LIKE ? OR s.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (enterprise_id) {
            query += ' AND s.enterprise_id = ?';
            params.push(enterprise_id);
        }

        if (major) {
            query += ' AND s.major = ?';
            params.push(major);
        }

        if (date_from) {
            query += ' AND s.start_date >= ?';
            params.push(date_from);
        }
        if (date_to) {
            query += ' AND s.start_date <= ?';
            params.push(date_to);
        }

        // Sorting
        const allowedSortColumns = {
            'name': 's.name',
            'student_code': 's.student_code',
            'gpa': 's.gpa',
            'start_date': 's.start_date',
            'created_at': 's.created_at'
        };
        const sortCol = allowedSortColumns[sort_by] || 's.created_at';
        const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortCol} ${sortDir}`;

        const [students] = await pool.query(query, params);
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        let facultyFilter = '';
        let params = [];
        if (req.user.role !== 'ADMIN') {
            facultyFilter = ' AND faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        const [active] = await pool.query(
            `SELECT COUNT(*) as count FROM students WHERE status = 'Đang thực tập' ${facultyFilter}`, params);
        const [pending] = await pool.query(
            `SELECT COUNT(*) as count FROM students WHERE status = 'Chờ phân công' ${facultyFilter}`, params);
        const [completed] = await pool.query(
            `SELECT COUNT(*) as count FROM students WHERE status = 'Hoàn thành' ${facultyFilter}`, params);

        res.status(200).json({
            active: active[0].count,
            pending: pending[0].count,
            completed: completed[0].count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { student_code, name, email, class: className, major, advisor, activity_id, enterprise_id, position, status, gpa, start_date, end_date, faculty_id } = req.body;
        const finalFacultyId = req.user.role === 'ADMIN' ? faculty_id : req.user.faculty_id;

        const [result] = await pool.query(
            `INSERT INTO students (student_code, name, email, class, major, advisor, activity_id, enterprise_id, position, status, gpa, start_date, end_date, faculty_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_code, name, email, className, major, advisor, activity_id || null, enterprise_id || null, position, status || 'Chờ phân công', gpa, start_date, end_date, finalFacultyId]
        );
        res.status(201).json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const { student_code, name, email, class: className, major, advisor, activity_id, enterprise_id, position, status, gpa, start_date, end_date } = req.body;

        let checkQuery = 'SELECT * FROM students WHERE id = ?';
        let checkParams = [id];
        if (req.user.role !== 'ADMIN') {
            checkQuery += ' AND faculty_id = ?';
            checkParams.push(req.user.faculty_id);
        }

        const [existing] = await pool.query(checkQuery, checkParams);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Student not found or unauthorized' });
        }

        await pool.query(
            `UPDATE students SET student_code=?, name=?, email=?, class=?, major=?, advisor=?, activity_id=?, enterprise_id=?, position=?, status=?, gpa=?, start_date=?, end_date=? WHERE id=?`,
            [student_code, name, email, className, major, advisor, activity_id || null, enterprise_id || null, position, status, gpa, start_date, end_date, id]
        );
        res.status(200).json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const id = req.params.id;
        let query = 'DELETE FROM students WHERE id = ?';
        let params = [id];

        if (req.user.role !== 'ADMIN') {
            query += ' AND faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found or unauthorized' });
        }
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
