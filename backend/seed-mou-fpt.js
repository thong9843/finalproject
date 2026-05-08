// Script seed MOU mẫu FPT vào database
// Chạy: node seed-mou-fpt.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
    const pool = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'vlu_enterprise_link',
    });

    try {
        const [existing] = await pool.query("SELECT id FROM mous WHERE mou_code = 'MOU-FPT-2024-001'");
        if (existing.length > 0) {
            console.log('✅ MOU FPT mẫu đã tồn tại trong DB (id:', existing[0].id, ')');
            await pool.end();
            return;
        }

        const [result] = await pool.query(`
            INSERT INTO mous (
                mou_code, enterprise_id, signing_date, partner_contact, org_type, country,
                collaboration_scope, vlu_contact, tasks_ay24_25, next_steps, past_activities, related_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'MOU-FPT-2024-001',
            1, // FPT Software (enterprise_id = 1 từ seed data)
            '2024-03-15',
            'Ông Nguyễn Văn Hùng - HR Director',
            'Tập đoàn Công nghệ',
            'Việt Nam',
            'Hợp tác đào tạo, thực tập sinh viên ngành CNTT; tổ chức hội thảo nghề nghiệp; tuyển dụng sinh viên tốt nghiệp; cung cấp học bổng cho sinh viên xuất sắc; chia sẻ chuyên gia giảng dạy và hướng dẫn luận văn tốt nghiệp.',
            'ThS. Nguyễn Thị Hoa - Trưởng Ban Quan hệ Doanh nghiệp',
            'Tuyển 50 thực tập sinh ReactJS/NodeJS học kỳ II/2024; tổ chức 2 buổi workshop định hướng nghề nghiệp (tháng 10 và tháng 12/2024); ký kết chương trình học bổng "FPT Talent" năm 2024.',
            'Ký kết biên bản triển khai chi tiết Q2/2025; tổ chức Ngày hội Tuyển dụng FPT × VLU tháng 5/2025; mở rộng hợp tác sang ngành Trí tuệ Nhân tạo và Khoa học Dữ liệu.',
            'Ký kết MOU lần đầu năm 2022; tổ chức 3 buổi hội thảo chuyên ngành CNTT (2022-2023); tiếp nhận 30 thực tập sinh mỗi năm học.',
            'Đã tiếp nhận 120 sinh viên thực tập từ 2022-2024; 15 sinh viên nhận học bổng FPT Talent; 85% sinh viên được tuyển dụng chính thức sau thực tập.'
        ]);

        console.log('✅ Đã thêm MOU FPT mẫu thành công! ID:', result.insertId);
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
