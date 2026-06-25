/**
 * Clean Database Seeder (seed2) for VLU Enterprise Link
 * Wipes transactional data and initializes only core schemas, reference tables,
 * default users, faculties, and departments.
 * Does NOT import any Enterprises, Students, Activities, or MOUs.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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

async function seedClean() {
    console.log('🚀 Starting Clean Database Seeder (seed2)...');

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

        // Step 1: Run schema (database.sql) to initialize tables and users
        const sqlFilePath = path.join(__dirname, '..', 'database.sql');
        console.log(`Executing schema file: ${sqlFilePath}`);
        const sql = fs.readFileSync(sqlFilePath, 'utf8');
        await conn.query(sql);
        console.log('✔ Schema and default users/faculties initialized successfully.');

        // Select target database
        await conn.query(`USE \`${process.env.DB_NAME || 'vlu_enterprise_link'}\``);

        console.log('Disabling foreign key checks and clearing transactional tables...');
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');

        // Step 2: Truncate only transactional and dynamic tables
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

        // 2. Fields
        console.log('Importing fields from 2_Fields.csv...');
        const fieldsData = readCSV('2_Fields.csv');
        for (const row of fieldsData) {
            if (!row.id || !row.name) continue;
            // Seed under faculty_id = 1 for IT department fields
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
        for (const name of deptNames) {
            await conn.query('INSERT INTO departments (faculty_id, name) VALUES (1, ?)', [name]);
        }
        console.log('✔ Departments seeded.');

        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('\n======================================================');
        console.log('🎉 CLEAN SEEDING (seed2) COMPLETED SUCCESSFULLY!');
        console.log('======================================================');
        console.log('System is now ready with core configurations, users,');
        console.log('departments, and metadata, but has NO transactional records.');
        console.log('======================================================\n');

    } catch (err) {
        if (conn) {
            await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        }
        console.error('❌ Clean database seeding failed:', err.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

seedClean();
