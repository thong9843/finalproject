const express = require('express');
const router = express.Router();
const structureController = require('../controllers/structureController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/clusters', structureController.getClusters);
router.get('/departments', structureController.getDepartments);
router.get('/activity-types', structureController.getActivityTypes);
router.get('/scales', structureController.getScales);
router.get('/fields', structureController.getFields);
router.get('/act-types', structureController.getActTypes);
router.get('/targets', structureController.getTargets);

module.exports = router;
