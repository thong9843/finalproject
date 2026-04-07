const pool = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        let query = `
            SELECT a.*, e.name as enterprise_name, f.name as faculty_name,
            (SELECT COUNT(*) FROM students s WHERE s.activity_id = a.id) as student_count
            FROM activities a 
            JOIN enterprises e ON a.enterprise_id = e.id 
            LEFT JOIN faculties f ON a.faculty_id = f.id 
            WHERE 1=1`;
        let params = [];
        
        if (req.user.role !== 'ADMIN') {
            query += ' AND a.faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        const [activities] = await pool.query(query, params);
        res.status(200).json(activities);
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

        const [active] = await pool.query(`SELECT COUNT(*) as count FROM activities WHERE status = 'Đã triển khai' ${facultyFilter}`, params);
        const [completed] = await pool.query(`SELECT COUNT(*) as count FROM activities WHERE status = 'Đã kết thúc' ${facultyFilter}`, params);
        const [pending] = await pool.query(`SELECT COUNT(*) as count FROM activities WHERE status IN ('Đề xuất', 'Phê duyệt nội bộ') ${facultyFilter}`, params);
        const [students] = await pool.query(`
            SELECT COUNT(s.id) as count 
            FROM students s 
            JOIN activities a ON s.activity_id = a.id 
            WHERE 1=1 ${facultyFilter}`, params);

        res.status(200).json({
            active: active[0].count,
            completed: completed[0].count,
            pending: pending[0].count,
            totalStudents: students[0].count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { enterprise_id, title, type, description, start_date, end_date, start_time, end_time, person_in_charge, tasks, status, faculty_id } = req.body;
        const finalFacultyId = req.user.role === 'ADMIN' ? faculty_id : req.user.faculty_id;

        const tasksJson = tasks ? JSON.stringify(tasks) : null;

        const [result] = await pool.query(
            'INSERT INTO activities (enterprise_id, title, type, description, start_date, end_date, start_time, end_time, person_in_charge, tasks, status, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [enterprise_id, title, type, description, start_date, end_date, start_time || null, end_time || null, person_in_charge || null, tasksJson, status || 'Tiềm năng', finalFacultyId]
        );
        res.status(201).json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;

        let checkQuery = 'SELECT * FROM activities WHERE id = ?';
        let checkParams = [id];
        if (req.user.role !== 'ADMIN') {
            checkQuery += ' AND faculty_id = ?';
            checkParams.push(req.user.faculty_id);
        }

        const [existing] = await pool.query(checkQuery, checkParams);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Activity not found or unauthorized' });
        }

        const oldStatus = existing[0].status;

        await pool.query('UPDATE activities SET status = ? WHERE id = ?', [status, id]);

        if (status !== oldStatus) {
            await pool.query(
                'INSERT INTO workflow_history (entity_type, entity_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?, ?)',
                ['ACTIVITY', id, oldStatus, status, req.user.id]
            );
        }

res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, type, description, start_date, end_date, start_time, end_time, person_in_charge, tasks, status } = req.body;
        
        let checkQuery = 'SELECT * FROM activities WHERE id = ?';
        let checkParams = [id];
        if (req.user.role !== 'ADMIN') {
            checkQuery += ' AND faculty_id = ?';
            checkParams.push(req.user.faculty_id);
        }

        const [existing] = await pool.query(checkQuery, checkParams);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Activity not found or unauthorized' });
        }

        const tasksJson = tasks ? JSON.stringify(tasks) : null;
        
        await pool.query(
            'UPDATE activities SET title=?, type=?, description=?, start_date=?, end_date=?, start_time=?, end_time=?, person_in_charge=?, tasks=?, status=? WHERE id=?',
            [title, type, description, start_date, end_date, start_time || null, end_time || null, person_in_charge || null, tasksJson, status, id]
        );
        res.status(200).json({ message: 'Activity updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUpcoming = async (req, res) => {
    try {
        let query = `
            SELECT a.*, e.name as enterprise_name 
            FROM activities a 
            JOIN enterprises e ON a.enterprise_id = e.id 
            WHERE a.start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
        `;
        let params = [];
        
        if (req.user.role !== 'ADMIN') {
            query += ' AND a.faculty_id = ?';
            params.push(req.user.faculty_id);
        }
        
        query += ' ORDER BY a.start_date ASC';

        const [activities] = await pool.query(query, params);
        res.status(200).json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
