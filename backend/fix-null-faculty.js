const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'vlu_enterprise_link',
    });

    // Fix enterprises
    const [ent] = await pool.query('SELECT id, name FROM enterprises WHERE faculty_id IS NULL');
    console.log('Enterprises with NULL faculty_id:', ent);
    if (ent.length > 0) {
        await pool.query('UPDATE enterprises SET faculty_id = 1 WHERE faculty_id IS NULL');
        console.log(`Fixed ${ent.length} enterprises → faculty_id = 1`);
    }

    // Fix activities
    const [act] = await pool.query('SELECT id, title FROM activities WHERE faculty_id IS NULL');
    console.log('Activities with NULL faculty_id:', act.length);
    if (act.length > 0) {
        await pool.query('UPDATE activities SET faculty_id = 1 WHERE faculty_id IS NULL');
        console.log(`Fixed ${act.length} activities → faculty_id = 1`);
    }

    // Fix students
    const [stu] = await pool.query('SELECT id, name FROM students WHERE faculty_id IS NULL');
    console.log('Students with NULL faculty_id:', stu.length);
    if (stu.length > 0) {
        await pool.query('UPDATE students SET faculty_id = 1 WHERE faculty_id IS NULL');
        console.log(`Fixed ${stu.length} students → faculty_id = 1`);
    }

    // Verify
    const [check] = await pool.query(`
        SELECT 'enterprises' as tbl, COUNT(*) as null_count FROM enterprises WHERE faculty_id IS NULL
        UNION ALL SELECT 'activities', COUNT(*) FROM activities WHERE faculty_id IS NULL
        UNION ALL SELECT 'students', COUNT(*) FROM students WHERE faculty_id IS NULL
    `);
    console.log('\nVerification (should all be 0):');
    check.forEach(r => console.log(`  ${r.tbl}: ${r.null_count} NULL`));

    await pool.end();
    console.log('\n✅ Done!');
})();
