const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

// Apply auth middleware to all routes in this file
router.use(verifyToken);

// Allow any authenticated user to get the assignees list for tasks assignment
router.get('/assignees', userController.getAssignees);

// Only allow ADMIN role for general user management
router.use(verifyRole(['ADMIN']));

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
