/**
 * Seed VLU Faculties and Faculty Accounts
 * Adds all Van Lang University faculties (Khoa), one FACULTY_MANAGER and one LECTURER per khoa
 * Password for all accounts: 123456
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const PASS_HASH = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'; // bcrypt of '123456'

// All VLU Faculties (Trường Đại học Văn Lang)
const VLU_FACULTIES = [
    { code: 'ARCH',  name: 'Khoa Kiến trúc' },
    { code: 'FA',    name: 'Khoa Mỹ thuật' },
    { code: 'ID',    name: 'Khoa Thiết kế Công nghiệp' },
    { code: 'GD',    name: 'Khoa Thiết kế Đồ họa' },
    { code: 'INT',   name: 'Khoa Thiết kế Nội thất' },
    { code: 'FASH',  name: 'Khoa Thiết kế Thời trang' },
    { code: 'IT',    name: 'Khoa Công nghệ Thông tin' },
    { code: 'CE',    name: 'Khoa Kỹ thuật Công trình' },
    { code: 'ME',    name: 'Khoa Kỹ thuật Cơ - Điện tử' },
    { code: 'ECO',   name: 'Khoa Kinh tế' },
    { code: 'BA',    name: 'Khoa Quản trị Kinh doanh' },
    { code: 'MARK',  name: 'Khoa Marketing' },
    { code: 'FIN',   name: 'Khoa Tài chính - Kế toán' },
    { code: 'TOUR',  name: 'Khoa Du lịch' },
    { code: 'HOTEL', name: 'Khoa Khách sạn - Nhà hàng' },
    { code: 'LAW',   name: 'Khoa Luật' },
    { code: 'ENG',   name: 'Khoa Ngoại ngữ' },
    { code: 'COMM',  name: 'Khoa Truyền thông & Báo chí' },
    { code: 'PR',    name: 'Khoa Quan hệ Công chúng' },
    { code: 'PSY',   name: 'Khoa Tâm lý học' },
    { code: 'NURS',  name: 'Khoa Điều dưỡng' },
    { code: 'PHARM', name: 'Khoa Dược' },
];

async function seed() {
    const pool = await mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'vlu_enterprise_link',
    });

    const conn = await pool.getConnection();
    try {
        // Get existing faculties to avoid duplicates
        const [existingFaculties] = await conn.query('SELECT code FROM faculties');
        const existingCodes = new Set(existingFaculties.map(f => f.code));

        let insertedFaculties = 0;
        let insertedUsers = 0;

        for (const fac of VLU_FACULTIES) {
            let facultyId;

            if (existingCodes.has(fac.code)) {
                // Get existing faculty id
                const [rows] = await conn.query('SELECT id FROM faculties WHERE code = ?', [fac.code]);
                facultyId = rows[0].id;
                console.log(`⏭  Faculty already exists: ${fac.name} (${fac.code}) → ID ${facultyId}`);
            } else {
                // Insert new faculty (cluster_id=1 as generic grouping)
                const [result] = await conn.query(
                    'INSERT INTO faculties (cluster_id, name, code) VALUES (?, ?, ?)',
                    [1, fac.name, fac.code]
                );
                facultyId = result.insertId;
                insertedFaculties++;
                console.log(`✔  Inserted faculty: ${fac.name} (${fac.code}) → ID ${facultyId}`);
            }

            // Create email-safe code (lowercase)
            const emailCode = fac.code.toLowerCase();

            // Insert FACULTY_MANAGER if not exists
            const managerEmail = `manager.${emailCode}@vlu.edu.vn`;
            const [existManager] = await conn.query('SELECT id FROM users WHERE email = ?', [managerEmail]);
            if (existManager.length === 0) {
                await conn.query(
                    'INSERT INTO users (full_name, email, password, role, faculty_id) VALUES (?, ?, ?, ?, ?)',
                    [`Quản lý ${fac.name}`, managerEmail, PASS_HASH, 'FACULTY_MANAGER', facultyId]
                );
                insertedUsers++;
                console.log(`  ✔ FACULTY_MANAGER: ${managerEmail}`);
            } else {
                console.log(`  ⏭  FACULTY_MANAGER already exists: ${managerEmail}`);
            }

            // Insert LECTURER if not exists
            const lecturerEmail = `lecturer.${emailCode}@vlu.edu.vn`;
            const [existLecturer] = await conn.query('SELECT id FROM users WHERE email = ?', [lecturerEmail]);
            if (existLecturer.length === 0) {
                await conn.query(
                    'INSERT INTO users (full_name, email, password, role, faculty_id) VALUES (?, ?, ?, ?, ?)',
                    [`Giảng viên ${fac.name}`, lecturerEmail, PASS_HASH, 'LECTURER', facultyId]
                );
                insertedUsers++;
                console.log(`  ✔ LECTURER:         ${lecturerEmail}`);
            } else {
                console.log(`  ⏭  LECTURER already exists:         ${lecturerEmail}`);
            }
        }

        console.log(`\n🎉 Done! Inserted ${insertedFaculties} faculties and ${insertedUsers} user accounts.`);
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        conn.release();
        await pool.end();
    }
}

seed();
