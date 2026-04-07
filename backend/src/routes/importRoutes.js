const express = require('express');
const router = express.Router();
const { upload, importEnterprises, importActivities, importStudents } = require('../controllers/importController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.post('/enterprises', upload.single('file'), importEnterprises);
router.post('/activities', upload.single('file'), importActivities);
router.post('/students', upload.single('file'), importStudents);

module.exports = router;
