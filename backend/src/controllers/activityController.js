const pool = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        let query = 'SELECT a.*, e.name as enterprise_name, f.name as faculty_name FROM activities a JOIN enterprises e ON a.enterprise_id = e.id LEFT JOIN faculties f ON a.faculty_id = f.id WHERE 1=1';
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

exports.create = async (req, res) => {
    try {
        const { enterprise_id, title, type, description, start_date, status, faculty_id } = req.body;
        const finalFacultyId = req.user.role === 'ADMIN' ? faculty_id : req.user.faculty_id;

        const [result] = await pool.query(
            'INSERT INTO activities (enterprise_id, title, type, description, start_date, status, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [enterprise_id, title, type, description, start_date, status || 'Tiềm năng', finalFacultyId]
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

        await pool.query('UPDATE activities SET status = ? WHERE id = ?', [status, id]);
        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
