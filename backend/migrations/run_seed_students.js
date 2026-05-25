const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seedStudents() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'vlu_enterprise_link',
        multipleStatements: true,
    });

    console.log('✅ Connected to MySQL');

    const sql = fs.readFileSync(path.join(__dirname, 'seed_students_3.sql'), 'utf8');
    await connection.query(sql);

    const [rows] = await connection.query('SELECT COUNT(*) as total FROM students');
    console.log(`✅ Done! Total students in DB: ${rows[0].total}`);

    await connection.end();
}

seedStudents().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});

