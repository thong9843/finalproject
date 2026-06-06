const pool = require('../config/db');

// Get all notes for the logged-in user
exports.getAll = async (req, res) => {
    try {
        const [notes] = await pool.query(
            `SELECT * FROM notes 
             WHERE created_by = ? AND is_deleted = 0 
             ORDER BY id DESC`,
            [req.user.id]
        );
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new note
exports.create = async (req, res) => {
    try {
        const { title, content, color } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Nội dung ghi chú không được để trống' });
        }

        const [result] = await pool.query(
            `INSERT INTO notes (title, content, color, created_by) 
             VALUES (?, ?, ?, ?)`,
            [title || null, content, color || '#fef08a', req.user.id]
        );

        res.status(201).json({ id: result.insertId, message: 'Tạo ghi chú thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update an existing note
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, color } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Nội dung ghi chú không được để trống' });
        }

        // Verify owner
        const [existing] = await pool.query(
            'SELECT id FROM notes WHERE id = ? AND created_by = ? AND is_deleted = 0',
            [id, req.user.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ghi chú hoặc bạn không có quyền chỉnh sửa' });
        }

        await pool.query(
            `UPDATE notes 
             SET title = ?, content = ?, color = ? 
             WHERE id = ?`,
            [title || null, content, color || '#fef08a', id]
        );

        res.status(200).json({ message: 'Cập nhật ghi chú thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Soft delete a note
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify owner
        const [existing] = await pool.query(
            'SELECT id FROM notes WHERE id = ? AND created_by = ? AND is_deleted = 0',
            [id, req.user.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ghi chú hoặc bạn không có quyền xóa' });
        }

        await pool.query('UPDATE notes SET is_deleted = 1 WHERE id = ?', [id]);
        res.status(200).json({ message: 'Xóa ghi chú thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
