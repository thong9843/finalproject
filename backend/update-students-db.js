const mysql = require('mysql2/promise');

async function updateStudentsDB() {
    try {
        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '0103040285',
            database: 'vlu_enterprise_link'
        });

        console.log('Connecting to database...');

        // Add new columns to students table
        const columnsToAdd = [
            { name: 'email', sql: 'ALTER TABLE students ADD COLUMN email VARCHAR(255) AFTER name' },
            { name: 'advisor', sql: 'ALTER TABLE students ADD COLUMN advisor VARCHAR(255) AFTER major' },
            { name: 'enterprise_id', sql: 'ALTER TABLE students ADD COLUMN enterprise_id INT AFTER activity_id' },
            { name: 'position', sql: 'ALTER TABLE students ADD COLUMN position VARCHAR(255) AFTER enterprise_id' },
            { name: 'status', sql: "ALTER TABLE students ADD COLUMN status ENUM('Đang thực tập', 'Hoàn thành', 'Chờ phân công') DEFAULT 'Chờ phân công' AFTER position" },
            { name: 'gpa', sql: 'ALTER TABLE students ADD COLUMN gpa DECIMAL(3,1) AFTER status' },
            { name: 'start_date', sql: 'ALTER TABLE students ADD COLUMN start_date DATE AFTER gpa' },
            { name: 'end_date', sql: 'ALTER TABLE students ADD COLUMN end_date DATE AFTER start_date' },
            { name: 'faculty_id', sql: 'ALTER TABLE students ADD COLUMN faculty_id INT AFTER end_date' },
        ];

        for (const col of columnsToAdd) {
            try {
                const [existing] = await pool.query(`SHOW COLUMNS FROM students LIKE '${col.name}'`);
                if (existing.length === 0) {
                    await pool.query(col.sql);
                    console.log(`Added column: ${col.name}`);
                } else {
                    console.log(`Column already exists: ${col.name}`);
                }
            } catch (e) {
                console.log(`Skipping ${col.name}: ${e.message}`);
            }
        }

        // Add foreign key for enterprise_id (skip if exists)
        try {
            await pool.query('ALTER TABLE students ADD FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE SET NULL');
            console.log('Added FK enterprise_id');
        } catch (e) {
            console.log('FK enterprise_id already exists or error:', e.message);
        }

        // Add foreign key for faculty_id (skip if exists)
        try {
            await pool.query('ALTER TABLE students ADD FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL');
            console.log('Added FK faculty_id');
        } catch (e) {
            console.log('FK faculty_id already exists or error:', e.message);
        }

        // Update existing student seed data with more realistic info
        await pool.query(`UPDATE students SET 
            email = 'nguyenvana@student.edu.vn', 
            advisor = 'TS. Nguyễn Văn Hùng', 
            enterprise_id = 1, 
            position = 'Frontend Developer', 
            status = 'Đang thực tập', 
            gpa = 3.6, 
            start_date = '2024-07-01', 
            end_date = '2024-12-31',
            faculty_id = 1
            WHERE student_code = '207CT50111'`);

        await pool.query(`UPDATE students SET 
            email = 'tranthib@student.edu.vn', 
            advisor = 'ThS. Trần Minh Tuấn', 
            enterprise_id = 1, 
            position = 'Backend Developer', 
            status = 'Đang thực tập', 
            gpa = 3.8, 
            start_date = '2024-07-01', 
            end_date = '2024-12-31',
            faculty_id = 1
            WHERE student_code = '207CT50112'`);

        await pool.query(`UPDATE students SET 
            email = 'levanc@student.edu.vn', 
            advisor = 'TS. Phạm Thị Hoa', 
            enterprise_id = 3, 
            position = 'Marketing Intern', 
            status = 'Chờ phân công', 
            gpa = 3.4, 
            start_date = '2024-06-01', 
            end_date = '2024-12-31',
            faculty_id = 2
            WHERE student_code = '207BA50113'`);

        // Insert more sample students
        const moreStudents = [
            ['207CT50114', 'Phạm Ngọc Hân', 'phamngochan@student.edu.vn', 'K26-IT3', 'Kế toán - Tin học', 'ThS. Lý Trí Mỹ Linh', 1, 3, 'Kế toán viên', 'Đang thực tập', 3.7, '2024-08-01', '2025-01-31', 1],
            ['207CT50115', 'Hoàng Quốc Bảo', 'hoangquocbao@student.edu.vn', 'K26-IT4', 'Tài chính - Ngân hàng', 'ThS. Đặng Minh Tuấn', 1, 1, 'Data Analyst', 'Đang thực tập', 3.5, '2024-07-15', '2025-01-15', 1],
            ['207CT50116', 'Vũ Thị Cẩm Tú', 'vuthicamtu@student.edu.vn', 'K27-IT1', 'Công nghệ thông tin', null, 2, 'Mobile Developer', 'Hoàn thành', 3.9, '2023-06-01', '2023-11-30', 1],
            ['207CT50117', 'Đỗ Thanh Tùng', 'dothanhtung@student.edu.vn', 'K26-IT2', 'Kỹ thuật phần mềm', 'TS. Nguyễn Văn Hùng', 1, 1, 'QA Tester', 'Đang thực tập', 3.3, '2024-07-01', '2024-12-31', 1],
            ['207BA50118', 'Ngô Thị Diễm My', 'ngothidiemmy@student.edu.vn', 'K27-BA1', 'Hệ thống thông tin', 'ThS. Bùi Thanh Hà', 2, 3, 'Business Analyst', 'Đang thực tập', 3.6, '2024-09-01', '2025-02-28', 2],
        ];

        for (const s of moreStudents) {
            try {
                await pool.query(
                    `INSERT IGNORE INTO students (student_code, name, email, class, major, advisor, activity_id, enterprise_id, position, status, gpa, start_date, end_date, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    s
                );
            } catch (e) {
                console.log(`Skipping student ${s[0]}: ${e.message}`);
            }
        }

        console.log('Students DB updated successfully!');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
updateStudentsDB();
