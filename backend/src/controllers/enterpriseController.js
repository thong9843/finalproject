const pool = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        let query = `
            SELECT e.*, s.name as scale_name, f.name as faculty_name,
                rep.title as rep_title, rep.full_name as rep_full_name,
                rep.role as rep_role, rep.phone as rep_phone, rep.email as rep_email,
                addr.building_street, addr.district, addr.province, addr.country,
                GROUP_CONCAT(DISTINCT fi.name ORDER BY fi.name SEPARATOR ', ') as fields_text,
                GROUP_CONCAT(DISTINCT fi.id ORDER BY fi.id SEPARATOR ',') as field_ids,
                (SELECT COUNT(DISTINCT s2.id)
                 FROM students s2
                 JOIN activities a ON s2.activity_id = a.id
                 WHERE a.enterprise_id = e.id AND a.status IN ('Đã triển khai', 'Đã kết thúc')) as student_count
            FROM enterprises e
            LEFT JOIN scales s ON e.scale_id = s.id
            LEFT JOIN faculties f ON e.faculty_id = f.id
            LEFT JOIN enterprise_representatives rep ON rep.enterprise_id = e.id AND rep.is_primary = 1
            LEFT JOIN enterprise_addresses addr ON addr.enterprise_id = e.id AND addr.is_main = 1
            LEFT JOIN enterprise_fields ef ON ef.enterprise_id = e.id
            LEFT JOIN fields fi ON fi.id = ef.field_id
            WHERE e.is_deleted = ?`;
        const showDeleted = req.query.is_deleted === '1' || req.query.is_deleted === 'true';
        let params = [showDeleted ? 1 : 0];

        if (req.user.role !== 'ADMIN') {
            query += ' AND e.faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        const { status, search, sort_by, sort_order } = req.query;

        if (status) {
            query += ' AND e.status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (e.name LIKE ? OR e.tax_code LIKE ? OR rep.full_name LIKE ? OR rep.phone LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        query += ' GROUP BY e.id';

        // Sorting
        const allowedSortColumns = {
            'name': 'e.name',
            'created_at': 'e.created_at',
            'status': 'e.status',
            'student_count': 'student_count'
        };
        const sortCol = allowedSortColumns[sort_by] || 'e.created_at';
        const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortCol} ${sortDir}`;

        const [enterprises] = await pool.query(query, params);
        res.status(200).json(enterprises);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const id = req.params.id;

        const [enterprises] = await pool.query(`
            SELECT e.*, s.name as scale_name, f.name as faculty_name
            FROM enterprises e
            LEFT JOIN scales s ON e.scale_id = s.id
            LEFT JOIN faculties f ON e.faculty_id = f.id
            WHERE e.id = ? AND e.is_deleted = 0`, [id]);

        if (enterprises.length === 0) {
            return res.status(404).json({ message: 'Enterprise not found' });
        }

        const enterprise = enterprises[0];

        if (req.user.role !== 'ADMIN' && enterprise.faculty_id !== req.user.faculty_id) {
            return res.status(403).json({ message: 'Access denied to this enterprise' });
        }

        const [reps] = await pool.query(
            'SELECT * FROM enterprise_representatives WHERE enterprise_id = ? ORDER BY is_primary DESC', [id]);

        const [addrs] = await pool.query(
            'SELECT * FROM enterprise_addresses WHERE enterprise_id = ? ORDER BY is_main DESC', [id]);

        const [fieldRows] = await pool.query(`
            SELECT fi.* FROM fields fi
            JOIN enterprise_fields ef ON ef.field_id = fi.id
            WHERE ef.enterprise_id = ?`, [id]);

        const [activities] = await pool.query(`
            SELECT a.*, GROUP_CONCAT(DISTINCT act.name ORDER BY act.name SEPARATOR ', ') as type_names
            FROM activities a
            LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
            LEFT JOIN act_types act ON act.id = atm.type_id
            WHERE a.enterprise_id = ?
            GROUP BY a.id
            ORDER BY a.start_date DESC`, [id]);

        res.status(200).json({
            ...enterprise,
            representatives: reps,
            addresses: addrs,
            fields: fieldRows,
            activities
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
            name, tax_code, scale_id, is_hcmc, status, department_id, faculty_id,
            rep_title, rep_full_name, rep_role, rep_phone, rep_email,
            building_street, district, province, country,
            field_ids
        } = req.body;

        const finalFacultyId = req.user.role === 'ADMIN' ? faculty_id : req.user.faculty_id;

        const [result] = await conn.query(
            'INSERT INTO enterprises (name, tax_code, scale_id, is_hcmc, status, department_id, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, tax_code, scale_id || null, is_hcmc ?? true, status || 'Tiềm năng', department_id || null, finalFacultyId]
        );
        const enterpriseId = result.insertId;

        if (rep_full_name || rep_phone || rep_email) {
            await conn.query(
                'INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) VALUES (?, ?, ?, ?, ?, ?, 1)',
                [enterpriseId, rep_title || null, rep_full_name || null, rep_role || null, rep_phone || null, rep_email || null]
            );
        }

        if (building_street || district || province) {
            await conn.query(
                'INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) VALUES (?, ?, ?, ?, ?, 1)',
                [enterpriseId, building_street || null, district || null, province || null, country || 'Việt Nam']
            );
        }

        if (field_ids && field_ids.length > 0) {
            for (const fid of field_ids) {
                await conn.query(
                    'INSERT IGNORE INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)',
                    [enterpriseId, fid]
                );
            }
        }

        // Log creation
        const historyHelper = require('../utils/historyHelper');
        await historyHelper.logCreate(conn, {
            entityType: 'ENTERPRISE',
            entityId: enterpriseId,
            entityName: name,
            facultyId: finalFacultyId,
            changedBy: req.user.id,
            newValue: {
                enterprise: { id: enterpriseId, name, tax_code, scale_id, is_hcmc, status, department_id, faculty_id: finalFacultyId },
                representatives: rep_full_name || rep_phone || rep_email ? [{ title: rep_title, full_name: rep_full_name, role: rep_role, phone: rep_phone, email: rep_email, is_primary: 1 }] : [],
                addresses: building_street || district || province ? [{ building_street, district, province, country, is_main: 1 }] : [],
                field_ids: field_ids || []
            }
        });

        await conn.commit();
        res.status(201).json({ id: enterpriseId, message: 'Created successfully' });
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
            name, tax_code, scale_id, is_hcmc, status, department_id,
            rep_title, rep_full_name, rep_role, rep_phone, rep_email,
            building_street, district, province, country,
            field_ids
        } = req.body;

        let checkQuery = 'SELECT status, faculty_id FROM enterprises WHERE id = ?';
        let checkParams = [id];
        if (req.user.role !== 'ADMIN') {
            checkQuery += ' AND faculty_id = ?';
            checkParams.push(req.user.faculty_id);
        }

        const [existing] = await conn.query(checkQuery, checkParams);
        if (existing.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Enterprise not found or unauthorized' });
        }
        const oldStatus = existing[0].status;

        // Fetch old values for logging
        const [oldEnt] = await conn.query('SELECT * FROM enterprises WHERE id = ?', [id]);
        const [oldReps] = await conn.query('SELECT * FROM enterprise_representatives WHERE enterprise_id = ? AND is_primary = 1', [id]);
        const [oldAddrs] = await conn.query('SELECT * FROM enterprise_addresses WHERE enterprise_id = ? AND is_main = 1', [id]);
        const [oldFields] = await conn.query('SELECT field_id FROM enterprise_fields WHERE enterprise_id = ?', [id]);
        
        const oldValue = {
            enterprise: oldEnt[0],
            representatives: oldReps,
            addresses: oldAddrs,
            field_ids: oldFields.map(f => f.field_id)
        };

        await conn.query(
            'UPDATE enterprises SET name=?, tax_code=?, scale_id=?, is_hcmc=?, status=?, department_id=? WHERE id=?',
            [name, tax_code, scale_id || null, is_hcmc ?? true, status, department_id || null, id]
        );

        await conn.query('DELETE FROM enterprise_representatives WHERE enterprise_id = ? AND is_primary = 1', [id]);
        if (rep_full_name || rep_phone || rep_email) {
            await conn.query(
                'INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) VALUES (?, ?, ?, ?, ?, ?, 1)',
                [id, rep_title || null, rep_full_name || null, rep_role || null, rep_phone || null, rep_email || null]
            );
        }

        await conn.query('DELETE FROM enterprise_addresses WHERE enterprise_id = ? AND is_main = 1', [id]);
        if (building_street || district || province) {
            await conn.query(
                'INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) VALUES (?, ?, ?, ?, ?, 1)',
                [id, building_street || null, district || null, province || null, country || 'Việt Nam']
            );
        }

        await conn.query('DELETE FROM enterprise_fields WHERE enterprise_id = ?', [id]);
        if (field_ids && field_ids.length > 0) {
            for (const fid of field_ids) {
                await conn.query(
                    'INSERT IGNORE INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)',
                    [id, fid]
                );
            }
        }

        if (status !== oldStatus) {
            await conn.query(
                'INSERT INTO workflow_history (entity_type, entity_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?, ?)',
                ['ENTERPRISE', id, oldStatus, status, req.user.id]
            );
        }

        // Fetch new values for logging
        const [newEnt] = await conn.query('SELECT * FROM enterprises WHERE id = ?', [id]);
        const [newReps] = await conn.query('SELECT * FROM enterprise_representatives WHERE enterprise_id = ? AND is_primary = 1', [id]);
        const [newAddrs] = await conn.query('SELECT * FROM enterprise_addresses WHERE enterprise_id = ? AND is_main = 1', [id]);
        const [newFields] = await conn.query('SELECT field_id FROM enterprise_fields WHERE enterprise_id = ?', [id]);
        
        const newValue = {
            enterprise: newEnt[0],
            representatives: newReps,
            addresses: newAddrs,
            field_ids: newFields.map(f => f.field_id)
        };

        const historyHelper = require('../utils/historyHelper');
        await historyHelper.logUpdate(conn, {
            entityType: 'ENTERPRISE',
            entityId: id,
            entityName: name,
            facultyId: oldEnt[0].faculty_id,
            changedBy: req.user.id,
            oldValue,
            newValue
        });

        await conn.commit();
        res.status(200).json({ message: 'Updated successfully' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

exports.remove = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const id = req.params.id;

        let checkQuery = 'SELECT * FROM enterprises WHERE id = ?';
        let checkParams = [id];
        if (req.user.role !== 'ADMIN') {
            checkQuery += ' AND faculty_id = ?';
            checkParams.push(req.user.faculty_id);
        }

        const [existing] = await conn.query(checkQuery, checkParams);
        if (existing.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Enterprise not found or unauthorized' });
        }
        const enterprise = existing[0];

        if (enterprise.is_deleted === 1) {
            await conn.rollback();
            return res.status(400).json({ message: 'Doanh nghiệp này đã được xóa trước đó.' });
        }

        // Find active activities to cascade soft-delete
        const [activeActivities] = await conn.query('SELECT id, title FROM activities WHERE enterprise_id = ? AND is_deleted = 0', [id]);
        const activityIds = activeActivities.map(a => a.id);

        // Perform soft-delete updates
        await conn.query('UPDATE enterprises SET is_deleted = 1 WHERE id = ?', [id]);
        if (activityIds.length > 0) {
            await conn.query('UPDATE activities SET is_deleted = 1 WHERE id IN (?)', [activityIds]);
        }

        // Fetch detailed old value for log restoration
        const [reps] = await conn.query('SELECT * FROM enterprise_representatives WHERE enterprise_id = ? AND is_primary = 1', [id]);
        const [addrs] = await conn.query('SELECT * FROM enterprise_addresses WHERE enterprise_id = ? AND is_main = 1', [id]);
        const [fields] = await conn.query('SELECT field_id FROM enterprise_fields WHERE enterprise_id = ?', [id]);

        const oldValue = {
            enterprise,
            representatives: reps,
            addresses: addrs,
            field_ids: fields.map(f => f.field_id),
            cascaded_activities: activityIds
        };

        const historyHelper = require('../utils/historyHelper');
        await historyHelper.logDelete(conn, {
            entityType: 'ENTERPRISE',
            entityId: id,
            entityName: enterprise.name,
            facultyId: enterprise.faculty_id,
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

exports.updateStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;

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

        await pool.query('UPDATE enterprises SET status = ? WHERE id = ?', [status, id]);

        if (status !== oldStatus) {
            await pool.query(
                'INSERT INTO workflow_history (entity_type, entity_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?, ?)',
                ['ENTERPRISE', id, oldStatus, status, req.user.id]
            );
        }
        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDuplicates = async (req, res) => {
    try {
        // Find duplicate names
        const duplicateQuery = `
            SELECT name, COUNT(*) as count 
            FROM enterprises 
            GROUP BY name 
            HAVING count > 1
        `;
        const [duplicateNames] = await pool.query(duplicateQuery);
        
        if (duplicateNames.length === 0) {
            return res.status(200).json([]);
        }

        const names = duplicateNames.map(d => d.name);

        // Get details of those duplicates
        const query = `
            SELECT e.*, s.name as scale_name, f.name as faculty_name,
                (SELECT COUNT(DISTINCT act.id) FROM activities act WHERE act.enterprise_id = e.id) as activity_count
            FROM enterprises e
            LEFT JOIN scales s ON e.scale_id = s.id
            LEFT JOIN faculties f ON e.faculty_id = f.id
            WHERE e.name IN (?)
            ORDER BY e.name ASC, e.created_at DESC
        `;
        
        const [enterprises] = await pool.query(query, [names]);

        // Group by name
        const grouped = duplicateNames.map(d => {
            return {
                name: d.name,
                count: d.count,
                enterprises: enterprises.filter(e => e.name === d.name)
            };
        });

        res.status(200).json(grouped);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.removeActivitiesOnly = async (req, res) => {
    try {
        const id = req.params.id;
        let query = 'DELETE FROM activities WHERE enterprise_id = ?';
        let params = [id];

        if (req.user.role !== 'ADMIN') {
            query += ' AND faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        await pool.query(query, params);
        res.status(200).json({ message: 'Deleted activities successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.restore = async (req, res) => {
    try {
        const id = req.params.id;
        const [logRows] = await pool.query(
            'SELECT id FROM action_history WHERE entity_type = "ENTERPRISE" AND entity_id = ? AND action_type = "DELETE" ORDER BY created_at DESC LIMIT 1',
            [id]
        );
        if (logRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lịch sử xóa để khôi phục doanh nghiệp này.' });
        }
        req.params.id = logRows[0].id;
        const historyController = require('./historyController');
        return historyController.restore(req, res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
