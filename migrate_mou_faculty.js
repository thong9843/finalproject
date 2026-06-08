const pool = require('./backend/src/config/db');

async function migrate() {
    try {
        console.log('Checking if faculty_id column exists in mous table...');
        const [columns] = await pool.query("SHOW COLUMNS FROM `mous` LIKE 'faculty_id'");
        
        if (columns.length === 0) {
            console.log('Adding faculty_id column to mous...');
            await pool.query('ALTER TABLE `mous` ADD COLUMN faculty_id INT NULL;');
            console.log('✔ Column added successfully.');
            
            console.log('Adding Foreign Key constraint...');
            await pool.query('ALTER TABLE `mous` ADD CONSTRAINT fk_mous_faculties FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE;');
            console.log('✔ Foreign Key constraint added successfully.');
            
            console.log('Syncing faculty_id for existing MOUs from enterprises...');
            const [result] = await pool.query(`
                UPDATE mous m 
                JOIN enterprises e ON m.enterprise_id = e.id 
                SET m.faculty_id = e.faculty_id 
                WHERE m.faculty_id IS NULL
            `);
            console.log(`✔ Synced faculty_id. Affected rows: ${result.affectedRows}`);
            
            // Fallback for any remaining NULL faculty_id values (e.g. orphan MOUs)
            const [fallbackResult] = await pool.query('UPDATE mous SET faculty_id = 1 WHERE faculty_id IS NULL');
            console.log(`✔ Fallback sync (defaulting to 1) completed. Affected rows: ${fallbackResult.affectedRows}`);
            
            console.log('🎉 Migration completed successfully!');
        } else {
            console.log('faculty_id column already exists in mous table. No changes made.');
        }
    } catch (err) {
        console.error('✖ Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

migrate();
