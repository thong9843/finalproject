const pool = require('../config/db');

// Get all tasks (filtered by user faculty/role)
exports.getAll = async (req, res) => {
    try {
        let query = `
            SELECT t.*, u.full_name AS assignee_name, u.email AS assignee_email,
                   uc.full_name AS creator_name, f.name AS faculty_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN users uc ON t.created_by = uc.id
            LEFT JOIN faculties f ON t.faculty_id = f.id
            WHERE t.is_deleted = 0
        `;
        const params = [];

        // Faculty filtering based on role
        if (req.user.role !== 'ADMIN') {
            query += ' AND (t.faculty_id = ? OR t.created_by = ? OR t.assigned_to = ?)';
            params.push(req.user.faculty_id, req.user.id, req.user.id);
        }

        // Search filter
        const { search, priority, assigned_to } = req.query;
        if (search) {
            query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern);
        }

        // Priority filter
        if (priority) {
            query += ' AND t.priority = ?';
            params.push(priority);
        }

        // Assigned to filter
        if (assigned_to) {
            query += ' AND t.assigned_to = ?';
            params.push(assigned_to);
        }

        query += ' ORDER BY t.due_date ASC, t.id DESC';

        const [tasks] = await pool.query(query, params);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new task
exports.create = async (req, res) => {
    try {
        const { title, description, status, priority, due_date, assigned_to } = req.body;
        
        if (!title) {
            return res.status(400).json({ message: 'Tiêu đề nhiệm vụ không được để trống' });
        }

        const created_by = req.user.id;
        const faculty_id = req.user.role === 'ADMIN' ? (req.body.faculty_id || null) : req.user.faculty_id;

        const [result] = await pool.query(
            `INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, created_by, faculty_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description || null, status || 'Cần làm', priority || 'Trung bình', due_date || null, assigned_to || null, created_by, faculty_id]
        );

        res.status(201).json({ id: result.insertId, message: 'Tạo nhiệm vụ thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a task
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, due_date, assigned_to } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Tiêu đề nhiệm vụ không được để trống' });
        }

        // Check ownership/authorization
        let checkQuery = 'SELECT * FROM tasks WHERE id = ? AND is_deleted = 0';
        const checkParams = [id];
        if (req.user.role !== 'ADMIN') {
            checkQuery += ' AND (faculty_id = ? OR created_by = ? OR assigned_to = ?)';
            checkParams.push(req.user.faculty_id, req.user.id, req.user.id);
        }

        const [existing] = await pool.query(checkQuery, checkParams);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ hoặc bạn không có quyền chỉnh sửa' });
        }

        const faculty_id = req.user.role === 'ADMIN' ? (req.body.faculty_id || existing[0].faculty_id) : existing[0].faculty_id;

        await pool.query(
            `UPDATE tasks 
             SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, assigned_to = ?, faculty_id = ?
             WHERE id = ?`,
            [title, description || null, status || 'Cần làm', priority || 'Trung bình', due_date || null, assigned_to || null, faculty_id, id]
        );

        res.status(200).json({ message: 'Cập nhật nhiệm vụ thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update task status only (for Kanban drag-and-drop)
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['Cần làm', 'Đang thực hiện', 'Đang kiểm tra', 'Đã hoàn thành'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }

        // Check authorization
        let checkQuery = 'SELECT * FROM tasks WHERE id = ? AND is_deleted = 0';
        const checkParams = [id];
        if (req.user.role !== 'ADMIN') {
            checkQuery += ' AND (faculty_id = ? OR created_by = ? OR assigned_to = ?)';
            checkParams.push(req.user.faculty_id, req.user.id, req.user.id);
        }

        const [existing] = await pool.query(checkQuery, checkParams);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ hoặc không đủ quyền' });
        }

        await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
        res.status(200).json({ message: 'Cập nhật trạng thái nhiệm vụ thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Soft delete task
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;

        // Check authorization
        let checkQuery = 'SELECT * FROM tasks WHERE id = ? AND is_deleted = 0';
        const checkParams = [id];
        if (req.user.role !== 'ADMIN') {
            checkQuery += ' AND (faculty_id = ? OR created_by = ?)';
            checkParams.push(req.user.faculty_id, req.user.id);
        }

        const [existing] = await pool.query(checkQuery, checkParams);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ hoặc bạn không có quyền xóa' });
        }

        await pool.query('UPDATE tasks SET is_deleted = 1 WHERE id = ?', [id]);
        res.status(200).json({ message: 'Xóa nhiệm vụ thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
