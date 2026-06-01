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
        let query = 'SELECT * FROM departments';
        let params = [];
        if (req.user && req.user.role !== 'ADMIN') {
            query += ' WHERE faculty_id = ?';
            params.push(req.user.faculty_id);
        }
        query += ' ORDER BY name ASC';
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getActivityTypes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM act_types ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getScales = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM scales ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFields = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM fields ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getActTypes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM act_types ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTargets = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM targets ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFaculties = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM faculties ORDER BY name ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
