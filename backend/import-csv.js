const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vlu_enterprise_link',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

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

const ST_SCALES = [
    "Tier 1 (Tập đoàn/Global)",
    "Tier 2 (SME)",
    "Tier 3 (Startup/Micro)"
];

const ST_FIELDS = [
    "Phần mềm & Outsource", 
    "Giải pháp CNTT & Chuyển đổi số", 
    "Hạ tầng & Viễn thông", 
    "Tài chính & Fintech", 
    "Phần cứng & Điện tử", 
    "Marketing & Truyền thông", 
    "Khác"
];

const ST_ACT_TYPES = [
    "Tuyển dụng & Thực tập", 
    "Hội thảo & Đào tạo", 
    "Tài trợ & Học bổng", 
    "Tham quan doanh nghiệp", 
    "Kiểm định & Đánh giá", 
    "Ký kết MOU", 
    "Khác"
];

// Heuristics
function getCompanyInfo(name) {
    const n = name.toLowerCase();
    
    let scale = "Tier 2 (SME)";
    if (/(aws|hitachi|tma|fpt|acb|mobifone|cmc|dxc|vnpt|nashtech|kms|nab|dek|opswat|sharp|sctv|vinasa|vnito|agest|mitek|elca)/.test(n)) {
        scale = "Tier 1 (Tập đoàn/Global)";
    } else if (/(aircity|beelieve|meta art|namiq|aliniex|1base|payror)/.test(n)) {
        scale = "Tier 3 (Startup/Micro)";
    }

    let fields = [];
    if (/(software|soft|tech|technology|tma|kms|nashtech|dxc|dek|wata|tps|kyanon|vtimes|engma|fisoft|pizitech|t4tek|mitek|mksol|hitachi)/.test(n)) {
        fields.push("Phần mềm & Outsource");
    }
    if (/(aws|cloud|solution|giải pháp|cmc|vnpt|smart|số|hệ thống|vnresource|opswat|c\. p|tiên khanh|3ps|alila|alta)/.test(n)) {
        fields.push("Giải pháp CNTT & Chuyển đổi số");
    }
    if (/(fpt|mobifone|sctv|viễn thông|hạ tầng|mạng)/.test(n)) {
        fields.push("Hạ tầng & Viễn thông");
    }
    if (/(acb|payror|chứng khoán|ngân hàng|aliniex)/.test(n)) {
        fields.push("Tài chính & Fintech");
    }
    if (/(sharp|điện tử|phần cứng|máy tính|robotics)/.test(n)) {
        fields.push("Phần cứng & Điện tử");
    }
    if (/(marketing|media|truyền thông|cánh cam|sen vàng|tmai)/.test(n)) {
        fields.push("Marketing & Truyền thông");
    }
    
    if (fields.length === 0) fields.push("Khác");
    
    return { scale, fields };
}

function getActivityTypes(title, detail) {
    const str = (title + " " + detail).toLowerCase();
    const types = [];
    if (str.includes("mou") || str.includes("ký kết")) types.push("Ký kết MOU");
    if (str.includes("kiểm định") || str.includes("phỏng vấn") || str.includes("khảo sát") || str.includes("đánh giá")) types.push("Kiểm định & Đánh giá");
    if (str.includes("tuyển dụng") || str.includes("thực tập") || str.includes("việc làm") || str.includes("nhân sự") || str.includes("capstone") || str.includes("kltn") || str.includes("nhận sinh viên") || str.includes("hướng dẫn sinh viên")) types.push("Tuyển dụng & Thực tập");
    if (str.includes("hội thảo") || str.includes("đào tạo") || str.includes("tọa đàm") || str.includes("môn học") || str.includes("định hướng") || str.includes("chuyên ngành") || str.includes("bảo vệ") || str.includes("tư vấn") || str.includes("giảng dạy")) types.push("Hội thảo & Đào tạo");
    if (str.includes("học bổng") || str.includes("tặng quà") || str.includes("bánh kem") || str.includes("tặng hoa") || str.includes("tài trợ") || str.includes("tiệc") || str.includes("tri ân")) types.push("Tài trợ & Học bổng");
    if (str.includes("tham quan")) types.push("Tham quan doanh nghiệp");
    
    if (types.length === 0) types.push("Khác");
    return types;
}

