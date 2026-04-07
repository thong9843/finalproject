const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    try {
        let facultyFilter = '';
        let params = [];
        if (req.user.role !== 'ADMIN') {
            facultyFilter = ' AND faculty_id = ?';
            params.push(req.user.faculty_id);
            params.push(req.user.faculty_id);
            params.push(req.user.faculty_id);
            params.push(req.user.faculty_id);
        }

        // 1. Tổng doanh nghiệp
        const [totalEnterprisesRows] = await pool.query(`SELECT COUNT(*) as count FROM enterprises WHERE 1=1 ${facultyFilter}`, params.length > 0 ? [params[0]] : []);
        // 2. Doanh nghiệp đang hợp tác
        const [collabEnterprisesRows] = await pool.query(`SELECT COUNT(*) as count FROM enterprises WHERE status = 'Đang triển khai' ${facultyFilter}`, params.length > 0 ? [params[1]] : []);
        // 3. Tổng hoạt động năm nay
        const currentYear = new Date().getFullYear();
        const [activitiesRows] = await pool.query(`SELECT COUNT(*) as count FROM activities WHERE YEAR(created_at) = ? ${facultyFilter}`, params.length > 0 ? [currentYear, params[2]] : [currentYear]);
        // 4. Tổng sinh viên tham gia
        const [studentsRows] = await pool.query(`
            SELECT COUNT(s.id) as count 
            FROM students s 
            JOIN activities a ON s.activity_id = a.id 
            WHERE 1=1 ${facultyFilter.replace('faculty_id', 'a.faculty_id')}`, params.length > 0 ? [params[3]] : []);

        // Biểu đồ tròn: Cơ cấu loại hình hoạt động
        const [activityTypes] = await pool.query(`
            SELECT type, COUNT(*) as count 
            FROM activities 
            WHERE 1=1 ${facultyFilter} 
            GROUP BY type`, params.length > 0 ? [params[0]] : []);

        // Biểu đồ cột: Số lượng doanh nghiệp mới theo từng Khoa
        // Dựa vào created_at
        let enterpriseByFacultyParams = [];
        let enterpiseByFacultyQuery = `
            SELECT f.name as faculty, COUNT(e.id) as count 
            FROM enterprises e 
            JOIN faculties f ON e.faculty_id = f.id 
            WHERE 1=1
        `;
        if (req.user.role !== 'ADMIN') {
            enterpiseByFacultyQuery += ' AND e.faculty_id = ?';
            enterpriseByFacultyParams.push(req.user.faculty_id);
        }
        enterpiseByFacultyQuery += ' GROUP BY f.name';

        const [enterpriseByFaculty] = await pool.query(enterpiseByFacultyQuery, enterpriseByFacultyParams);

        res.status(200).json({
            totals: {
                totalEnterprises: totalEnterprisesRows[0].count,
                collaboratingEnterprises: collabEnterprisesRows[0].count,
                activitiesThisYear: activitiesRows[0].count,
                totalStudents: studentsRows[0].count
            },
            charts: {
                activityTypes,
                enterpriseByFaculty
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
