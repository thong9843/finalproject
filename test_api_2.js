const activityController = require('./backend/src/controllers/activityController');
const pool = require('./backend/src/config/db');

async function test() {
    let query = `
            SELECT a.*, e.name as enterprise_name, f.name as faculty_name,
                GROUP_CONCAT(DISTINCT act.name ORDER BY act.name SEPARATOR ', ') as type_names,
                GROUP_CONCAT(DISTINCT act.id ORDER BY act.id SEPARATOR ',') as type_ids,
                GROUP_CONCAT(DISTINCT tgt.name ORDER BY tgt.name SEPARATOR ', ') as target_names,
                GROUP_CONCAT(DISTINCT tgt.id ORDER BY tgt.id SEPARATOR ',') as target_ids,
                (SELECT COUNT(*) FROM students s WHERE s.activity_id = a.id) as student_count
            FROM activities a
            JOIN enterprises e ON a.enterprise_id = e.id
            LEFT JOIN faculties f ON a.faculty_id = f.id
            LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
            LEFT JOIN act_types act ON act.id = atm.type_id
            LEFT JOIN activity_target_map atrm ON atrm.activity_id = a.id
            LEFT JOIN targets tgt ON tgt.id = atrm.target_id
            WHERE 1=1 GROUP BY a.id ORDER BY a.created_at DESC LIMIT 1`;
            
    const [activities] = await pool.query(query);
    console.log(JSON.stringify(activities[0], null, 2));
    process.exit(0);
}
test();
