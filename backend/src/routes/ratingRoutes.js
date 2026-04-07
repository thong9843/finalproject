const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { verifyToken } = require('../middlewares/auth');

router.post('/', verifyToken, ratingController.addRating);
router.get('/enterprise/:enterpriseId', verifyToken, ratingController.getEnterpriseRatings);
router.get('/best', verifyToken, ratingController.getBestEnterprises);

module.exports = router;