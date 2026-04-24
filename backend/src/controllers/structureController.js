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
