const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// All routes require authentication and admin privileges
router.use(verifyToken, requireRole(['admin']));

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id/status', userController.updateUserStatus);
router.delete('/:id', userController.deleteUser);

module.exports = router;
