const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public tracking route
router.get('/track/:complaintId', complaintController.trackComplaint);

router.post('/', verifyToken, requireRole(['customer']), upload.array('images', 5), complaintController.raiseComplaint);
router.get('/mine', verifyToken, requireRole(['customer']), complaintController.getMyComplaints);
router.get('/', verifyToken, requireRole(['admin']), complaintController.getAllComplaints);
router.get('/assigned', verifyToken, requireRole(['technician']), complaintController.getAssignedComplaints);
router.get('/:id', verifyToken, complaintController.getComplaintById);

router.put('/:id/assign', verifyToken, requireRole(['admin']), complaintController.assignTechnician);
router.put('/:id/status', verifyToken, requireRole(['admin', 'technician']), upload.array('images', 5), complaintController.updateStatus);
router.put('/:id/escalate', verifyToken, requireRole(['admin']), complaintController.escalateComplaint);
router.put('/:id/close', verifyToken, requireRole(['admin']), complaintController.closeComplaint);
router.delete('/:id', verifyToken, requireRole(['admin']), complaintController.deleteComplaint);

module.exports = router;
