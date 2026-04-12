const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
    try {
        const p = mysql.createPool({ 
            host: process.env.DB_HOST || 'localhost', 
            user: process.env.DB_USER || 'root', 
            password: process.env.DB_PASSWORD || '', 
            database: process.env.DB_NAME || 'vlu_enterprise_link' 
        });
        await p.query('ALTER TABLE students MODIFY COLUMN activity_id INT NULL');
        console.log('Fixed: activity_id is now nullable');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
