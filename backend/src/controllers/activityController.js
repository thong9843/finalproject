const pool = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        let query = `
            SELECT a.*, e.name as enterprise_name, f.name as faculty_name,
                GROUP_CONCAT(DISTINCT act.name ORDER BY act.name SEPARATOR ', ') as type_names,
                GROUP_CONCAT(DISTINCT act.id ORDER BY act.id SEPARATOR ',') as type_ids,
                GROUP_CONCAT(DISTINCT tgt.name ORDER BY tgt.name SEPARATOR ', ') as target_names,
                GROUP_CONCAT(DISTINCT tgt.id ORDER BY tgt.id SEPARATOR ',') as target_ids,
                (SELECT COUNT(*) FROM students s WHERE s.activity_id = a.id) as student_count
            FROM activities a
            JOIN enterprises e ON a.enterprise_id = e.id
            LEFT JOIN faculties f ON a.faculty_id = f.id
            LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
            LEFT JOIN act_types act ON act.id = atm.type_id
            LEFT JOIN activity_target_map atrm ON atrm.activity_id = a.id
            LEFT JOIN targets tgt ON tgt.id = atrm.target_id
            WHERE 1=1`;
        let params = [];

        if (req.user.role !== 'ADMIN') {
            query += ' AND a.faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        query += ' GROUP BY a.id ORDER BY a.created_at DESC';

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
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            enterprise_id, title, detail, start_date, end_date,
            start_time, end_time, person_in_charge, tasks,
            collaboration_date, status, faculty_id,
            type_ids, target_ids
        } = req.body;

        const finalFacultyId = req.user.role === 'ADMIN' ? faculty_id : req.user.faculty_id;
        const tasksJson = tasks ? JSON.stringify(tasks) : null;

        const [result] = await conn.query(
            `INSERT INTO activities (enterprise_id, title, detail, start_date, end_date,
             start_time, end_time, person_in_charge, tasks, collaboration_date, status, faculty_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [enterprise_id, title, detail || null, start_date || null, end_date || null,
             start_time || null, end_time || null, person_in_charge || null,
             tasksJson, collaboration_date || null, status || 'Đề xuất', finalFacultyId]
        );
        const activityId = result.insertId;

        if (type_ids && type_ids.length > 0) {
            for (const tid of type_ids) {
                await conn.query(
                    'INSERT IGNORE INTO activity_type_map (activity_id, type_id) VALUES (?, ?)',
                    [activityId, tid]
                );
            }
        }

        if (target_ids && target_ids.length > 0) {
            for (const tgid of target_ids) {
                await conn.query(
                    'INSERT IGNORE INTO activity_target_map (activity_id, target_id) VALUES (?, ?)',
                    [activityId, tgid]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ id: activityId, message: 'Created successfully' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

exports.update = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const id = req.params.id;
        const {
            title, detail, start_date, end_date, start_time, end_time,
            person_in_charge, tasks, collaboration_date, status,
            type_ids, target_ids
        } = req.body;

        let checkQuery = 'SELECT * FROM activities WHERE id = ?';
        let checkParams = [id];
        if (req.user.role !== 'ADMIN') {
            checkQuery += ' AND faculty_id = ?';
            checkParams.push(req.user.faculty_id);
        }

        const [existing] = await conn.query(checkQuery, checkParams);
        if (existing.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Activity not found or unauthorized' });
        }

        const tasksJson = tasks ? JSON.stringify(tasks) : null;

        await conn.query(
            `UPDATE activities SET title=?, detail=?, start_date=?, end_date=?,
             start_time=?, end_time=?, person_in_charge=?, tasks=?,
             collaboration_date=?, status=? WHERE id=?`,
            [title, detail || null, start_date || null, end_date || null,
             start_time || null, end_time || null, person_in_charge || null,
             tasksJson, collaboration_date || null, status, id]
        );

        await conn.query('DELETE FROM activity_type_map WHERE activity_id = ?', [id]);
        if (type_ids && type_ids.length > 0) {
            for (const tid of type_ids) {
                await conn.query(
                    'INSERT IGNORE INTO activity_type_map (activity_id, type_id) VALUES (?, ?)',
                    [id, tid]
                );
            }
        }

        await conn.query('DELETE FROM activity_target_map WHERE activity_id = ?', [id]);
        if (target_ids && target_ids.length > 0) {
            for (const tgid of target_ids) {
                await conn.query(
                    'INSERT IGNORE INTO activity_target_map (activity_id, target_id) VALUES (?, ?)',
                    [id, tgid]
                );
            }
        }

        await conn.commit();
        res.status(200).json({ message: 'Activity updated successfully' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
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

exports.remove = async (req, res) => {
    try {
        const id = req.params.id;
        let query = 'DELETE FROM activities WHERE id = ?';
        let params = [id];

        if (req.user.role !== 'ADMIN') {
            query += ' AND faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Activity not found or unauthorized' });
        }
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUpcoming = async (req, res) => {
    try {
        let query = `
            SELECT a.*, e.name as enterprise_name,
                GROUP_CONCAT(DISTINCT act.name SEPARATOR ', ') as type_names
            FROM activities a
            JOIN enterprises e ON a.enterprise_id = e.id
            LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
            LEFT JOIN act_types act ON act.id = atm.type_id
            WHERE a.start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)`;
        let params = [];

        if (req.user.role !== 'ADMIN') {
            query += ' AND a.faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        query += ' GROUP BY a.id ORDER BY a.start_date ASC';

        const [activities] = await pool.query(query, params);
        res.status(200).json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
