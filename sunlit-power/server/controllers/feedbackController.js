const Feedback = require('../models/Feedback');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { feedbackReceivedEmail } = require('../utils/emailTemplates');

exports.submitFeedback = async (req, res) => {
  try {
    const { complaintId, serviceRating, techRating, comments } = req.body;
    const customerId = req.user.id;

    if (!complaintId || !serviceRating || !techRating) {
      return res.status(400).json({ message: 'Complaint ID, service rating, and technician rating are required' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.customerId.toString() !== customerId) {
      return res.status(403).json({ message: 'Access denied. You can only submit feedback for your own complaints.' });
    }

    const existingFeedback = await Feedback.findOne({ complaintId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this complaint' });
    }

    const feedback = new Feedback({
      complaintId,
      customerId,
      serviceRating: parseInt(serviceRating),
      techRating: parseInt(techRating),
      comments
    });

    await feedback.save();

    // Send feedback confirmation email
    const customer = await User.findById(customerId).lean();
    if (customer?.email) {
      const emailData = feedbackReceivedEmail({
        customerName: customer.name,
        complaintId: complaint.complaintId,
        serviceRating: parseInt(serviceRating),
        techRating: parseInt(techRating)
      });
      sendEmail({ to: customer.email, subject: emailData.subject, html: emailData.html }).catch(err => {
        console.error('Failed to send feedback confirmation email:', err.message);
      });
    }

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
  }
};

exports.getMyFeedback = async (req, res) => {
  try {
    const customerId = req.user.id;
    const feedbacks = await Feedback.find({ customerId })
      .populate({
        path: 'complaintId',
        select: 'complaintId type description'
      })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve feedback', error: error.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('customerId', 'name email phone')
      .populate({
        path: 'complaintId',
        select: 'complaintId type description priority status'
      })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve all feedback', error: error.message });
  }
};

exports.getFeedbackByComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findOne({ complaintId: id })
      .populate('customerId', 'name email')
      .lean();

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found for this complaint' });
    }

    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve feedback details', error: error.message });
  }
};
