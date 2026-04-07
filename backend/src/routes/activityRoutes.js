const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/upcoming', activityController.getUpcoming);
router.get('/stats', activityController.getStats);
router.get('/', activityController.getAll);
router.post('/', activityController.create);
router.put('/:id', activityController.update);
router.put('/:id/status', activityController.updateStatus);

module.exports = router;
