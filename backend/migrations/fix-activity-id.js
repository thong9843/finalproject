const mysql = require('mysql2/promise');
(async () => {
    const p = mysql.createPool({ host: 'localhost', user: 'root', password: '0103040285', database: 'vlu_enterprise_link' });
    await p.query('ALTER TABLE students MODIFY COLUMN activity_id INT NULL');
    console.log('Fixed: activity_id is now nullable');
    process.exit(0);
})();
