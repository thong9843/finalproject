const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/stats', studentController.getStats);
router.get('/', studentController.getAll);
router.post('/', studentController.create);
router.put('/:id', studentController.update);
router.delete('/:id', studentController.remove);

module.exports = router;
