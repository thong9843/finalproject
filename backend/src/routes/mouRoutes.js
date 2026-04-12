const express = require('express');
const router = express.Router();
const mouController = require('../controllers/mouController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

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
router.get('/', mouController.getAll);
router.post('/', mouController.create);

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
router.get('/:id', mouController.getById);
router.put('/:id', mouController.update);
router.delete('/:id', mouController.remove);

module.exports = router;
