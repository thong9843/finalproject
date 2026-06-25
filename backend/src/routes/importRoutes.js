const express = require('express');
const router = express.Router();
const { upload, importEnterprises, importActivities, importStudents, importMous, aiParseRow, validateEnterprises, validateActivities, validateMous, validateStudents } = require('../controllers/importController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

router.use(verifyToken);

router.post('/enterprises', upload.single('file'), verifyRole(['ADMIN', 'FACULTY_MANAGER']), importEnterprises);
router.post('/activities', upload.single('file'), verifyRole(['ADMIN', 'FACULTY_MANAGER']), importActivities);
router.post('/students', upload.single('file'), verifyRole(['ADMIN', 'FACULTY_MANAGER', 'LECTURER']), importStudents);
router.post('/mous', upload.single('file'), verifyRole(['ADMIN', 'FACULTY_MANAGER']), importMous);
router.post('/ai-parse-row', verifyRole(['ADMIN', 'FACULTY_MANAGER']), aiParseRow);

router.post('/enterprises/validate', verifyRole(['ADMIN', 'FACULTY_MANAGER']), validateEnterprises);
router.post('/activities/validate', verifyRole(['ADMIN', 'FACULTY_MANAGER']), validateActivities);
router.post('/students/validate', verifyRole(['ADMIN', 'FACULTY_MANAGER', 'LECTURER']), validateStudents);
router.post('/mous/validate', verifyRole(['ADMIN', 'FACULTY_MANAGER']), validateMous);

module.exports = router;
