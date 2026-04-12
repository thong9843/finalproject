const pool = require('../config/db');

exports.getClusters = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clusters ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDepartments = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM departments ORDER BY name ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getActivityTypes = async (req, res) => {
    try {
        let query = `
            SELECT at.*, f.name as faculty_name 
            FROM activity_types at 
            LEFT JOIN faculties f ON at.faculty_id = f.id 
            ORDER BY at.id DESC
        `;
        const [rows] = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createActivityType = async (req, res) => {
    try {
        const { name, faculty_id } = req.body;
        const [result] = await pool.query(
            'INSERT INTO activity_types (name, faculty_id) VALUES (?, ?)',
            [name, faculty_id || null]
        );
        res.status(201).json({ id: result.insertId, message: 'Created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateActivityType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, faculty_id } = req.body;
        await pool.query(
            'UPDATE activity_types SET name = ?, faculty_id = ? WHERE id = ?',
            [name, faculty_id || null, id]
        );
        res.status(200).json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteActivityType = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM activity_types WHERE id = ?', [id]);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
