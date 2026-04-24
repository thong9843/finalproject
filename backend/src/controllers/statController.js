const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'ADMIN';
        const fid = req.user.faculty_id;

        const fFilter = isAdmin ? '' : ' AND faculty_id = ?';
        const aFFilter = isAdmin ? '' : ' AND a.faculty_id = ?';
        const p = isAdmin ? [] : [fid];

        const currentYear = new Date().getFullYear();

        const [[{ total: totalEnterprises }]] = await pool.query(
            `SELECT COUNT(*) as total FROM enterprises WHERE 1=1${fFilter}`, p);

        const [[{ total: collaboratingEnterprises }]] = await pool.query(
            `SELECT COUNT(*) as total FROM enterprises WHERE status = 'Đang triển khai'${fFilter}`, p);

        const [[{ total: activitiesThisYear }]] = await pool.query(
            `SELECT COUNT(*) as total FROM activities a WHERE YEAR(a.created_at) = ?${aFFilter}`,
            [currentYear, ...p]);

        const [[{ total: totalStudents }]] = await pool.query(
            `SELECT COUNT(s.id) as total FROM students s JOIN activities a ON s.activity_id = a.id WHERE 1=1${aFFilter}`, p);

        // Biểu đồ tròn: Cơ cấu loại hình hoạt động (dùng junction table)
        const [activityTypes] = await pool.query(`
            SELECT act.name as type, COUNT(DISTINCT a.id) as count
            FROM activities a
            LEFT JOIN activity_type_map atm ON atm.activity_id = a.id
            LEFT JOIN act_types act ON act.id = atm.type_id
            WHERE 1=1${aFFilter}
            GROUP BY act.name
            ORDER BY count DESC
        `, p);

        // Biểu đồ cột: Số lượng doanh nghiệp theo Khoa
        const [enterpriseByFaculty] = await pool.query(`
            SELECT f.name as faculty, COUNT(e.id) as count 
            FROM enterprises e 
            JOIN faculties f ON e.faculty_id = f.id 
            WHERE 1=1${fFilter.replace('faculty_id', 'e.faculty_id')}
            GROUP BY f.name
        `, p);

        // Doanh nghiệp theo Quy mô
        const [enterpriseByScale] = await pool.query(`
            SELECT s.name as scale, COUNT(e.id) as count
            FROM enterprises e
            JOIN scales s ON e.scale_id = s.id
            WHERE 1=1${fFilter.replace('faculty_id', 'e.faculty_id')}
            GROUP BY s.name
            ORDER BY count DESC
        `, p);

        // Doanh nghiệp theo Trạng thái
        const [enterpriseByStatus] = await pool.query(`
            SELECT status, COUNT(id) as count
            FROM enterprises e
            WHERE 1=1${fFilter.replace('faculty_id', 'e.faculty_id')}
            GROUP BY status
            ORDER BY count DESC
        `, p);

        // Doanh nghiệp theo Ngành nghề
        const [enterpriseByFields] = await pool.query(`
            SELECT fi.name as field, COUNT(DISTINCT e.id) as count
            FROM enterprises e
            JOIN enterprise_fields ef ON e.id = ef.enterprise_id
            JOIN fields fi ON ef.field_id = fi.id
            WHERE 1=1${fFilter.replace('faculty_id', 'e.faculty_id')}
            GROUP BY fi.name
            ORDER BY count DESC
        `, p);

        // 5 Hoạt động sắp diễn ra (Upcoming activities)
        const [upcomingActivities] = await pool.query(`
            SELECT a.id, a.title, a.start_date, e.name as enterprise_name, a.status
            FROM activities a
            JOIN enterprises e ON a.enterprise_id = e.id
            WHERE a.start_date >= CURDATE()${aFFilter}
            ORDER BY a.start_date ASC
            LIMIT 5
        `, p);

        res.status(200).json({
            totals: { totalEnterprises, collaboratingEnterprises, activitiesThisYear, totalStudents },
            charts: { 
                activityTypes, 
                enterpriseByFaculty,
                enterpriseByScale,
                enterpriseByStatus,
                enterpriseByFields
            },
            upcomingActivities
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
