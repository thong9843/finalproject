const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

// Require authentication for all history routes
router.use(verifyToken);

// View history logs (ADMIN and FACULTY_MANAGER only)
router.get('/', verifyRole(['ADMIN', 'FACULTY_MANAGER']), historyController.getAll);
router.get('/:id', verifyRole(['ADMIN', 'FACULTY_MANAGER']), historyController.getById);

// Restore an action (ADMIN and FACULTY_MANAGER only)
router.post('/:id/restore', verifyRole(['ADMIN', 'FACULTY_MANAGER']), historyController.restore);

// Permanent hard delete (ADMIN only)
router.delete('/:id/permanent', verifyRole(['ADMIN']), historyController.permanentDelete);

module.exports = router;
