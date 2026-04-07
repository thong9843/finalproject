const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/students-by-enterprise', reportController.getStudentsByEnterprise);
router.get('/activities-by-enterprise', reportController.getActivitiesByEnterprise);

module.exports = router;
