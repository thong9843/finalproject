const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { verifyToken } = require('../middlewares/auth');

// Route chatbot: yêu cầu đăng nhập để sử dụng
router.post('/', verifyToken, chatbotController.chat);

module.exports = router;
