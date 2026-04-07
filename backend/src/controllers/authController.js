const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        const passwordIsValid = await bcrypt.compare(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, faculty_id: user.faculty_id },
            process.env.JWT_SECRET,
            { expiresIn: 86400 } // 24 hours
        );

        res.status(200).json({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            faculty_id: user.faculty_id,
            accessToken: token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
