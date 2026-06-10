const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/', verifyToken, requireRole(['customer']), feedbackController.submitFeedback);
router.get('/mine', verifyToken, requireRole(['customer']), feedbackController.getMyFeedback);
router.get('/', verifyToken, requireRole(['admin']), feedbackController.getAllFeedback);
router.get('/complaint/:id', verifyToken, feedbackController.getFeedbackByComplaint);

module.exports = router;
