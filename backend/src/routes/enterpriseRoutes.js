const express = require('express');
const router = express.Router();
const enterpriseController = require('../controllers/enterpriseController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', enterpriseController.getAll);
router.get('/:id', enterpriseController.getById);
router.post('/', enterpriseController.create);
router.put('/:id', enterpriseController.update);
router.delete('/:id', verifyRole(['ADMIN', 'FACULTY_MANAGER']), enterpriseController.remove);

router.get('/duplicates/list', verifyRole(['ADMIN']), enterpriseController.getDuplicates);
router.delete('/:id/activities-only', verifyRole(['ADMIN', 'FACULTY_MANAGER']), enterpriseController.removeActivitiesOnly);

module.exports = router;
