const pool = require('../config/db');

// Thống kê sinh viên thực tập theo công ty
exports.getStudentsByEnterprise = async (req, res) => {
    try {
        let facultyFilter = '';
        let params = [];
        if (req.user.role !== 'ADMIN') {
            facultyFilter = ' AND s.faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        const [byEnterprise] = await pool.query(`
            SELECT e.name as enterprise, 
                   COUNT(s.id) as total,
                   SUM(CASE WHEN s.status = 'Đang thực tập' THEN 1 ELSE 0 END) as active,
                   SUM(CASE WHEN s.status = 'Hoàn thành' THEN 1 ELSE 0 END) as completed,
                   SUM(CASE WHEN s.status = 'Chờ phân công' THEN 1 ELSE 0 END) as pending
            FROM students s
            JOIN enterprises e ON s.enterprise_id = e.id
            WHERE s.enterprise_id IS NOT NULL ${facultyFilter}
            GROUP BY e.id, e.name
            ORDER BY total DESC
        `, params);

        const [byMajor] = await pool.query(`
            SELECT s.major, COUNT(*) as count
            FROM students s
            WHERE s.major IS NOT NULL ${facultyFilter}
            GROUP BY s.major
            ORDER BY count DESC
            LIMIT 8
        `, params);

        const [overview] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Đang thực tập' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'Hoàn thành' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'Chờ phân công' THEN 1 ELSE 0 END) as pending,
                ROUND(AVG(gpa), 2) as avgGpa
            FROM students s
            WHERE 1=1 ${facultyFilter}
        `, params);

        res.status(200).json({ byEnterprise, byMajor, overview: overview[0] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Thống kê hoạt động hợp tác theo công ty
exports.getActivitiesByEnterprise = async (req, res) => {
    try {
        let facultyFilter = '';
        let params = [];
        if (req.user.role !== 'ADMIN') {
            facultyFilter = ' AND a.faculty_id = ?';
            params.push(req.user.faculty_id);
        }

        // Hoạt động theo loại hình (dùng bảng junction mới)
        const [byType] = await pool.query(`
            SELECT act.name as type, COUNT(DISTINCT a.id) as count
            FROM activities a
            LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
            LEFT JOIN act_types act ON act.id = atm.type_id
            WHERE 1=1 ${facultyFilter}
            GROUP BY act.name
            ORDER BY count DESC
        `, params);

        // Hoạt động theo từng công ty
        const [byEnterprise] = await pool.query(`
            SELECT e.name as enterprise, 
                   COUNT(a.id) as total,
                   SUM(CASE WHEN a.status IN ('Đã triển khai', 'Phê duyệt nội bộ') THEN 1 ELSE 0 END) as active,
                   SUM(CASE WHEN a.status = 'Đã kết thúc' THEN 1 ELSE 0 END) as completed
            FROM activities a
            JOIN enterprises e ON a.enterprise_id = e.id
            WHERE 1=1 ${facultyFilter}
            GROUP BY e.id, e.name
            ORDER BY total DESC
        `, params);

        // Hoạt động theo trạng thái
        const [byStatus] = await pool.query(`
            SELECT a.status, COUNT(*) as count
            FROM activities a
            WHERE 1=1 ${facultyFilter}
            GROUP BY a.status
        `, params);

        // Hoạt động theo tháng (năm hiện tại)
        const currentYear = new Date().getFullYear();
        const [byMonth] = await pool.query(`
            SELECT MONTH(a.start_date) as month, COUNT(*) as count
            FROM activities a
            WHERE YEAR(a.start_date) = ? ${facultyFilter}
            GROUP BY MONTH(a.start_date)
            ORDER BY month
        `, [currentYear, ...params]);

        // Tổng quan
        const [overview] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('Đã triển khai', 'Phê duyệt nội bộ') THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'Đã kết thúc' THEN 1 ELSE 0 END) as completed,
                (SELECT COUNT(DISTINCT enterprise_id) FROM activities WHERE 1=1 ${facultyFilter.replace('a.faculty_id', 'faculty_id')}) as enterprises
            FROM activities a
            WHERE 1=1 ${facultyFilter}
        `, [...params, ...params]);

        res.status(200).json({ byType, byEnterprise, byStatus, byMonth, overview: overview[0] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
