const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSQL() {
    try {
        // First connect without DB to create it
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            multipleStatements: true
        });

        console.log('Connected to MySQL server.');

        const sqlFilePath = path.join(__dirname, '../../database.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing database.sql...');
        
        await connection.query(sql);
        console.log('Database and tables created successfully!');
        
        await connection.end();
        process.exit(0);
    } catch (e) {
        console.error('Error running SQL:', e.message);
        process.exit(1);
    }
}
runSQL();
