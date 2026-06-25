const pool = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        let query = `
            SELECT s.*, 
                   e.name as enterprise_name, 
                   f.name as faculty_name,
                   a.title as activity_title,
                   TIMESTAMPDIFF(MONTH, s.start_date, s.end_date) as duration_months
            FROM students s 
            LEFT JOIN enterprises e ON s.enterprise_id = e.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN activities a ON s.activity_id = a.id
            WHERE s.is_deleted = ?`;
        const showDeleted = req.query.is_deleted === '1' || req.query.is_deleted === 'true';
        let params = [showDeleted ? 1 : 0];

        if (req.user.role !== 'ADMIN') {
            query += ' AND s.faculty_id = ?';
            params.push(req.user.faculty_id);
        } else if (req.query.faculty_id) {
            query += ' AND s.faculty_id = ?';
            params.push(req.query.faculty_id);
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
            `SELECT COUNT(*) as count FROM students WHERE status = 'Đang thực tập' AND is_deleted = 0 ${facultyFilter}`, params);
        const [pending] = await pool.query(
            `SELECT COUNT(*) as count FROM students WHERE status = 'Chờ phân công' AND is_deleted = 0 ${facultyFilter}`, params);
        const [completed] = await pool.query(
            `SELECT COUNT(*) as count FROM students WHERE status = 'Hoàn thành' AND is_deleted = 0 ${facultyFilter}`, params);

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

        if (student_code) {
            const [existingCode] = await pool.query(
                'SELECT id FROM students WHERE student_code = ? AND is_deleted = 0',
                [student_code]
            );
            if (existingCode.length > 0) {
                return res.status(400).json({ message: 'Mã số sinh viên đã tồn tại trong hệ thống.' });
            }
        }

        const [result] = await pool.query(
            `INSERT INTO students (student_code, name, email, class, major, advisor, activity_id, enterprise_id, position, status, gpa, start_date, end_date, faculty_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_code, name, email, className, major, advisor, activity_id || null, enterprise_id || null, position, status || 'Chờ phân công', gpa, start_date, end_date, finalFacultyId]
        );
        const studentId = result.insertId;

        // Log creation
        const [newStudent] = await pool.query('SELECT * FROM students WHERE id = ?', [studentId]);
        const historyHelper = require('../utils/historyHelper');
        await historyHelper.logCreate(pool, {
            entityType: 'STUDENT',
            entityId: studentId,
            entityName: name,
            facultyId: finalFacultyId,
            changedBy: req.user.id,
            newValue: { student: newStudent[0] }
        });

        res.status(201).json({ id: studentId, message: 'Created successfully' });
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

        if (student_code) {
            const [existingCode] = await pool.query(
                'SELECT id FROM students WHERE student_code = ? AND id != ? AND is_deleted = 0',
                [student_code, id]
            );
            if (existingCode.length > 0) {
                return res.status(400).json({ message: 'Mã số sinh viên đã tồn tại trong hệ thống.' });
            }
        }

        // Fetch old values
        const [oldStudent] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
        const oldValue = { student: oldStudent[0] };

        await pool.query(
            `UPDATE students SET student_code=?, name=?, email=?, class=?, major=?, advisor=?, activity_id=?, enterprise_id=?, position=?, status=?, gpa=?, start_date=?, end_date=? WHERE id=?`,
            [student_code, name, email, className, major, advisor, activity_id || null, enterprise_id || null, position, status, gpa, start_date, end_date, id]
        );

        // Fetch new values
        const [newStudent] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
        const newValue = { student: newStudent[0] };

        const historyHelper = require('../utils/historyHelper');
        await historyHelper.logUpdate(pool, {
            entityType: 'STUDENT',
            entityId: id,
            entityName: name,
            facultyId: oldStudent[0].faculty_id,
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
        const id = req.params.id;
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
        const student = existing[0];

        if (student.is_deleted === 1) {
            return res.status(400).json({ message: 'Sinh viên này đã được xóa trước đó.' });
        }

        const oldValue = { student };

        // Soft delete
        await pool.query('UPDATE students SET is_deleted = 1 WHERE id = ?', [id]);

        const historyHelper = require('../utils/historyHelper');
        await historyHelper.logDelete(pool, {
            entityType: 'STUDENT',
            entityId: id,
            entityName: student.name,
            facultyId: student.faculty_id,
            changedBy: req.user.id,
            oldValue
        });

        res.status(200).json({ message: 'Deleted successfully (soft delete)' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.restore = async (req, res) => {
    try {
        const id = req.params.id;
        const [logRows] = await pool.query(
            'SELECT id FROM action_history WHERE entity_type = "STUDENT" AND entity_id = ? AND action_type = "DELETE" ORDER BY created_at DESC LIMIT 1',
            [id]
        );
        if (logRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lịch sử xóa để khôi phục sinh viên này.' });
        }
        req.params.id = logRows[0].id;
        const historyController = require('./historyController');
        return historyController.restore(req, res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
