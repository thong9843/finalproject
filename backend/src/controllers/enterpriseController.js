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
            WHERE 1=1`;
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

        query += ' GROUP BY e.id ORDER BY e.created_at DESC';

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
            WHERE e.id = ?`, [id]);

        if (enterprises.length === 0) {
            return res.status(404).json({ message: 'Enterprise not found' });
        }

        const enterprise = enterprises[0];

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

        let checkQuery = 'SELECT status FROM enterprises WHERE id = ?';
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
