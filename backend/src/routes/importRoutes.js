const express = require('express');
const router = express.Router();
const { upload, importEnterprises, importActivities, importStudents, aiParseRow } = require('../controllers/importController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

router.use(verifyToken);

router.post('/enterprises', upload.single('file'), verifyRole(['ADMIN', 'FACULTY_MANAGER']), importEnterprises);
router.post('/activities', upload.single('file'), verifyRole(['ADMIN', 'FACULTY_MANAGER']), importActivities);
router.post('/students', upload.single('file'), verifyRole(['ADMIN', 'FACULTY_MANAGER', 'LECTURER']), importStudents);
router.post('/ai-parse-row', verifyRole(['ADMIN', 'FACULTY_MANAGER']), aiParseRow);

module.exports = router;
