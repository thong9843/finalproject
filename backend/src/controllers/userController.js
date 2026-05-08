const pool = require('../config/db');
const bcrypt = require('bcrypt');

exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, email, full_name, role, faculty_id, created_at FROM users ORDER BY id DESC');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { email, password, full_name, role, faculty_id } = req.body;
        
        // Check if user exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO users (email, password, full_name, role, faculty_id) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, full_name, role || 'LECTURER', faculty_id || null]
        );

        res.status(201).json({ message: 'Tạo người dùng thành công', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password, full_name, role, faculty_id } = req.body;

        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Check if new email conflicts with other users
        const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ message: 'Email đã được sử dụng bởi người dùng khác' });
        }

        let query = 'UPDATE users SET email = ?, full_name = ?, role = ?, faculty_id = ?';
        let params = [email, full_name, role, faculty_id];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await pool.query(query, params);

        res.json({ message: 'Cập nhật người dùng thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (req.user && req.user.id == id) {
            return res.status(400).json({ message: 'Không thể tự xóa tài khoản của chính mình' });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({ message: 'Không thể xóa người dùng này vì có dữ liệu liên quan' });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};
