const pool = require('../config/db');

// Thống kê sinh viên thực tập theo công ty
exports.getStudentsByEnterprise = async (req, res) => {
    try {
        let facultyFilter = '';
        let params = [];
        if (req.user.role !== 'ADMIN') {
            facultyFilter = ' AND s.faculty_id = ?';
            params.push(req.user.faculty_id);
        } else if (req.query.faculty_id) {
            facultyFilter = ' AND s.faculty_id = ?';
            params.push(req.query.faculty_id);
        }

        // Date range filter
        const { date_from, date_to } = req.query;
        let dateFilter = '';
        let dateParams = [];
        if (date_from) {
            dateFilter += ' AND s.start_date >= ?';
            dateParams.push(date_from);
        }
        if (date_to) {
            dateFilter += ' AND s.start_date <= ?';
            dateParams.push(date_to);
        }

        const allParams = [...params, ...dateParams];

        const [byEnterprise] = await pool.query(`
            SELECT e.name as enterprise, 
                   COUNT(s.id) as total,
                   SUM(CASE WHEN s.status = 'Đang thực tập' THEN 1 ELSE 0 END) as active,
                   SUM(CASE WHEN s.status = 'Hoàn thành' THEN 1 ELSE 0 END) as completed,
                   SUM(CASE WHEN s.status = 'Chờ phân công' THEN 1 ELSE 0 END) as pending
            FROM students s
            JOIN enterprises e ON s.enterprise_id = e.id
            WHERE s.enterprise_id IS NOT NULL ${facultyFilter} ${dateFilter}
            GROUP BY e.id, e.name
            ORDER BY total DESC
        `, allParams);

        const [byMajor] = await pool.query(`
            SELECT s.major, COUNT(*) as count
            FROM students s
            WHERE s.major IS NOT NULL ${facultyFilter} ${dateFilter}
            GROUP BY s.major
            ORDER BY count DESC
            LIMIT 8
        `, allParams);

        const [overview] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Đang thực tập' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'Hoàn thành' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'Chờ phân công' THEN 1 ELSE 0 END) as pending,
                ROUND(AVG(gpa), 2) as avgGpa
            FROM students s
            WHERE 1=1 ${facultyFilter} ${dateFilter}
        `, allParams);

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
        } else if (req.query.faculty_id) {
            facultyFilter = ' AND a.faculty_id = ?';
            params.push(req.query.faculty_id);
        }

        // Date range filter
        const { date_from, date_to } = req.query;
        let dateFilter = '';
        let dateParams = [];
        if (date_from) {
            dateFilter += ' AND a.start_date >= ?';
            dateParams.push(date_from);
        }
        if (date_to) {
            dateFilter += ' AND a.start_date <= ?';
            dateParams.push(date_to);
        }

        const allParams = [...params, ...dateParams];

        // Hoạt động theo loại hình (dùng bảng junction mới)
        const [byType] = await pool.query(`
            SELECT act.name as type, COUNT(DISTINCT a.id) as count
            FROM activities a
            LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
            LEFT JOIN act_types act ON act.id = atm.type_id
            WHERE 1=1 ${facultyFilter} ${dateFilter}
            GROUP BY act.name
            ORDER BY count DESC
        `, allParams);

        // Hoạt động theo từng công ty
        const [byEnterprise] = await pool.query(`
            SELECT e.name as enterprise, 
                   COUNT(a.id) as total,
                   SUM(CASE WHEN a.status IN ('Đã triển khai', 'Phê duyệt nội bộ') THEN 1 ELSE 0 END) as active,
                   SUM(CASE WHEN a.status = 'Đã kết thúc' THEN 1 ELSE 0 END) as completed
            FROM activities a
            JOIN enterprises e ON a.enterprise_id = e.id
            WHERE 1=1 ${facultyFilter} ${dateFilter}
            GROUP BY e.id, e.name
            ORDER BY total DESC
        `, allParams);

        // Hoạt động theo trạng thái
        const [byStatus] = await pool.query(`
            SELECT a.status, COUNT(*) as count
            FROM activities a
            WHERE 1=1 ${facultyFilter} ${dateFilter}
            GROUP BY a.status
        `, allParams);

        // Hoạt động theo tháng
        let byMonthParams;
        let byMonthQuery;
        if (date_from || date_to) {
            byMonthQuery = `
                SELECT MONTH(a.start_date) as month, YEAR(a.start_date) as year, COUNT(*) as count
                FROM activities a
                WHERE 1=1 ${facultyFilter} ${dateFilter}
                GROUP BY YEAR(a.start_date), MONTH(a.start_date)
                ORDER BY year, month
            `;
            byMonthParams = allParams;
        } else {
            const currentYear = new Date().getFullYear();
            byMonthQuery = `
                SELECT MONTH(a.start_date) as month, COUNT(*) as count
                FROM activities a
                WHERE YEAR(a.start_date) = ? ${facultyFilter}
                GROUP BY MONTH(a.start_date)
                ORDER BY month
            `;
            byMonthParams = [currentYear, ...params];
        }
        const [byMonth] = await pool.query(byMonthQuery, byMonthParams);

        // Tổng quan
        const overviewFacultyFilter = facultyFilter.replace('a.faculty_id', 'faculty_id');
        const overviewDateFilter = dateFilter.replace(/a\.start_date/g, 'start_date');
        const [overview] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('Đã triển khai', 'Phê duyệt nội bộ') THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'Đã kết thúc' THEN 1 ELSE 0 END) as completed,
                (SELECT COUNT(DISTINCT enterprise_id) FROM activities WHERE 1=1 ${overviewFacultyFilter} ${overviewDateFilter}) as enterprises
            FROM activities a
            WHERE 1=1 ${facultyFilter} ${dateFilter}
        `, [...allParams, ...allParams]);

        res.status(200).json({ byType, byEnterprise, byStatus, byMonth, overview: overview[0] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
