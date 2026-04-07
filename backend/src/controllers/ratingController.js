const pool = require('../config/db');

exports.addRating = async (req, res) => {
    try {
        const { enterprise_id, activity_id, user_type, overall_score, guidance_score, facilities_score, opportunities_score, coordination_score, internal_note } = req.body;
        
        const [result] = await pool.query(
            'INSERT INTO enterprise_ratings (enterprise_id, activity_id, user_type, overall_score, guidance_score, facilities_score, opportunities_score, coordination_score, internal_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [enterprise_id, activity_id, user_type || 'LECTURER', overall_score, guidance_score, facilities_score, opportunities_score, coordination_score, internal_note]
        );
        res.status(201).json({ id: result.insertId, message: 'Rating added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEnterpriseRatings = async (req, res) => {
    try {
        const { enterpriseId } = req.params;
        const [ratings] = await pool.query(
            'SELECT r.*, a.name as activity_name FROM enterprise_ratings r LEFT JOIN activities a ON r.activity_id = a.id WHERE r.enterprise_id = ? ORDER BY r.created_at DESC',
            [enterpriseId]
        );
        res.status(200).json(ratings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBestEnterprises = async (req, res) => {
    try {
        const query = `
            SELECT e.id, e.name, e.industry, e.status, 
                   AVG(r.overall_score) as avg_rating,
                   COUNT(r.id) as rating_count
            FROM enterprises e
            JOIN enterprise_ratings r ON e.id = r.enterprise_id
            GROUP BY e.id
            HAVING avg_rating >= 4
            ORDER BY avg_rating DESC, rating_count DESC
            LIMIT 10
        `;
        const [bestEnterprises] = await pool.query(query);
        res.status(200).json(bestEnterprises);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};