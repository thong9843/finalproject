const pool = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        let query = `
            SELECT m.*, e.name as enterprise_name, d.name as executing_unit_name
            FROM mous m
            JOIN enterprises e ON m.enterprise_id = e.id
            LEFT JOIN departments d ON m.executing_unit_id = d.id
            ORDER BY m.created_at DESC
        `;
        const [rows] = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM mous WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { mou_code, enterprise_id, signing_date, partner_contact, org_type, country, collaboration_scope, executing_unit_id, vlu_contact, tasks_ay24_25, next_steps, past_activities, related_data, working_dir } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO mous (
                mou_code, enterprise_id, signing_date, partner_contact, org_type, country, 
                collaboration_scope, executing_unit_id, vlu_contact, tasks_ay24_25, 
                next_steps, past_activities, related_data, working_dir
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                mou_code, enterprise_id, signing_date || null, partner_contact, org_type, country, 
                collaboration_scope, executing_unit_id || null, vlu_contact, tasks_ay24_25, 
                next_steps, past_activities, related_data, working_dir
            ]
        );
        res.status(201).json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { mou_code, enterprise_id, signing_date, partner_contact, org_type, country, collaboration_scope, executing_unit_id, vlu_contact, tasks_ay24_25, next_steps, past_activities, related_data, working_dir } = req.body;
        
        await pool.query(
            `UPDATE mous SET 
                mou_code=?, enterprise_id=?, signing_date=?, partner_contact=?, org_type=?, country=?, 
                collaboration_scope=?, executing_unit_id=?, vlu_contact=?, tasks_ay24_25=?, 
                next_steps=?, past_activities=?, related_data=?, working_dir=?
            WHERE id=?`,
            [
                mou_code, enterprise_id, signing_date || null, partner_contact, org_type, country, 
                collaboration_scope, executing_unit_id || null, vlu_contact, tasks_ay24_25, 
                next_steps, past_activities, related_data, working_dir, id
            ]
        );
        res.status(200).json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        await pool.query('DELETE FROM mous WHERE id = ?', [req.params.id]);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
