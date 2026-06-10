const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(requireRole(['admin']));

router.get('/dashboard-stats', reportController.getDashboardStats);
router.get('/monthly-complaints', reportController.getMonthlyComplaints);
router.get('/resolution-trends', reportController.getResolutionTrends);
router.get('/product-complaints', reportController.getProductComplaints);
router.get('/sla-summary', reportController.getSlaSummary);
router.get('/technician-perf', reportController.getTechnicianPerf);

module.exports = router;
