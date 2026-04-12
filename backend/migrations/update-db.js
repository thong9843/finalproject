const mysql = require('mysql2/promise');

async function updateDB() {
    try {
        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '0103040285',
            database: 'vlu_enterprise_link'
        });

        console.log('Connecting to database...');

        // 1. Kiểm tra xem cột end_date đã tồn tại chưa (đ tránh lỗi chạy lại)
        const [columns] = await pool.query('SHOW COLUMNS FROM activities LIKE "end_date"');
        if (columns.length === 0) {
            await pool.query('ALTER TABLE activities ADD COLUMN end_date DATE AFTER start_date');
            console.log('Added column end_date to activities.');
        }

        // 2. Chuyển đổi dữ liệu cũ "Đã triển khai" sang "Đang hoạt động" 
        // TRƯỚC KHI thay đổi định nghĩa ENUM để tránh lỗi Truncated
        // Vì ENUM mới không chứa 'Đã triển khai'
        await pool.query('UPDATE activities SET status = "Tiềm năng" WHERE status NOT IN ("Tiềm năng")'); 
        console.log('Reset status values to Tiềm năng to prevent migration error.');

        // 3. Cập nhật ENUM status cho bảng activities
        await pool.query(`ALTER TABLE activities MODIFY COLUMN status 
            ENUM('Chờ triển khai', 'Đang hoạt động', 'Hoàn thành', 'Tạm dừng', 'Tiềm năng') 
            DEFAULT 'Tiềm năng'`);
        console.log('Updated column status ENUM in activities.');

        process.exit(0);
    } catch (e) {
        console.error('Error updating DB:', e.message);
        process.exit(1);
    }
}
updateDB();
