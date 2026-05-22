const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mouController = require('../controllers/mouController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

router.use(verifyToken);

// Configure multer for document uploads
const uploadsDir = path.join(__dirname, '../../uploads/mou-scans');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'mou-scan-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WEBP) hoặc PDF'));
        }
    }
});

/**
 * @swagger
 * tags:
 *   name: MOU
 *   description: Quản lý Biên bản ghi nhớ (Memorandum of Understanding)
 */

/**
 * @swagger
 * /mous:
 *   get:
 *     summary: Lấy danh sách toàn bộ MOU
 *     tags: [MOU]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách MOU thành công
 *   post:
 *     summary: Tạo mới một Biên bản ghi nhớ (MOU)
 *     tags: [MOU]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mou_code:
 *                 type: string
 *               enterprise_id:
 *                 type: integer
 *               signing_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Trả về ID của MOU vừa tạo
 */
router.get('/', verifyRole(['ADMIN', 'FACULTY_MANAGER', 'LECTURER']), mouController.getAll);
router.post('/', verifyRole(['ADMIN', 'FACULTY_MANAGER']), mouController.create);

/**
 * @swagger
 * /mous/scan-document:
 *   post:
 *     summary: Scan tài liệu MOU bằng Gemini AI
 *     tags: [MOU]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Thông tin được trích xuất từ tài liệu
 */
router.post('/scan-document', upload.single('file'), verifyRole(['ADMIN', 'FACULTY_MANAGER']), mouController.scanDocument);

/**
 * @swagger
 * /mous/{id}:
 *   get:
 *     summary: Lấy chi tiết một MOU theo ID
 *     tags: [MOU]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Thông tin MOU
 *   put:
 *     summary: Cập nhật thông tin Biên bản ghi nhớ
 *     tags: [MOU]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa Biên bản ghi nhớ
 *     tags: [MOU]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.get('/:id', verifyRole(['ADMIN', 'FACULTY_MANAGER', 'LECTURER']), mouController.getById);
router.put('/:id', verifyRole(['ADMIN', 'FACULTY_MANAGER']), mouController.update);
router.delete('/:id', verifyRole(['ADMIN', 'FACULTY_MANAGER']), mouController.remove);

/**
 * @swagger
 * /mous/{id}/export-pdf:
 *   get:
 *     summary: Xuất file PDF Biên bản ghi nhớ
 *     tags: [MOU]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: File PDF được tải xuống
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/export-pdf', verifyRole(['ADMIN', 'FACULTY_MANAGER', 'LECTURER']), mouController.generatePdf);

module.exports = router;
