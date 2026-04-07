const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function fixPasswords() {
    try {
        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '0103040285',
            database: 'vlu_enterprise_link'
        });
        
        // Generate actual hash for 123456
        const realHash = await bcrypt.hash('123456', 10);
        console.log('Real hash for 123456 is:', realHash);
        
        await pool.query('UPDATE users SET password = ?', [realHash]);
        console.log('Updated all users to password 123456');
        
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
fixPasswords();
