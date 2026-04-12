const express = require('express');
const router = express.Router();
const mouController = require('../controllers/mouController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', mouController.getAll);
router.get('/:id', mouController.getById);
router.post('/', mouController.create);
router.put('/:id', mouController.update);
router.delete('/:id', mouController.remove);

module.exports = router;
