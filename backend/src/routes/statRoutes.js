const express = require('express');
const router = express.Router();
const statController = require('../controllers/statController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);
router.get('/dashboard', statController.getDashboardStats);

module.exports = router;
