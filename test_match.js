const pool = require('./backend/src/config/db');

async function check() {
    try {
        const [acts] = await pool.query('SELECT id, title, enterprise_id FROM activities');
        const [ents] = await pool.query('SELECT id, name FROM enterprises');
        
        console.log('Total activities:', acts.length);
        console.log('Total enterprises:', ents.length);
        
        // Count activities per enterprise
        const counts = {};
        for (const act of acts) {
            counts[act.enterprise_id] = (counts[act.enterprise_id] || 0) + 1;
        }
        
        console.log('Enterprises with activities:');
        for (const ent of ents) {
            if (counts[ent.id]) {
                console.log(`- ${ent.name} (ID: ${ent.id}) has ${counts[ent.id]} activities`);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
