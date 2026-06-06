const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken } = require('../middlewares/auth');

// Apply verifyToken middleware to all task routes
router.use(verifyToken);

router.get('/', taskController.getAll);
router.post('/', taskController.create);
router.put('/:id', taskController.update);
router.put('/:id/status', taskController.updateStatus);
router.delete('/:id', taskController.remove);

module.exports = router;
