const express = require('express');
const router = express.Router();
const batteryController = require('../controllers/batteryController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', verifyToken, requireRole(['customer']), upload.single('invoiceImage'), batteryController.registerBattery);
router.get('/', verifyToken, requireRole(['customer']), batteryController.getMyBatteries);
router.get('/all', verifyToken, requireRole(['admin']), batteryController.getAllBatteries);
router.get('/:id', verifyToken, batteryController.getBatteryById);
router.put('/:id', verifyToken, upload.single('invoiceImage'), batteryController.updateBattery);
router.delete('/:id', verifyToken, requireRole(['admin']), batteryController.deactivateBattery);

module.exports = router;
