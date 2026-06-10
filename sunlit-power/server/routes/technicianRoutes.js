const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technicianController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requireRole(['admin']), technicianController.getAllTechnicians);
router.get('/:id', verifyToken, technicianController.getTechnicianProfile);

module.exports = router;
