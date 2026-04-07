const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vlu_enterprise_link',
    multipleStatements: true
};

async function run() {
    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected to db');
        const sql = fs.readFileSync(path.join(__dirname, 'calendar_migration.sql'), 'utf8');
        await connection.query(sql);
        console.log('Migration successful');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}
run();