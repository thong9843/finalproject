/**
 * Consolidated Database Seeder for VLU Enterprise Link
 * Seeds database tables using CSV data files inside Output_DB and SQL student files
 * specifically for Faculty 1 (Khoa CNTT).
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Helper to read CSV from Output_DB
const outputDbDir = path.join(__dirname, '..', 'Output_DB');
function readCSV(filename) {
    const filePath = path.join(outputDbDir, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return [];
    }
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });
    return data.map(row => {
        const normalized = {};
        for (const key in row) {
            normalized[key.trim().toLowerCase()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
        }
        return normalized;
    });
}

async function seed() {
    console.log('🚀 Starting Consolidated Database Seeder for Khoa CNTT...');

    // First setup connection parameters
    const connectionParams = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    let conn;
    try {
        conn = await mysql.createConnection(connectionParams);
        console.log('Connected to MySQL server.');

        // Step 1: Run schema (database.sql) to get a clean layout
        const sqlFilePath = path.join(__dirname, '..', 'database.sql');
        console.log(`Executing schema file: ${sqlFilePath}`);
        const sql = fs.readFileSync(sqlFilePath, 'utf8');
        await conn.query(sql);
        console.log('✔ Schema initialized successfully.');

        // Now select the DB for transactional queries
        await conn.query(`USE \`${process.env.DB_NAME || 'vlu_enterprise_link'}\``);

        console.log('Disabling foreign key checks and clearing database tables...');
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');

        // Step 2: Truncate tables we want to seed dynamically
        const tablesToClear = [
            'tasks', 'notes', 'action_history', 'workflow_history', 'enterprise_ratings',
            'student_activities', 'students', 'mous', 'activity_target_map', 'activity_type_map', 'activities',
            'enterprise_fields', 'enterprise_addresses', 'enterprise_representatives', 'enterprises',
            'departments', 'targets', 'act_types', 'scales', 'fields'
        ];
        for (const table of tablesToClear) {
            await conn.query(`TRUNCATE TABLE \`${table}\``);
        }
        console.log('✔ Transactional tables cleared.');

        // Step 3: Seed Reference Static Data from Output_DB CSVs
        console.log('Seeding reference static data from Output_DB...');

        // 1. Scales
        console.log('Importing scales from 3_Scale.csv...');
        const scalesData = readCSV('3_Scale.csv');
        for (const row of scalesData) {
            if (!row.id || !row.name) continue;
            await conn.query('INSERT INTO scales (id, name) VALUES (?, ?)', [row.id, row.name]);
        }

        // 2. Fields (Set faculty_id = 1 for IT specific fields from Output_DB)
        console.log('Importing fields from 2_Fields.csv...');
        const fieldsData = readCSV('2_Fields.csv');
        for (const row of fieldsData) {
            if (!row.id || !row.name) continue;
            await conn.query('INSERT INTO fields (id, name, faculty_id) VALUES (?, ?, 1)', [row.id, row.name]);
        }

        // 3. Activity Types
        console.log('Importing activity types from 5_ActivityType.csv...');
        const actTypesData = readCSV('5_ActivityType.csv');
        for (const row of actTypesData) {
            if (!row.id || !row.name) continue;
            await conn.query('INSERT INTO act_types (id, name) VALUES (?, ?)', [row.id, row.name]);
        }

        // 4. Targets
        console.log('Importing targets from 6_Target.csv...');
        const targetsData = readCSV('6_Target.csv');
        for (const row of targetsData) {
            if (!row.id || !row.name) continue;
            await conn.query('INSERT INTO targets (id, name) VALUES (?, ?)', [row.id, row.name]);
        }
        console.log('✔ Static reference data seeded.');

        // Step 4: Seed Departments for Faculty 1 (CNTT)
        console.log('Seeding departments for Faculty 1 (CNTT)...');
        const deptNames = [
            'Bộ môn Công nghệ Phần mềm',
            'Bộ môn Hệ thống Thông tin',
            'Bộ môn An toàn Thông tin'
        ];
        const deptIds = [];
        for (const name of deptNames) {
            const [res] = await conn.query('INSERT INTO departments (faculty_id, name) VALUES (1, ?)', [name]);
            deptIds.push(res.insertId);
        }
        console.log('✔ Departments seeded.');

        // Step 5: Seed Enterprises from 1_Company.csv
        console.log('Importing enterprises from 1_Company.csv...');
        const companiesData = readCSV('1_Company.csv');
        let insertedEnterprises = 0;
        const companyStatuses = {};

        for (const [index, row] of companiesData.entries()) {
            if (!row.id || !row.name) continue;

            const scaleId = row.id_quymo ? parseInt(row.id_quymo) : null;
            const isHcmc = row.is_hcmc === 'True' || row.is_hcmc === true || row.is_hcmc === 'true' ? 1 : 0;
            
            // Dynamic realistic status distribution
            const statuses = ['Đang triển khai', 'Đã ký hợp tác', 'Đàm phán', 'Tiềm năng'];
            const status = statuses[index % statuses.length];
            companyStatuses[row.id] = status;

            // Round-robin department assignment
            const deptId = deptIds[index % deptIds.length];

            await conn.query(
                'INSERT INTO enterprises (id, name, scale_id, is_hcmc, status, department_id, faculty_id) VALUES (?, ?, ?, ?, ?, ?, 1)',
                [row.id, row.name, scaleId, isHcmc, status, deptId]
            );
            insertedEnterprises++;

            // Representative
            const repTitle = row.rep_title || (index % 2 === 0 ? 'Ông' : 'Bà');
            const repName = row.rep_name || 'Đại diện doanh nghiệp';
            const repRole = row.rep_role || 'Quản lý';
            const repPhone = row.rep_phone || null;
            const repEmail = row.rep_email || null;

            await conn.query(
                'INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) VALUES (?, ?, ?, ?, ?, ?, 1)',
                [row.id, repTitle, repName, repRole, repPhone, repEmail]
            );

            // Address
            const addressBuilding = row.address_building || null;
            const addressDistrict = row.address_district || null;
            const addressProvince = row.address_province || 'TP. Hồ Chí Minh';
            const addressCountry = row.address_country || 'Việt Nam';

            await conn.query(
                'INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) VALUES (?, ?, ?, ?, ?, 1)',
                [row.id, addressBuilding, addressDistrict, addressProvince, addressCountry]
            );

            // Fields mapping
            if (row.id_fields) {
                const fieldIds = String(row.id_fields).split(',').map(f => parseInt(f.trim())).filter(f => !isNaN(f));
                for (const fId of fieldIds) {
                    await conn.query('INSERT IGNORE INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)', [row.id, fId]);
                }
            }
        }
        console.log(`✔ Imported ${insertedEnterprises} enterprises.`);

        // Step 6: Seed Activities from 4_Activities.csv
        console.log('Importing activities from 4_Activities.csv...');
        const activitiesData = readCSV('4_Activities.csv');
        let insertedActivities = 0;

        for (const [index, row] of activitiesData.entries()) {
            if (!row.id || !row.name || !row.id_company) continue;

            const enterpriseId = parseInt(row.id_company);
            const compStatus = companyStatuses[enterpriseId] || 'Tiềm năng';

            // Determine activity status based on company status
            let status = 'Đề xuất';
            if (compStatus === 'Đang triển khai' || compStatus === 'Đã ký hợp tác') {
                status = index % 3 === 0 ? 'Đã triển khai' : (index % 3 === 1 ? 'Phê duyệt nội bộ' : 'Đề xuất');
            }

            const startYear = 2024 + (index % 2);
            const startMonth = String(1 + (index % 12)).padStart(2, '0');
            const startDate = `${startYear}-${startMonth}-15`;

            // Faculty advisors for pic
            const advisors = ['TS. Nguyễn Trương Khang', 'TS. Phạm Văn Hùng', 'ThS. Lê Thanh Hà', 'TS. Nguyễn Minh Đức'];
            const personInCharge = advisors[index % advisors.length];

            await conn.query(
                'INSERT INTO activities (id, enterprise_id, title, detail, start_date, status, person_in_charge, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
                [row.id, enterpriseId, row.name, row.detail || row.name, startDate, status, personInCharge]
            );
            insertedActivities++;

            // Activity type map
            if (row.id_activity_type) {
                const typeIds = String(row.id_activity_type).split(',').map(t => parseInt(t.trim())).filter(t => !isNaN(t));
                for (const tId of typeIds) {
                    await conn.query('INSERT IGNORE INTO activity_type_map (activity_id, type_id) VALUES (?, ?)', [row.id, tId]);
                }
            }

            // Activity target map
            if (row.id_target) {
                const targetIds = String(row.id_target).split(',').map(t => parseInt(t.trim())).filter(t => !isNaN(t));
                for (const tId of targetIds) {
                    await conn.query('INSERT IGNORE INTO activity_target_map (activity_id, target_id) VALUES (?, ?)', [row.id, tId]);
                }
            }
        }
        console.log(`✔ Imported ${insertedActivities} activities.`);

        // Step 7: Import Students from SQL files
        console.log('Importing student data from SQL files...');
        const studentFiles = [
            path.join(__dirname, 'migrations', 'seed_students.sql'),
            path.join(__dirname, 'migrations', 'seed_students_2.sql'),
            path.join(__dirname, 'migrations', 'seed_students_3.sql')
        ];

        for (const file of studentFiles) {
            if (!fs.existsSync(file)) {
                console.warn(`Student SQL file not found: ${file}`);
                continue;
            }
            console.log(`Executing: ${path.basename(file)}`);
            const sql = fs.readFileSync(file, 'utf8');
            await conn.query(sql);
            console.log(`✔ Executed ${path.basename(file)}.`);
        }

        // Fetch student count
        const [[{ count: studentCount }]] = await conn.query('SELECT COUNT(*) as count FROM students');
        console.log(`✔ Seeded ${studentCount} students for Faculty 1 (CNTT).`);

        // Populate student_activities junction table from existing activity_id links
        console.log('Populating student_activities junction table from students.activity_id...');
        await conn.query('INSERT IGNORE INTO student_activities (student_id, activity_id) SELECT id, activity_id FROM students WHERE activity_id IS NOT NULL');
        const [[{ count: saCount }]] = await conn.query('SELECT COUNT(*) as count FROM student_activities');
        console.log(`✔ Populated ${saCount} records in student_activities junction table.`);

        // Step 8: Generate MOUs for Signed/Active Enterprises
        console.log('Generating MOUs for signed/active enterprises...');
        let insertedMOUs = 0;
        const [activeEnterprises] = await conn.query(
            "SELECT id, name, status, department_id FROM enterprises WHERE status IN ('Đã ký hợp tác', 'Đang triển khai')"
        );

        for (const comp of activeEnterprises) {
            insertedMOUs++;
            const sequenceNum = String(insertedMOUs).padStart(3, '0');
            const mouCode = `MOU-IT-2025-${sequenceNum}`;
            const signingDate = '2025-02-15';

            // Configure dynamic end dates for testing
            let endDate = '2027-12-31';
            if (insertedMOUs === 1) {
                // First MOU expires in exactly 3 days (trigger target)
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + 3);
                endDate = targetDate.toISOString().split('T')[0];
            } else if (insertedMOUs === 2) {
                // Second MOU is already expired
                endDate = '2025-06-30';
            }

            // Fetch representative
            const [repRows] = await conn.query(
                'SELECT full_name, role FROM enterprise_representatives WHERE enterprise_id = ? LIMIT 1',
                [comp.id]
            );
            const partnerContact = repRows.length > 0 ? `${repRows[0].full_name} - ${repRows[0].role}` : 'Đại diện đối tác';

            const orgType = comp.id % 2 === 0 ? 'Tập đoàn Công nghệ' : 'Doanh nghiệp CNTT';
            const country = 'Việt Nam';
            const scope = 'Hợp tác đào tạo, tiếp nhận sinh viên thực tập ngành Công nghệ Thông tin, tổ chức hội thảo định hướng nghề nghiệp và phối hợp tuyển dụng.';

            const vluContact = 'TS. Nguyễn Trương Khang';
            const tasks = 'Tiếp nhận sinh viên thực tập khóa K27; phối hợp tổ chức các buổi báo cáo chuyên đề.';
            const nextSteps = 'Đánh giá kết quả thực tập đợt 1 và chuẩn bị kế hoạch ký gia hạn hợp tác cho năm học mới.';
            const pastActs = 'Tiếp nhận sinh viên thực tập các kỳ và tham gia tài trợ sự kiện Khoa.';
            const relatedData = 'Đã tiếp nhận thực tập cho hơn 20 sinh viên Khoa CNTT.';

            // Find one activity to link if exists
            const [actRows] = await conn.query('SELECT id FROM activities WHERE enterprise_id = ? LIMIT 1', [comp.id]);
            const linkedActId = actRows.length > 0 ? actRows[0].id : null;

            await conn.query(`
                INSERT INTO mous (
                    mou_code, enterprise_id, signing_date, end_date, expiry_email_sent, partner_contact, org_type, country,
                    collaboration_scope, executing_unit_id, vlu_contact, tasks_ay24_25, next_steps, past_activities, related_data, activity_id, faculty_id
                ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `, [mouCode, comp.id, signingDate, endDate, partnerContact, orgType, country, scope, comp.department_id, vluContact, tasks, nextSteps, pastActs, relatedData, linkedActId]);
        }
        console.log(`✔ Generated ${insertedMOUs} MOUs for Khoa CNTT.`);

        // Step 9: Seed Board Data (Kanban Tasks & Notes) for Khoa CNTT users
        console.log('Generating Kanban tasks & notes for Khoa CNTT users...');
        const usersToSeed = [2, 3]; // manager.it (id:2) and lecturer.it (id:3)
        let insertedTasks = 0;
        let insertedNotes = 0;

        for (const userId of usersToSeed) {
            // 1. Kanban Tasks
            const tasksData = [
                {
                    title: `Rà soát phụ lục hợp tác với đối tác thực tập`,
                    description: `Kiểm tra và chuẩn bị hồ sơ ký kết biên bản ghi nhớ hợp tác mới với các công ty CNTT vừa import.`,
                    status: 'Cần làm',
                    priority: 'Cao'
                },
                {
                    title: `Đánh giá kết quả thực tập giữa kỳ`,
                    description: `Liên hệ với người hướng dẫn tại các doanh nghiệp đối tác để thu thập bảng đánh giá sinh viên thực tập đợt này.`,
                    status: 'Đang thực hiện',
                    priority: 'Trung bình'
                }
            ];

            for (const t of tasksData) {
                await conn.query(`
                    INSERT INTO tasks (title, description, status, priority, created_by, assigned_to, faculty_id)
                    VALUES (?, ?, ?, ?, ?, ?, 1)
                `, [t.title, t.description, t.status, t.priority, userId, userId]);
                insertedTasks++;
            }

            // 2. Sticky Notes
            const notesData = [
                {
                    title: `Lưu ý kiểm định chất lượng 2026`,
                    content: `Cần chuẩn bị đầy đủ hồ sơ minh chứng hợp tác doanh nghiệp (biên bản MOU ký kết, danh sách hoạt động, đánh giá của doanh nghiệp) cho kiểm định khoa.`,
                    color: '#fef08a'
                },
                {
                    title: `Đề xuất thêm vị trí thực tập`,
                    content: `Gửi email liên hệ với các doanh nghiệp như AWS, KMS, Hitachi Vantara để xin thêm 10 chỉ tiêu thực tập bổ sung.`,
                    color: '#bfdbfe'
                }
            ];

            for (const n of notesData) {
                await conn.query(`
                    INSERT INTO notes (title, content, color, created_by)
                    VALUES (?, ?, ?, ?)
                `, [n.title, n.content, n.color, userId]);
                insertedNotes++;
            }
        }
        console.log(`✔ Seeded ${insertedTasks} Kanban tasks and ${insertedNotes} sticky notes.`);

        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('\n======================================================');
        console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
        console.log('======================================================');
        console.log(`✔ Loaded CSV static data and CNTT departments.`);
        console.log(`✔ Loaded ${insertedEnterprises} enterprises from CSV for Faculty 1 (CNTT).`);
        console.log(`✔ Loaded ${insertedActivities} activities from CSV for Faculty 1 (CNTT).`);
        console.log(`✔ Loaded ${insertedMOUs} MOUs for Faculty 1 (CNTT).`);
        console.log(`✔ Loaded ${studentCount} students for Faculty 1 (CNTT).`);
        console.log(`✔ Seeded ${insertedTasks} tasks & ${insertedNotes} sticky notes.`);
        console.log('======================================================\n');

    } catch (err) {
        if (conn) {
            await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        }
        console.error('❌ Database seeding failed:', err.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

seed();
