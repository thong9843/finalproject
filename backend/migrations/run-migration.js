const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSQL() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '0103040285',
            database: 'vlu_enterprise_link',
            multipleStatements: true
        });

        console.log('Connected to MySQL server.');

        const sqlFilePath = path.join(__dirname, 'kanban-migration.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing kanban-migration.sql...');
        
        await connection.query(sql);
        console.log('Migration successfully applied!');
        
        await connection.end();
        process.exit(0);
    } catch (e) {
        console.error('Error running SQL:', e.message);
        process.exit(1);
    }
}
runSQL();