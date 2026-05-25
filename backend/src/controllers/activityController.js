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
            WHERE a.is_deleted = ?`;
        const showDeleted = req.query.is_deleted === '1' || req.query.is_deleted === 'true';
        let params = [showDeleted ? 1 : 0];

        if (req.user.role !== 'ADMIN') {
            query += ' AND a.faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        const { search, date_from, date_to, sort_by, sort_order } = req.query;

        if (search) {
            query += ' AND (a.title LIKE ? OR e.name LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s);
        }

        if (date_from) {
            query += ' AND a.start_date >= ?';
            params.push(date_from);
        }
        if (date_to) {
            query += ' AND a.start_date <= ?';
            params.push(date_to);
        }

        query += ' GROUP BY a.id';

        // Sorting
        const allowedSortColumns = {
            'title': 'a.title',
            'start_date': 'a.start_date',
            'created_at': 'a.created_at',
            'student_count': 'student_count'
        };
        const sortCol = allowedSortColumns[sort_by] || 'a.created_at';
        const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortCol} ${sortDir}`;

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

        const [active] = await pool.query(`SELECT COUNT(*) as count FROM activities WHERE status = 'Đã triển khai' AND is_deleted = 0 ${facultyFilter}`, params);
        const [completed] = await pool.query(`SELECT COUNT(*) as count FROM activities WHERE status = 'Đã kết thúc' AND is_deleted = 0 ${facultyFilter}`, params);
        const [pending] = await pool.query(`SELECT COUNT(*) as count FROM activities WHERE status IN ('Đề xuất', 'Phê duyệt nội bộ') AND is_deleted = 0 ${facultyFilter}`, params);
        const [students] = await pool.query(`
            SELECT COUNT(s.id) as count
            FROM students s
            JOIN activities a ON s.activity_id = a.id
            WHERE s.is_deleted = 0 AND a.is_deleted = 0 ${facultyFilter}`, params);

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

        // Log creation
        const historyHelper = require('../utils/historyHelper');
        await historyHelper.logCreate(conn, {
            entityType: 'ACTIVITY',
            entityId: activityId,
            entityName: title,
            facultyId: finalFacultyId,
            changedBy: req.user.id,
            newValue: {
                activity: { id: activityId, enterprise_id, title, detail, start_date, end_date, start_time, end_time, person_in_charge, tasks: tasksJson, collaboration_date, status, faculty_id: finalFacultyId },
                type_ids: type_ids || [],
                target_ids: target_ids || []
            }
        });

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

        // Fetch old values for logging
        const [oldAct] = await conn.query('SELECT * FROM activities WHERE id = ?', [id]);
        const [oldTypes] = await conn.query('SELECT type_id FROM activity_type_map WHERE activity_id = ?', [id]);
        const [oldTargets] = await conn.query('SELECT target_id FROM activity_target_map WHERE activity_id = ?', [id]);
        
        const oldValue = {
            activity: oldAct[0],
            type_ids: oldTypes.map(t => t.type_id),
            target_ids: oldTargets.map(t => t.target_id)
        };

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

        // Fetch new values for logging
        const [newAct] = await conn.query('SELECT * FROM activities WHERE id = ?', [id]);
        const [newTypes] = await conn.query('SELECT type_id FROM activity_type_map WHERE activity_id = ?', [id]);
        const [newTargets] = await conn.query('SELECT target_id FROM activity_target_map WHERE activity_id = ?', [id]);
        
        const newValue = {
            activity: newAct[0],
            type_ids: newTypes.map(t => t.type_id),
            target_ids: newTargets.map(t => t.target_id)
        };

        const historyHelper = require('../utils/historyHelper');
        await historyHelper.logUpdate(conn, {
            entityType: 'ACTIVITY',
            entityId: id,
            entityName: title,
            facultyId: oldAct[0].faculty_id,
            changedBy: req.user.id,
            oldValue,
            newValue
        });

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
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const id = req.params.id;

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
        const activity = existing[0];

        if (activity.is_deleted === 1) {
            await conn.rollback();
            return res.status(400).json({ message: 'Hoạt động này đã được xóa trước đó.' });
        }

        // Perform soft-delete
        await conn.query('UPDATE activities SET is_deleted = 1 WHERE id = ?', [id]);

        // Fetch types and targets for old state logging
        const [types] = await conn.query('SELECT type_id FROM activity_type_map WHERE activity_id = ?', [id]);
        const [targets] = await conn.query('SELECT target_id FROM activity_target_map WHERE activity_id = ?', [id]);

        const oldValue = {
            activity,
            type_ids: types.map(t => t.type_id),
            target_ids: targets.map(t => t.target_id)
        };

        const historyHelper = require('../utils/historyHelper');
        await historyHelper.logDelete(conn, {
            entityType: 'ACTIVITY',
            entityId: id,
            entityName: activity.title,
            facultyId: activity.faculty_id,
            changedBy: req.user.id,
            oldValue
        });

        await conn.commit();
        res.status(200).json({ message: 'Deleted successfully (soft delete)' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
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
            WHERE a.is_deleted = 0 AND a.start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)`;
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

exports.restore = async (req, res) => {
    try {
        const id = req.params.id;
        const [logRows] = await pool.query(
            'SELECT id FROM action_history WHERE entity_type = "ACTIVITY" AND entity_id = ? AND action_type = "DELETE" ORDER BY created_at DESC LIMIT 1',
            [id]
        );
        if (logRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lịch sử xóa để khôi phục hoạt động này.' });
        }
        req.params.id = logRows[0].id;
        const historyController = require('./historyController');
        return historyController.restore(req, res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
