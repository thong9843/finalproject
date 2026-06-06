const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const uploadsDir = path.join(__dirname, '../../uploads/mou-scans');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'kanban-upload-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 30 * 1024 * 1024 } // 30MB limit
});

// Apply verifyToken middleware to all task routes
router.use(verifyToken);

router.get('/', taskController.getAll);
router.post('/', taskController.create);
router.post('/upload', upload.single('file'), taskController.uploadFile);
router.put('/:id', taskController.update);
router.put('/:id/status', taskController.updateStatus);
router.delete('/:id', taskController.remove);

module.exports = router;
