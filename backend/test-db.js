const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function test() {
    try {
        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '0103040285',
            database: 'vlu_enterprise_link'
        });
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@vlu.edu.vn']);
        if (users.length === 0) {
            console.log('User not found');
            return;
        }
        
        const user = users[0];
        const isValid = await bcrypt.compare('123456', user.password);
        console.log('Password is valid?', isValid);
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
test();