async function importData() {
    console.log('Starting data import with AI heuristics...');
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        console.log('Disabling foreign key checks and truncating tables...');
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        
        const tablesToTruncate = [
            'activity_target_map', 'activity_type_map', 'activities',
            'enterprise_fields', 'enterprise_addresses', 'enterprise_representatives', 'enterprises',
            'targets', 'act_types', 'scales', 'fields'
        ];
        
        for (const table of tablesToTruncate) {
            await conn.query(`TRUNCATE TABLE ${table}`);
        }

        // 1. Insert Static Reference Data
        console.log('Generating Scales, Fields, and Activity Types...');
        const scaleMap = {};
        for (const [i, name] of ST_SCALES.entries()) {
            await conn.query('INSERT INTO scales (id, name) VALUES (?, ?)', [i + 1, name]);
            scaleMap[name] = i + 1;
        }

        const fieldMap = {};
        for (const [i, name] of ST_FIELDS.entries()) {
            await conn.query('INSERT INTO fields (id, name) VALUES (?, ?)', [i + 1, name]);
            fieldMap[name] = i + 1;
        }

        const actTypeMap = {};
        for (const [i, name] of ST_ACT_TYPES.entries()) {
            await conn.query('INSERT INTO act_types (id, name) VALUES (?, ?)', [i + 1, name]);
            actTypeMap[name] = i + 1;
        }

        // 2. Import Targets (keep from CSV)
        console.log('Importing Targets from CSV...');
        const targetsData = readCSV('6_Target.csv');
        for (const row of targetsData) {
            if (!row.id || !row.name) continue;
            await conn.query('INSERT INTO targets (id, name) VALUES (?, ?)', [row.id, row.name]);
        }

        // 3. Import Enterprises
        console.log('Importing and mapping Enterprises...');
        const companiesData = readCSV('1_Company.csv');
        for (const row of companiesData) {
            if (!row.id || !row.name) continue;
            
            const isHcmc = row.is_hcmc ? (row.is_hcmc.toLowerCase() === 'true' || row.is_hcmc === '1') : false;
            
            // LLM Heuristic Evaluation
            const info = getCompanyInfo(row.name);
            const scaleId = scaleMap[info.scale] || null;

            await conn.query(
                'INSERT INTO enterprises (id, name, scale_id, is_hcmc, status, faculty_id) VALUES (?, ?, ?, ?, ?, 1)',
                [row.id, row.name, scaleId, isHcmc, 'Tiềm năng']
            );

            // Insert representative
            if (row.rep_name || row.rep_phone || row.rep_email) {
                await conn.query(
                    'INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) VALUES (?, ?, ?, ?, ?, ?, 1)',
                    [row.id, row.rep_title || null, row.rep_name || null, row.rep_role || null, row.rep_phone || null, row.rep_email || null]
                );
            }

            // Insert address
            if (row.address_building || row.address_district || row.address_province) {
                await conn.query(
                    'INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) VALUES (?, ?, ?, ?, ?, 1)',
                    [row.id, row.address_building || null, row.address_district || null, row.address_province || null, row.address_country || 'Việt Nam']
                );
            }

            // Insert fields
            for (const fieldName of info.fields) {
                const fId = fieldMap[fieldName];
                if (fId) {
                    await conn.query('INSERT IGNORE INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)', [row.id, fId]);
                }
            }
        }

        // 4. Import Activities
        console.log('Importing and mapping Activities...');
        const activitiesData = readCSV('4_Activities.csv');
        for (const row of activitiesData) {
            if (!row.id || !row.name || !row.id_company) continue;

            await conn.query(
                'INSERT INTO activities (id, enterprise_id, title, detail, status, faculty_id) VALUES (?, ?, ?, ?, ?, 1)',
                [row.id, row.id_company, row.name, row.detail || '', 'Đề xuất']
            );

            // LLM Heuristic Evaluation for Activity Type
            const actTypes = getActivityTypes(row.name, row.detail || '');
            for (const typeName of actTypes) {
                const tId = actTypeMap[typeName];
                if (tId) {
                    await conn.query('INSERT IGNORE INTO activity_type_map (activity_id, type_id) VALUES (?, ?)', [row.id, tId]);
                }
            }

            // Insert activity targets map (keep original targets)
            if (row.id_target) {
                const targets = row.id_target.split(',').map(t => t.trim()).filter(Boolean);
                for (const tId of targets) {
                    await conn.query('INSERT IGNORE INTO activity_target_map (activity_id, target_id) VALUES (?, ?)', [row.id, tId]);
                }
            }
        }

        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        await conn.commit();
        console.log('Data import completed successfully!');

    } catch (error) {
        if (conn) {
            await conn.rollback();
            await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        }
        console.error('Error importing data:', error);
    } finally {
        if (conn) conn.release();
        await pool.end();
    }
}

importData();
