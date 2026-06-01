const pool = require('./config/db');

async function seedTourism() {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Find or create Faculty 'Khoa Du lịch'
        let [faculties] = await conn.query("SELECT id FROM faculties WHERE code = 'TOUR' OR name = 'Khoa Du lịch'");
        let facultyId;
        if (faculties.length > 0) {
            facultyId = faculties[0].id;
            console.log(`Found existing Tourism Faculty: ID ${facultyId}`);
        } else {
            // Find a cluster
            const [clusters] = await conn.query("SELECT id FROM clusters ORDER BY id LIMIT 1");
            const clusterId = clusters.length > 0 ? clusters[0].id : 1;
            const [insertFac] = await conn.query(
                "INSERT INTO faculties (cluster_id, name, code) VALUES (?, 'Khoa Du lịch', 'TOUR')",
                [clusterId]
            );
            facultyId = insertFac.insertId;
            console.log(`Created Tourism Faculty: ID ${facultyId}`);
        }

        // 2. Find or create Department 'Bộ môn Du lịch & Lữ hành' under Tourism Faculty
        let [departments] = await conn.query("SELECT id FROM departments WHERE faculty_id = ?", [facultyId]);
        let departmentId;
        if (departments.length > 0) {
            departmentId = departments[0].id;
            console.log(`Found existing Department: ID ${departmentId}`);
        } else {
            const [insertDept] = await conn.query(
                "INSERT INTO departments (faculty_id, name) VALUES (?, 'Bộ môn Du lịch và Lữ hành')",
                [facultyId]
            );
            departmentId = insertDept.insertId;
            console.log(`Created Tourism Department: ID ${departmentId}`);
        }

        // 3. Clean up existing data for this faculty to ensure idempotency
        await conn.query("DELETE FROM students WHERE faculty_id = ?", [facultyId]);
        await conn.query("DELETE FROM activities WHERE faculty_id = ?", [facultyId]);
        await conn.query("DELETE FROM enterprises WHERE faculty_id = ?", [facultyId]);
        console.log("Cleaned up existing sample data for Tourism Faculty");

        // 4. Ensure field exists (Du lịch & Lữ hành)
        let [fields] = await conn.query("SELECT id FROM fields WHERE name = 'Du lịch & Lữ hành'");
        let fieldId;
        if (fields.length > 0) {
            fieldId = fields[0].id;
        } else {
            const [insertField] = await conn.query("INSERT INTO fields (name) VALUES ('Du lịch & Lữ hành')");
            fieldId = insertField.insertId;
        }

        // Helper to get or insert activity types
        async function getActTypeId(name) {
            let [rows] = await conn.query("SELECT id FROM act_types WHERE name = ?", [name]);
            if (rows.length > 0) return rows[0].id;
            let [res] = await conn.query("INSERT INTO act_types (name) VALUES (?)", [name]);
            return res.insertId;
        }
        const typeRecruitment = await getActTypeId('Tuyển dụng & Thực tập');
        const typeWorkshop = await getActTypeId('Hội thảo & Đào tạo');
        const typeTour = await getActTypeId('Tham quan doanh nghiệp');

        // Helper to get or insert targets
        async function getTargetId(name) {
            let [rows] = await conn.query("SELECT id FROM targets WHERE name = ?", [name]);
            if (rows.length > 0) return rows[0].id;
            let [res] = await conn.query("INSERT INTO targets (name) VALUES (?)", [name]);
            return res.insertId;
        }
        const targetAll = await getTargetId('Tất cả sinh viên');
        const targetY3 = await getTargetId('Sinh viên năm 3');
        const targetY4 = await getTargetId('Sinh viên năm 4');

        // 5. Insert 3 Companies
        // Company 1: Vietravel
        const [resVietravel] = await conn.query(
            `INSERT INTO enterprises (name, tax_code, scale_id, is_hcmc, status, department_id, faculty_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Công ty Cổ phần Du lịch và Tiếp thị Giao thông Vận tải Việt Nam (Vietravel)', '0300465937', 1, 1, 'Đã ký hợp tác', departmentId, facultyId]
        );
        const vietravelId = resVietravel.insertId;

        await conn.query(
            `INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [vietravelId, 'Ông', 'Nguyễn Quốc Kỳ', 'Chủ tịch HĐQT', '02838228898', 'info@vietravel.com', 1]
        );
        await conn.query(
            `INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [vietravelId, '190 Pasteur', 'Quận 3', 'TP. Hồ Chí Minh', 'Việt Nam', 1]
        );
        await conn.query(`INSERT INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)`, [vietravelId, fieldId]);

        // Company 2: Saigontourist
        const [resSaigontourist] = await conn.query(
            `INSERT INTO enterprises (name, tax_code, scale_id, is_hcmc, status, department_id, faculty_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Công ty TNHH MTV Dịch vụ Lữ hành Saigontourist', '0300583648', 1, 1, 'Đang triển khai', departmentId, facultyId]
        );
        const saigontouristId = resSaigontourist.insertId;

        await conn.query(
            `INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [saigontouristId, 'Ông', 'Nguyễn Hữu Y', 'Giám đốc Lữ hành', '02838298914', 'info@saigontourist.net', 1]
        );
        await conn.query(
            `INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [saigontouristId, '45 Lê Thánh Tôn', 'Quận 1', 'TP. Hồ Chí Minh', 'Việt Nam', 1]
        );
        await conn.query(`INSERT INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)`, [saigontouristId, fieldId]);

        // Company 3: Fiditour
        const [resFiditour] = await conn.query(
            `INSERT INTO enterprises (name, tax_code, scale_id, is_hcmc, status, department_id, faculty_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Công ty Cổ phần Du lịch Fiditour', '0301077583', 2, 1, 'Đang triển khai', departmentId, facultyId]
        );
        const fiditourId = resFiditour.insertId;

        await conn.query(
            `INSERT INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [fiditourId, 'Ông', 'Trần Thế Dũng', 'Tổng Giám đốc', '02839141414', 'info@fiditour.com', 1]
        );
        await conn.query(
            `INSERT INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [fiditourId, '129 Nguyễn Huệ', 'Quận 1', 'TP. Hồ Chí Minh', 'Việt Nam', 1]
        );
        await conn.query(`INSERT INTO enterprise_fields (enterprise_id, field_id) VALUES (?, ?)`, [fiditourId, fieldId]);

        console.log("Inserted 3 companies (Vietravel, Saigontourist, Fiditour)");

        // 6. Insert 3 Contracts (MOUs)
        const [resMOU1] = await conn.query(
            `INSERT INTO mous (mou_code, enterprise_id, signing_date, partner_contact, org_type, country, collaboration_scope, executing_unit_id, vlu_contact) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['MOU-TOUR-2024-VIETRAVEL', vietravelId, '2024-04-10', 'Nguyễn Quốc Kỳ - Chủ tịch HĐQT', 'Doanh nghiệp', 'Việt Nam', 'Hợp tác đào tạo, tiếp nhận sinh viên thực tập ngành Du lịch & Lữ hành, tổ chức tour thực tế.', departmentId, 'ThS. Nguyễn Thị Hoa']
        );
        const [resMOU2] = await conn.query(
            `INSERT INTO mous (mou_code, enterprise_id, signing_date, partner_contact, org_type, country, collaboration_scope, executing_unit_id, vlu_contact) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['MOU-TOUR-2024-SAIGONTOURIST', saigontouristId, '2024-05-15', 'Nguyễn Hữu Y - Giám đốc Lữ hành', 'Doanh nghiệp', 'Việt Nam', 'Tài trợ học bổng, kiến tập và thực tập tour, chia sẻ chuyên gia từ Saigontourist.', departmentId, 'ThS. Nguyễn Thị Hoa']
        );
        const [resMOU3] = await conn.query(
            `INSERT INTO mous (mou_code, enterprise_id, signing_date, partner_contact, org_type, country, collaboration_scope, executing_unit_id, vlu_contact) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['MOU-TOUR-2024-FIDITOUR', fiditourId, '2024-06-01', 'Trần Thế Dũng - Tổng Giám đốc', 'Doanh nghiệp', 'Việt Nam', 'Hợp tác hướng dẫn đồ án tốt nghiệp, tổ chức workshop kỹ năng hướng dẫn viên du lịch.', departmentId, 'ThS. Nguyễn Thị Hoa']
        );

        console.log("Inserted 3 MOUs (contracts)");

        // 7. Insert 3 Events (Activities) per Company (9 total)
        // Vietravel events
        const [resActV1] = await conn.query(
            `INSERT INTO activities (enterprise_id, title, detail, start_date, status, faculty_id, person_in_charge) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [vietravelId, 'Kiến tập thực tế Tour Vũng Tàu 2 ngày 1 đêm', 'Thực hành kỹ năng hướng dẫn viên và điều hành tour thực tế cho sinh viên', '2024-11-15', 'Đã triển khai', facultyId, 'ThS. Nguyễn Văn A']
        );
        const actVietravel1 = resActV1.insertId;
        await conn.query("INSERT INTO activity_type_map (activity_id, type_id) VALUES (?, ?)", [actVietravel1, typeTour]);
        await conn.query("INSERT INTO activity_target_map (activity_id, target_id) VALUES (?, ?)", [actVietravel1, targetAll]);

        const [resActV2] = await conn.query(
            `INSERT INTO activities (enterprise_id, title, detail, start_date, status, faculty_id, person_in_charge) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [vietravelId, 'Ngày hội Tuyển dụng Hướng dẫn viên Du lịch 2024', 'Tuyển dụng cộng tác viên hướng dẫn viên cho các tour lễ hội cuối năm', '2024-12-05', 'Đã kết thúc', facultyId, 'ThS. Trần Thị B']
        );
        const actVietravel2 = resActV2.insertId;
        await conn.query("INSERT INTO activity_type_map (activity_id, type_id) VALUES (?, ?)", [actVietravel2, typeRecruitment]);
        await conn.query("INSERT INTO activity_target_map (activity_id, target_id) VALUES (?, ?)", [actVietravel2, targetY4]);

        const [resActV3] = await conn.query(
            `INSERT INTO activities (enterprise_id, title, detail, start_date, status, faculty_id, person_in_charge) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [vietravelId, 'Workshop: Kỹ năng điều hành và thiết kế Tour chuyên nghiệp', 'Workshop chia sẻ kinh nghiệm thiết kế tour quốc tế và nội địa', '2025-03-20', 'Đề xuất', facultyId, 'ThS. Nguyễn Văn A']
        );
        const actVietravel3 = resActV3.insertId;
        await conn.query("INSERT INTO activity_type_map (activity_id, type_id) VALUES (?, ?)", [actVietravel3, typeWorkshop]);
        await conn.query("INSERT INTO activity_target_map (activity_id, target_id) VALUES (?, ?)", [actVietravel3, targetY3]);

        // Saigontourist events
        const [resActS1] = await conn.query(
            `INSERT INTO activities (enterprise_id, title, detail, start_date, status, faculty_id, person_in_charge) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [saigontouristId, 'Company Tour - Tham quan Trụ sở Saigontourist', 'Tham quan và trải nghiệm môi trường làm việc thực tế tại văn phòng Saigontourist', '2024-10-12', 'Đã triển khai', facultyId, 'ThS. Lê Văn C']
        );
        const actSaigontourist1 = resActS1.insertId;
        await conn.query("INSERT INTO activity_type_map (activity_id, type_id) VALUES (?, ?)", [actSaigontourist1, typeTour]);
        await conn.query("INSERT INTO activity_target_map (activity_id, target_id) VALUES (?, ?)", [actSaigontourist1, targetAll]);

        const [resActS2] = await conn.query(
            `INSERT INTO activities (enterprise_id, title, detail, start_date, status, faculty_id, person_in_charge) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [saigontouristId, 'Chương trình tuyển chọn Hướng dẫn viên tài năng Saigontourist', 'Đánh giá năng lực và chọn lọc sinh viên thực tập xuất sắc vào đội ngũ chính thức', '2024-12-20', 'Đã kết thúc', facultyId, 'ThS. Lê Văn C']
        );
        const actSaigontourist2 = resActS2.insertId;
        await conn.query("INSERT INTO activity_type_map (activity_id, type_id) VALUES (?, ?)", [actSaigontourist2, typeRecruitment]);
        await conn.query("INSERT INTO activity_target_map (activity_id, target_id) VALUES (?, ?)", [actSaigontourist2, targetY4]);

        const [resActS3] = await conn.query(
            `INSERT INTO activities (enterprise_id, title, detail, start_date, status, faculty_id, person_in_charge) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [saigontouristId, 'Hội thảo: Xu hướng Du lịch xanh và bền vững', 'Chia sẻ các giải pháp du lịch sinh thái và phát triển bền vững thời đại mới', '2025-04-15', 'Phê duyệt nội bộ', facultyId, 'ThS. Nguyễn Thị D']
        );
        const actSaigontourist3 = resActS3.insertId;
        await conn.query("INSERT INTO activity_type_map (activity_id, type_id) VALUES (?, ?)", [actSaigontourist3, typeWorkshop]);
        await conn.query("INSERT INTO activity_target_map (activity_id, target_id) VALUES (?, ?)", [actSaigontourist3, targetAll]);

        // Fiditour events
        const [resActF1] = await conn.query(
            `INSERT INTO activities (enterprise_id, title, detail, start_date, status, faculty_id, person_in_charge) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [fiditourId, 'Kiến tập nghiệp vụ điều hành tại Fiditour', 'Kiến tập thực tế tại phòng điều hành du lịch nội địa và quốc tế', '2024-09-18', 'Đã triển khai', facultyId, 'ThS. Phạm Văn E']
        );
        const actFiditour1 = resActF1.insertId;
        await conn.query("INSERT INTO activity_type_map (activity_id, type_id) VALUES (?, ?)", [actFiditour1, typeRecruitment]);
        await conn.query("INSERT INTO activity_target_map (activity_id, target_id) VALUES (?, ?)", [actFiditour1, targetY3]);

        const [resActF2] = await conn.query(
            `INSERT INTO activities (enterprise_id, title, detail, start_date, status, faculty_id, person_in_charge) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [fiditourId, 'Workshop: Tiếng Anh chuyên ngành Du lịch và Lữ hành', 'Nâng cao năng lực ngoại ngữ giao tiếp và xử lý tình huống du lịch', '2024-11-20', 'Đã triển khai', facultyId, 'ThS. Phạm Văn E']
        );
        const actFiditour2 = resActF2.insertId;
        await conn.query("INSERT INTO activity_type_map (activity_id, type_id) VALUES (?, ?)", [actFiditour2, typeWorkshop]);
        await conn.query("INSERT INTO activity_target_map (activity_id, target_id) VALUES (?, ?)", [actFiditour2, targetAll]);

        const [resActF3] = await conn.query(
            `INSERT INTO activities (enterprise_id, title, detail, start_date, status, faculty_id, person_in_charge) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [fiditourId, 'Chương trình thực tập sinh tiềm năng Fiditour 2025', 'Tiếp nhận sinh viên thực tập tốt nghiệp năm học 2024-2025', '2025-02-15', 'Đang triển khai', facultyId, 'ThS. Hoàng Thị F']
        );
        const actFiditour3 = resActF3.insertId;
        await conn.query("INSERT INTO activity_type_map (activity_id, type_id) VALUES (?, ?)", [actFiditour3, typeRecruitment]);
        await conn.query("INSERT INTO activity_target_map (activity_id, target_id) VALUES (?, ?)", [actFiditour3, targetY4]);

        console.log("Inserted 9 activities (3 per company)");

        // 8. Insert 10 Students for 'Khoa Du lịch'
        const studentsData = [
            ['217DL01001', 'Lê Minh Triết', 'K27-DL1', 'Quản trị Dịch vụ Du lịch và Lữ hành', actVietravel1, vietravelId, 'Thực tập viên Hướng dẫn viên', 'Đang thực tập', 3.40, '2024-11-15', '2025-02-15'],
            ['217DL01002', 'Nguyễn Thị Mai Chi', 'K27-DL1', 'Quản trị Dịch vụ Du lịch và Lữ hành', actVietravel2, vietravelId, 'Cộng tác viên Hướng dẫn viên', 'Hoàn thành', 3.25, '2024-12-05', '2025-01-05'],
            ['217DL01003', 'Trần Hoàng Nam', 'K27-DL1', 'Quản trị Dịch vụ Du lịch và Lữ hành', actSaigontourist2, saigontouristId, 'Thực tập sinh Lữ hành', 'Đang thực tập', 2.80, '2024-12-20', '2025-03-20'],
            ['217DL01004', 'Phạm Hồng Ngọc', 'K27-DL1', 'Quản trị Dịch vụ Du lịch và Lữ hành', actSaigontourist3, saigontouristId, 'Trợ lý Điều hành Tour', 'Chờ phân công', 3.65, null, null],
            ['217DL01005', 'Vũ Gia Bảo', 'K27-DL2', 'Quản trị Dịch vụ Du lịch và Lữ hành', actFiditour1, fiditourId, 'Thực tập sinh Nghiệp vụ du lịch', 'Đang thực tập', 3.10, '2024-09-18', '2024-12-18'],
            ['217DL01006', 'Đỗ Thùy Linh', 'K27-DL2', 'Quản trị Dịch vụ Du lịch và Lữ hành', actFiditour3, fiditourId, 'Thực tập sinh Hỗ trợ Khách hàng', 'Đang thực tập', 3.50, '2025-02-15', '2025-05-15'],
            ['217DL01007', 'Nguyễn Duy Anh', 'K27-DL2', 'Quản trị Dịch vụ Du lịch và Lữ hành', null, null, null, 'Chờ phân công', 2.90, null, null],
            ['217DL01008', 'Hoàng Thanh Thảo', 'K27-DL2', 'Quản trị Dịch vụ Du lịch và Lữ hành', null, null, null, 'Chờ phân công', 3.30, null, null],
            ['217DL01009', 'Phan Văn Đức', 'K27-DL2', 'Quản trị Dịch vụ Du lịch và Lữ hành', null, null, null, 'Chờ phân công', 3.00, null, null],
            ['217DL01010', 'Lâm Mỹ Huyền', 'K27-DL2', 'Quản trị Dịch vụ Du lịch và Lữ hành', null, null, null, 'Chờ phân công', 3.75, null, null]
        ];

        for (const s of studentsData) {
            await conn.query(
                `INSERT INTO students (student_code, name, class, major, activity_id, enterprise_id, position, status, gpa, start_date, end_date, faculty_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [...s, facultyId]
            );
        }

        console.log("Inserted 10 students");

        await conn.commit();
        console.log("Database transaction committed successfully!");
        return { success: true, message: "Successfully seeded Tourism data (3 companies, 9 events, 3 MOUs, 10 students)" };
    } catch (e) {
        await conn.rollback();
        console.error("Seeding failed, transaction rolled back:", e);
        throw e;
    } finally {
        conn.release();
    }
}

module.exports = seedTourism;
