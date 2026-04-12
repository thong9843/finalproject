require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
    console.log('Connecting to database...');
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'vlu_enterprise_link',
        multipleStatements: true
    });

    try {
        console.log('1. Creating clusters table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clusters (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('2. Updating faculties table...');
        try {
            await pool.query('ALTER TABLE faculties ADD COLUMN cluster_id INT AFTER id');
            await pool.query('ALTER TABLE faculties ADD FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE SET NULL');
        } catch (e) {
            console.log(' - (Warning) cluster_id might already exist in faculties:', e.message);
        }

        console.log('3. Creating departments table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                faculty_id INT,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
            )
        `);

        console.log('4. Creating activity_types table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                faculty_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
            )
        `);

        console.log('5. Updating enterprises table (adding sheet 1 fields)...');
        const enterpriseCols = [
            'ALTER TABLE enterprises ADD COLUMN contact_title VARCHAR(50) AFTER phone',
            'ALTER TABLE enterprises ADD COLUMN contact_position VARCHAR(255) AFTER contact',
            'ALTER TABLE enterprises ADD COLUMN past_collaboration TEXT AFTER status',
            'ALTER TABLE enterprises ADD COLUMN department_id INT AFTER past_collaboration'
        ];
        for (const sql of enterpriseCols) {
            try {
                await pool.query(sql);
            } catch (e) {
                console.log(' - (Warning) enterprise column might already exist:', e.message);
            }
        }
        
        try {
            await pool.query('ALTER TABLE enterprises ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL');
        } catch (e) {
            console.log(' - (Warning) FK department_id might already exist:', e.message);
        }

        console.log('6. Creating mous table (Sheet 2)...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS mous (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mou_code VARCHAR(100) NOT NULL,
                enterprise_id INT NOT NULL,
                signing_date DATE,
                partner_contact VARCHAR(255),
                org_type VARCHAR(100),
                country VARCHAR(100),
                collaboration_scope TEXT,
                executing_unit_id INT NULL,
                vlu_contact VARCHAR(255),
                tasks_ay24_25 TEXT,
                next_steps TEXT,
                past_activities TEXT,
                related_data TEXT,
                working_dir VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
                FOREIGN KEY (executing_unit_id) REFERENCES departments(id) ON DELETE SET NULL
            )
        `);

        console.log('7. Seeding basic data...');
        // Insert clusters
        await pool.query(`INSERT IGNORE INTO clusters (id, name) VALUES (1, 'Khối Công nghệ & Kỹ thuật'), (2, 'Khối Kinh tế & Quản lý'), (3, 'Khối Xã hội & Ngôn ngữ')`);
        
        // Link existing faculties to clusters if they exist
        await pool.query(`UPDATE faculties SET cluster_id = 1 WHERE name LIKE '%Công nghệ%'`);
        await pool.query(`UPDATE faculties SET cluster_id = 2 WHERE name LIKE '%Quản trị%' OR name LIKE '%Kinh tế%'`);

        // Insert basic activity types
        const basicActivities = ['Tuyển dụng việc làm', 'Tuyển dụng thực tập', 'Tặng hoa 20/11', 'Tham quan công ty', 'Workshop'];
        for (const act of basicActivities) {
            await pool.query(`INSERT IGNORE INTO activity_types (name) SELECT ? WHERE NOT EXISTS(SELECT 1 FROM activity_types WHERE name = ?)`, [act, act]);
        }

        console.log('Migration completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
