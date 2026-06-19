const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

// Apply auth middleware to all routes in this file
router.use(verifyToken);
// Only allow ADMIN to manage Firebase files and cleanup garbage
router.use(verifyRole(['ADMIN']));

router.get('/', fileController.listFiles);
router.post('/delete', fileController.deleteFile);
router.post('/cleanup', fileController.cleanupGarbage);

module.exports = router;
