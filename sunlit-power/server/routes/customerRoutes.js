const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', verifyToken, requireRole(['admin']), customerController.getAllCustomers);
router.get('/:id', verifyToken, customerController.getCustomerProfile);
router.put('/:id', verifyToken, upload.single('profileImage'), customerController.updateCustomerProfile);

module.exports = router;
