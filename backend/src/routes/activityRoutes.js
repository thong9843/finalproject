const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/upcoming', activityController.getUpcoming);
router.get('/stats', activityController.getStats);
router.get('/', activityController.getAll);
router.post('/', verifyRole(['ADMIN', 'FACULTY_MANAGER']), activityController.create);
router.put('/:id', verifyRole(['ADMIN', 'FACULTY_MANAGER']), activityController.update);
router.put('/:id/status', verifyRole(['ADMIN', 'FACULTY_MANAGER']), activityController.updateStatus);
router.delete('/:id', verifyRole(['ADMIN', 'FACULTY_MANAGER']), activityController.remove);

module.exports = router;
