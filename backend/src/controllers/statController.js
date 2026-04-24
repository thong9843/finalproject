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
            `SELECT COUNT(*) as total FROM activities WHERE YEAR(created_at) = ?${aFFilter}`,
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

        res.status(200).json({
            totals: { totalEnterprises, collaboratingEnterprises, activitiesThisYear, totalStudents },
            charts: { activityTypes, enterpriseByFaculty }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
