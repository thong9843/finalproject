const pool = require('../config/db');

exports.addRating = async (req, res) => {
    try {
        const { enterprise_id, activity_id, user_type, guidance_score, facilities_score, opportunities_score, coordination_score, internal_note } = req.body;
        
        if (req.user.role !== 'ADMIN') {
            const [ents] = await pool.query('SELECT faculty_id FROM enterprises WHERE id = ?', [enterprise_id]);
            if (ents.length === 0) {
                return res.status(404).json({ message: 'Enterprise not found' });
            }
            if (ents[0].faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ message: 'Access denied to this enterprise' });
            }
        }

        // Calculate overall_score as average of coordination, facilities, and guidance
        const coordination = Number(coordination_score) || 0;
        const facilities = Number(facilities_score) || 0;
        const guidance = Number(guidance_score) || 0;
        const overall_score = Number(((coordination + facilities + guidance) / 3).toFixed(2));

        const [result] = await pool.query(
            'INSERT INTO enterprise_ratings (enterprise_id, activity_id, user_type, overall_score, guidance_score, facilities_score, opportunities_score, coordination_score, internal_note, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [enterprise_id, activity_id || null, user_type || 'LECTURER', overall_score, guidance_score, facilities_score, opportunities_score || null, coordination_score, internal_note || null, req.user.id]
        );
        res.status(201).json({ id: result.insertId, message: 'Rating added successfully', overall_score });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEnterpriseRatings = async (req, res) => {
    try {
        const { enterpriseId } = req.params;

        if (req.user.role !== 'ADMIN') {
            const [ents] = await pool.query('SELECT faculty_id FROM enterprises WHERE id = ?', [enterpriseId]);
            if (ents.length === 0) {
                return res.status(404).json({ message: 'Enterprise not found' });
            }
            if (ents[0].faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ message: 'Access denied to this enterprise ratings' });
            }
        }

        const [ratings] = await pool.query(
            'SELECT r.*, a.title as activity_name, u.full_name as user_name, u.role as user_role FROM enterprise_ratings r LEFT JOIN activities a ON r.activity_id = a.id LEFT JOIN users u ON r.created_by = u.id WHERE r.enterprise_id = ? ORDER BY r.created_at DESC',
            [enterpriseId]
        );
        res.status(200).json(ratings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateRating = async (req, res) => {
    try {
        const { id } = req.params;
        const { coordination_score, facilities_score, guidance_score, internal_note } = req.body;

        const [ratings] = await pool.query('SELECT * FROM enterprise_ratings WHERE id = ?', [id]);
        if (ratings.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phiếu đánh giá' });
        }
        const rating = ratings[0];

        // Check permission: Admin or Creator
        if (req.user.role !== 'ADMIN' && rating.created_by !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa phiếu đánh giá này' });
        }

        const coordination = Number(coordination_score) || Number(rating.coordination_score) || 0;
        const facilities = Number(facilities_score) || Number(rating.facilities_score) || 0;
        const guidance = Number(guidance_score) || Number(rating.guidance_score) || 0;
        const overall_score = Number(((coordination + facilities + guidance) / 3).toFixed(2));

        await pool.query(
            'UPDATE enterprise_ratings SET overall_score = ?, guidance_score = ?, facilities_score = ?, coordination_score = ?, internal_note = ? WHERE id = ?',
            [overall_score, guidance, facilities, coordination, internal_note || null, id]
        );

        res.status(200).json({ message: 'Cập nhật đánh giá thành công', overall_score });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteRating = async (req, res) => {
    try {
        const { id } = req.params;

        const [ratings] = await pool.query('SELECT * FROM enterprise_ratings WHERE id = ?', [id]);
        if (ratings.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phiếu đánh giá' });
        }
        const rating = ratings[0];

        // Check permission: Admin or Creator
        if (req.user.role !== 'ADMIN' && rating.created_by !== req.user.id) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa phiếu đánh giá này' });
        }

        await pool.query('DELETE FROM enterprise_ratings WHERE id = ?', [id]);
        res.status(200).json({ message: 'Xóa đánh giá thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBestEnterprises = async (req, res) => {
    try {
        let query = `
            SELECT e.id, e.name, e.status, 
                   AVG(r.overall_score) as avg_rating,
                   COUNT(r.id) as rating_count
            FROM enterprises e
            JOIN enterprise_ratings r ON e.id = r.enterprise_id
        `;
        let params = [];
        if (req.user.role !== 'ADMIN') {
            query += ' WHERE e.faculty_id = ?';
            params.push(req.user.faculty_id);
        }
        query += `
            GROUP BY e.id
            HAVING avg_rating >= 4
            ORDER BY avg_rating DESC, rating_count DESC
            LIMIT 10
        `;
        const [bestEnterprises] = await pool.query(query, params);
        res.status(200).json(bestEnterprises);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};