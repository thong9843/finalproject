const pool = require('../config/db');

// Get all notes for the logged-in user
exports.getAll = async (req, res) => {
    try {
        const [notes] = await pool.query(
            `SELECT n.*, 
                    e.name AS enterprise_name, 
                    a.title AS activity_title, 
                    m.mou_code AS mou_code, 
                    me.name AS mou_enterprise_name,
                    s.name AS student_name
             FROM notes n
             LEFT JOIN enterprises e ON n.enterprise_id = e.id
             LEFT JOIN activities a ON n.activity_id = a.id
             LEFT JOIN mous m ON n.mou_id = m.id
             LEFT JOIN enterprises me ON m.enterprise_id = me.id
             LEFT JOIN students s ON n.student_id = s.id
             WHERE n.created_by = ? AND n.is_deleted = 0 
             ORDER BY n.id DESC`,
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

// Get a single note by entity reference
exports.getByReference = async (req, res) => {
    try {
        const { enterprise_id, activity_id, mou_id, student_id } = req.query;

        let query = 'SELECT * FROM notes WHERE created_by = ? AND is_deleted = 0';
        let params = [req.user.id];

        if (enterprise_id) {
            query += ' AND enterprise_id = ?';
            params.push(enterprise_id);
        } else if (activity_id) {
            query += ' AND activity_id = ?';
            params.push(activity_id);
        } else if (mou_id) {
            query += ' AND mou_id = ?';
            params.push(mou_id);
        } else if (student_id) {
            query += ' AND student_id = ?';
            params.push(student_id);
        } else {
            return res.status(400).json({ message: 'Thiếu tham số tham chiếu (enterprise_id, activity_id, mou_id, hoặc student_id)' });
        }

        const [notes] = await pool.query(query, params);
        if (notes.length === 0) {
            return res.status(200).json(null);
        }
        res.status(200).json(notes[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create or update a note associated with an entity reference (upsert)
exports.saveReference = async (req, res) => {
    try {
        const { title, content, color, enterprise_id, activity_id, mou_id, student_id } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Nội dung ghi chú không được để trống' });
        }

        // Identify which entity reference we are working with
        let refColumn = '';
        let refValue = null;

        if (enterprise_id) {
            refColumn = 'enterprise_id';
            refValue = enterprise_id;
        } else if (activity_id) {
            refColumn = 'activity_id';
            refValue = activity_id;
        } else if (mou_id) {
            refColumn = 'mou_id';
            refValue = mou_id;
        } else if (student_id) {
            refColumn = 'student_id';
            refValue = student_id;
        }

        if (!refColumn) {
            return res.status(400).json({ message: 'Thiếu thông tin tham chiếu thực thể' });
        }

        // Check if an existing active note exists for this reference and user
        const [existing] = await pool.query(
            `SELECT id FROM notes WHERE \`${refColumn}\` = ? AND created_by = ? AND is_deleted = 0`,
            [refValue, req.user.id]
        );

        if (existing.length > 0) {
            // Update existing note
            const noteId = existing[0].id;
            await pool.query(
                `UPDATE notes 
                 SET title = ?, content = ?, color = ? 
                 WHERE id = ?`,
                [title || null, content, color || '#fef08a', noteId]
            );
            return res.status(200).json({ id: noteId, message: 'Cập nhật ghi chú thành công' });
        } else {
            // Insert new note
            const [result] = await pool.query(
                `INSERT INTO notes (title, content, color, created_by, \`${refColumn}\`) 
                 VALUES (?, ?, ?, ?, ?)`,
                [title || null, content, color || '#fef08a', req.user.id, refValue]
            );
            return res.status(201).json({ id: result.insertId, message: 'Tạo ghi chú thành công' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
