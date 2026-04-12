const express = require('express');
const router = express.Router();
const structureController = require('../controllers/structureController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/clusters', structureController.getClusters);
router.get('/departments', structureController.getDepartments);

router.get('/activity-types', structureController.getActivityTypes);
router.post('/activity-types', structureController.createActivityType);
router.put('/activity-types/:id', structureController.updateActivityType);
router.delete('/activity-types/:id', structureController.deleteActivityType);

module.exports = router;
