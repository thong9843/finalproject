const pool = require('../config/db');
const historyHelper = require('../utils/historyHelper');

// Helper to check if an entity currently exists in the DB (active or soft-deleted)
async function checkEntityExists(entityType, entityId) {
    const tableMap = {
        'ENTERPRISE': 'enterprises',
        'MOU': 'mous',
        'ACTIVITY': 'activities',
        'STUDENT': 'students'
    };
    const table = tableMap[entityType];
    if (!table) return false;
    try {
        const [rows] = await pool.query(`SELECT 1 FROM \`${table}\` WHERE id = ?`, [entityId]);
        return rows.length > 0;
    } catch (err) {
        console.error(`Error checking existence of ${entityType} ID ${entityId}:`, err);
        return false;
    }
}

// Get all history logs
exports.getAll = async (req, res) => {
    try {
        let query = `
            SELECT h.id, h.action_type, h.entity_type, h.entity_id, h.entity_name, 
                   h.faculty_id, h.changed_by, h.changed_at,
                   u.full_name as user_name, u.email as user_email,
                   f.name as faculty_name
            FROM action_history h
            LEFT JOIN users u ON h.changed_by = u.id
            LEFT JOIN faculties f ON h.faculty_id = f.id
            WHERE 1=1
        `;
        let params = [];

        // Faculty Manager and Lecturer restriction (Lecturer shouldn't access at all but just in case)
        if (req.user.role !== 'ADMIN') {
            query += ' AND h.faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        const { entity_type, action_type, search } = req.query;

        if (entity_type) {
            query += ' AND h.entity_type = ?';
            params.push(entity_type);
        }

        if (action_type) {
            query += ' AND h.action_type = ?';
            params.push(action_type);
        }

        if (search) {
            query += ' AND (h.entity_name LIKE ? OR u.full_name LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s);
        }

        query += ' ORDER BY h.changed_at DESC LIMIT 200';

        const [logs] = await pool.query(query, params);
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single log detail
exports.getById = async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await pool.query(`
            SELECT h.*, u.full_name as user_name, u.email as user_email, f.name as faculty_name
            FROM action_history h
            LEFT JOIN users u ON h.changed_by = u.id
            LEFT JOIN faculties f ON h.faculty_id = f.id
            WHERE h.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Log entry not found' });
        }

        const log = rows[0];

        // Faculty authorization
        if (req.user.role !== 'ADMIN' && log.faculty_id !== req.user.faculty_id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Restore action
exports.restore = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const id = req.params.id;
        const [rows] = await conn.query('SELECT * FROM action_history WHERE id = ?', [id]);

        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Log entry not found' });
        }

        const log = rows[0];

        // Authorization check
        if (req.user.role !== 'ADMIN' && log.faculty_id !== req.user.faculty_id) {
            await conn.rollback();
            return res.status(403).json({ message: 'Access denied' });
        }

        const entityType = log.entity_type;
        const entityId = log.entity_id;
        const actionType = log.action_type;

        // Parse stored JSON states
        const oldValue = log.old_value ? JSON.parse(log.old_value) : null;
        const newValue = log.new_value ? JSON.parse(log.new_value) : null;

        // --- RESTORE DELETE OPERATION ---
        if (actionType === 'DELETE') {
            const exists = await checkEntityExists(entityType, entityId);
            if (!exists) {
                await conn.rollback();
                return res.status(400).json({ message: `Không thể khôi phục: Bản ghi của ${entityType} này đã bị xóa vĩnh viễn khỏi Database.` });
            }

            if (entityType === 'ENTERPRISE') {
                // Restore Enterprise
                await conn.query('UPDATE enterprises SET is_deleted = 0 WHERE id = ?', [entityId]);

                // Restore cascaded items
                if (oldValue) {
                    if (oldValue.cascaded_activities && oldValue.cascaded_activities.length > 0) {
                        await conn.query('UPDATE activities SET is_deleted = 0 WHERE id IN (?)', [oldValue.cascaded_activities]);
                    }
                    if (oldValue.cascaded_mous && oldValue.cascaded_mous.length > 0) {
                        await conn.query('UPDATE mous SET is_deleted = 0 WHERE id IN (?)', [oldValue.cascaded_mous]);
                    }
                    if (oldValue.cascaded_students && oldValue.cascaded_students.length > 0) {
                        await conn.query('UPDATE students SET is_deleted = 0 WHERE id IN (?)', [oldValue.cascaded_students]);
                    }
                }
            } else if (entityType === 'ACTIVITY') {
                // Ensure parent enterprise is not deleted
                const activityData = oldValue?.activity;
                if (activityData) {
                    const [enterprise] = await conn.query('SELECT is_deleted FROM enterprises WHERE id = ?', [activityData.enterprise_id]);
                    if (enterprise.length === 0 || enterprise[0].is_deleted === 1) {
                        await conn.rollback();
                        return res.status(400).json({ message: 'Không thể khôi phục hoạt động do Doanh nghiệp chủ quản đã bị xóa. Hãy khôi phục Doanh nghiệp trước.' });
                    }
                }

                await conn.query('UPDATE activities SET is_deleted = 0 WHERE id = ?', [entityId]);

                // Restore cascaded
                if (oldValue) {
                    if (oldValue.cascaded_mous && oldValue.cascaded_mous.length > 0) {
                        await conn.query('UPDATE mous SET is_deleted = 0 WHERE id IN (?)', [oldValue.cascaded_mous]);
                    }
                    if (oldValue.cascaded_students && oldValue.cascaded_students.length > 0) {
                        await conn.query('UPDATE students SET is_deleted = 0 WHERE id IN (?)', [oldValue.cascaded_students]);
                    }
                }
            } else if (entityType === 'MOU') {
                // Ensure parent enterprise is active
                const mouData = oldValue?.mou;
                if (mouData) {
                    const [enterprise] = await conn.query('SELECT is_deleted FROM enterprises WHERE id = ?', [mouData.enterprise_id]);
                    if (enterprise.length === 0 || enterprise[0].is_deleted === 1) {
                        await conn.rollback();
                        return res.status(400).json({ message: 'Không thể khôi phục MOU do Doanh nghiệp đối tác đã bị xóa. Hãy khôi phục Doanh nghiệp trước.' });
                    }

                    // Check activity if present
                    if (mouData.activity_id) {
                        const [act] = await conn.query('SELECT is_deleted FROM activities WHERE id = ?', [mouData.activity_id]);
                        if (act.length === 0 || act[0].is_deleted === 1) {
                            // Nullify activity relationship if activity is deleted
                            mouData.activity_id = null;
                        }
                    }
                }

                await conn.query('UPDATE mous SET is_deleted = 0, activity_id = ? WHERE id = ?', [mouData?.activity_id || null, entityId]);
            } else if (entityType === 'STUDENT') {
                const studentData = oldValue?.student;
                if (studentData) {
                    // Check parent Enterprise
                    if (studentData.enterprise_id) {
                        const [ent] = await conn.query('SELECT is_deleted FROM enterprises WHERE id = ?', [studentData.enterprise_id]);
                        if (ent.length === 0 || ent[0].is_deleted === 1) {
                            studentData.enterprise_id = null;
                        }
                    }
                    // Check parent Activity
                    if (studentData.activity_id) {
                        const [act] = await conn.query('SELECT is_deleted FROM activities WHERE id = ?', [studentData.activity_id]);
                        if (act.length === 0 || act[0].is_deleted === 1) {
                            studentData.activity_id = null;
                        }
                    }
                }

                await conn.query('UPDATE students SET is_deleted = 0, enterprise_id = ?, activity_id = ? WHERE id = ?', [
                    studentData?.enterprise_id || null,
                    studentData?.activity_id || null,
                    entityId
                ]);
            }
        } 
        // --- RESTORE UPDATE OPERATION ---
        else if (actionType === 'UPDATE') {
            const exists = await checkEntityExists(entityType, entityId);
            if (!exists) {
                await conn.rollback();
                return res.status(400).json({ message: `Không thể khôi phục: Bản ghi của ${entityType} này không tồn tại hoặc đã bị xóa vĩnh viễn.` });
            }

            if (entityType === 'ENTERPRISE') {
                const ent = oldValue?.enterprise;
                if (!ent) throw new Error('Dữ liệu trạng thái cũ không tồn tại trong Log.');

                // Restore core
                await conn.query(
                    'UPDATE enterprises SET name=?, tax_code=?, scale_id=?, is_hcmc=?, status=?, department_id=? WHERE id=?',
                    [ent.name, ent.tax_code, ent.scale_id, ent.is_hcmc, ent.status, ent.department_id, entityId]
                );

                // Restore Representatives
                await conn.query('DELETE FROM enterprise_representatives WHERE enterprise_id = ?', [entityId]);
                if (oldValue.representatives && oldValue.representatives.length > 0) {
                    for (const r of oldValue.representatives) {
                        await conn.query(
                            `INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [entityId, r.title, r.full_name, r.role, r.phone, r.email, r.is_primary]
                        );
                    }
                }

                // Restore Addresses
                await conn.query('DELETE FROM enterprise_addresses WHERE enterprise_id = ?', [entityId]);
                if (oldValue.addresses && oldValue.addresses.length > 0) {
                    for (const a of oldValue.addresses) {
                        await conn.query(
                            `INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [entityId, a.building_street, a.district, a.province, a.country, a.is_main]
                        );
                    }
                }

                // Restore Fields
                await conn.query('DELETE FROM enterprise_fields WHERE enterprise_id = ?', [entityId]);
                if (oldValue.field_ids && oldValue.field_ids.length > 0) {
                    for (const fid of oldValue.field_ids) {
                        await conn.query(
                            'INSERT INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)',
                            [entityId, fid]
                        );
                    }
                }
            } else if (entityType === 'ACTIVITY') {
                const act = oldValue?.activity;
                if (!act) throw new Error('Dữ liệu trạng thái cũ không tồn tại trong Log.');

                await conn.query(
                    `UPDATE activities SET title=?, detail=?, start_date=?, end_date=?,
                     start_time=?, end_time=?, person_in_charge=?, tasks=?,
                     collaboration_date=?, status=? WHERE id=?`,
                    [act.title, act.detail, act.start_date, act.end_date,
                     act.start_time, act.end_time, act.person_in_charge, act.tasks,
                     act.collaboration_date, act.status, entityId]
                );

                // Restore Types
                await conn.query('DELETE FROM activity_type_map WHERE activity_id = ?', [entityId]);
                if (oldValue.type_ids && oldValue.type_ids.length > 0) {
                    for (const tid of oldValue.type_ids) {
                        await conn.query(
                            'INSERT INTO activity_type_map (activity_id, type_id) VALUES (?, ?)',
                            [entityId, tid]
                        );
                    }
                }

                // Restore Targets
                await conn.query('DELETE FROM activity_target_map WHERE activity_id = ?', [entityId]);
                if (oldValue.target_ids && oldValue.target_ids.length > 0) {
                    for (const tgid of oldValue.target_ids) {
                        await conn.query(
                            'INSERT INTO activity_target_map (activity_id, target_id) VALUES (?, ?)',
                            [entityId, tgid]
                        );
                    }
                }
            } else if (entityType === 'MOU') {
                const mou = oldValue?.mou;
                if (!mou) throw new Error('Dữ liệu trạng thái cũ không tồn tại trong Log.');

                // Verify parent enterprise is active
                const [entCheck] = await conn.query('SELECT is_deleted FROM enterprises WHERE id = ?', [mou.enterprise_id]);
                if (entCheck.length === 0 || entCheck[0].is_deleted === 1) {
                    await conn.rollback();
                    return res.status(400).json({ message: 'Không thể khôi phục trạng thái MOU do Doanh nghiệp liên quan đã bị xóa.' });
                }

                // Check activity
                if (mou.activity_id) {
                    const [actCheck] = await conn.query('SELECT is_deleted FROM activities WHERE id = ?', [mou.activity_id]);
                    if (actCheck.length === 0 || actCheck[0].is_deleted === 1) {
                        mou.activity_id = null;
                    }
                }

                await conn.query(
                    `UPDATE mous SET mou_code=?, enterprise_id=?, signing_date=?, partner_contact=?,
                     org_type=?, country=?, collaboration_scope=?, executing_unit_id=?, vlu_contact=?,
                     tasks_ay24_25=?, next_steps=?, past_activities=?, related_data=?, working_dir=?,
                     activity_id=?, file_url=?, faculty_id=? WHERE id=?`,
                    [mou.mou_code, mou.enterprise_id, mou.signing_date, mou.partner_contact,
                     mou.org_type, mou.country, mou.collaboration_scope, mou.executing_unit_id, mou.vlu_contact,
                     mou.tasks_ay24_25, mou.next_steps, mou.past_activities, mou.related_data, mou.working_dir,
                     mou.activity_id, mou.file_url, mou.faculty_id, entityId]
                );
            } else if (entityType === 'STUDENT') {
                const student = oldValue?.student;
                if (!student) throw new Error('Dữ liệu trạng thái cũ không tồn tại trong Log.');

                // Verify parent Enterprise
                if (student.enterprise_id) {
                    const [entCheck] = await conn.query('SELECT is_deleted FROM enterprises WHERE id = ?', [student.enterprise_id]);
                    if (entCheck.length === 0 || entCheck[0].is_deleted === 1) {
                        student.enterprise_id = null;
                    }
                }
                // Verify parent Activity
                if (student.activity_id) {
                    const [actCheck] = await conn.query('SELECT is_deleted FROM activities WHERE id = ?', [student.activity_id]);
                    if (actCheck.length === 0 || actCheck[0].is_deleted === 1) {
                        student.activity_id = null;
                    }
                }

                await conn.query(
                    `UPDATE students SET student_code=?, name=?, email=?, class=?, major=?, advisor=?,
                     activity_id=?, enterprise_id=?, position=?, status=?, gpa=?, start_date=?, end_date=? WHERE id=?`,
                    [student.student_code, student.name, student.email, student.class, student.major, student.advisor,
                     student.activity_id, student.enterprise_id, student.position, student.status, student.gpa, student.start_date, student.end_date, entityId]
                );
            }
        }

        // Log the RESTORE action itself
        await historyHelper.logRestore(conn, {
            entityType,
            entityId,
            entityName: log.entity_name,
            facultyId: log.faculty_id,
            changedBy: req.user.id,
            newValue: { restored_from_log_id: id }
        });

        await conn.commit();
        res.status(200).json({ message: 'Khôi phục dữ liệu thành công' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

// Permanent delete (Admin only)
exports.permanentDelete = async (req, res) => {
    // Only ADMIN role allowed
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Chỉ có Admin mới có quyền xóa vĩnh viễn dữ liệu.' });
    }

    try {
        const id = req.params.id;
        const [rows] = await pool.query('SELECT * FROM action_history WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Log entry not found' });
        }

        const log = rows[0];
        const entityType = log.entity_type;
        const entityId = log.entity_id;

        const tableMap = {
            'ENTERPRISE': 'enterprises',
            'MOU': 'mous',
            'ACTIVITY': 'activities',
            'STUDENT': 'students'
        };
        const table = tableMap[entityType];
        if (!table) {
            return res.status(400).json({ message: 'Loại đối tượng không hợp lệ' });
        }

        // Check if the record is currently soft-deleted
        const [record] = await pool.query(`SELECT is_deleted FROM \`${table}\` WHERE id = ?`, [entityId]);
        if (record.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đối tượng trong hệ thống' });
        }

        if (record[0].is_deleted !== 1) {
            return res.status(400).json({ message: 'Chỉ có thể xóa vĩnh viễn các đối tượng đang trong trạng thái Đã xóa (soft-deleted).' });
        }

        // Perform hard delete
        await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [entityId]);

        // Clean up history records related to this entity ID (optional, but clean)
        await pool.query('DELETE FROM action_history WHERE entity_type = ? AND entity_id = ?', [entityType, entityId]);

        res.status(200).json({ message: 'Đã xóa vĩnh viễn đối tượng thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};