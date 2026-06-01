const pool = require('./backend/src/config/db');

async function check() {
    try {
        const [ents] = await pool.query('SELECT id, name, is_deleted FROM enterprises WHERE name = "AWS Việt Nam"');
        console.log('AWS Việt Nam entries:', ents);

        const [dupEnts] = await pool.query('SELECT name, count(*) as count FROM enterprises WHERE is_deleted = 0 GROUP BY name HAVING count > 1');
        console.log('Duplicate enterprises:', dupEnts);

        const [dupStudents] = await pool.query('SELECT student_code, count(*) as count FROM students WHERE is_deleted = 0 GROUP BY student_code HAVING count > 1');
        console.log('Duplicate students (code):', dupStudents);

        const [dupMous] = await pool.query('SELECT mou_code, count(*) as count FROM mous WHERE is_deleted = 0 GROUP BY mou_code HAVING count > 1');
        console.log('Duplicate MOUs:', dupMous);

        const [dupActivities] = await pool.query('SELECT enterprise_id, title, count(*) as count FROM activities WHERE is_deleted = 0 GROUP BY enterprise_id, title HAVING count > 1');
        console.log('Duplicate Activities:', dupActivities);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
