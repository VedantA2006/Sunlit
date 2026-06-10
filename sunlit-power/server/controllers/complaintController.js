const Complaint = require('../models/Complaint');
const Battery = require('../models/Battery');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getSlaHours } = require('../utils/slaCalculator');

// Helper to auto-generate Complaint ID: CMP-YYYYMMDD-XXXX
const generateComplaintId = async () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const count = await Complaint.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const sequentialNum = String(count + 1).padStart(4, '0');
  return `CMP-${dateStr}-${sequentialNum}`;
};

// Create a helper to create notifications to avoid repeating code
const createNotification = async (userId, title, message, type) => {
  try {
    await Notification.create({ userId, title, message, type });
  } catch (err) {
    console.error(`Failed to create notification: ${err.message}`);
  }
};

exports.raiseComplaint = async (req, res) => {
  try {
    const { batteryId, type, description, priority } = req.body;
    const customerId = req.user.id;

    if (!batteryId || !type || !description) {
      return res.status(400).json({ message: 'Battery ID, type, and description are required' });
    }

    const battery = await Battery.findById(batteryId);
    if (!battery) {
      return res.status(404).json({ message: 'Battery not found' });
    }

    const complaintId = await generateComplaintId();
    
    // Process multiple uploaded files
    const images = req.files ? req.files.map(file => file.filename) : [];

    const complaintPriority = priority || 'Medium';
    const slaHours = getSlaHours(complaintPriority);
    const estimatedResolutionDate = new Date(Date.now() + slaHours.resolutionHours * 60 * 60 * 1000);

    const complaint = new Complaint({
      complaintId,
      batteryId,
      customerId,
      type,
      description,
      images,
      priority: complaintPriority,
      estimatedResolutionDate,
      timeline: [{
        status: 'Submitted',
        note: 'Complaint raised by customer',
        updatedBy: customerId,
        date: new Date()
      }]
    });

    await complaint.save();

    // Notify Customer
    await createNotification(
      customerId,
      'Complaint Raised Successfully',
      `Your complaint ${complaintId} has been registered. Our team will review it shortly.`,
      'complaint_created'
    );

    // Notify Admins
    const admins = await User.find({ role: 'admin', isActive: true }).lean();
    for (const admin of admins) {
      await createNotification(
        admin._id,
        'New Complaint Received',
        `A new complaint ${complaintId} has been raised by ${req.user.email}.`,
        'complaint_created'
      );
    }

    res.status(201).json({ message: 'Complaint registered successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Failed to raise complaint', error: error.message });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const customerId = req.user.id;
    const complaints = await Complaint.find({ customerId })
      .populate('batteryId', 'serialNumber model')
      .populate('technicianId', 'name phone email')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get complaints', error: error.message });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }
    if (search) {
      // search by complaintId or description
      filter.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const complaints = await Complaint.find(filter)
      .populate('customerId', 'name email phone')
      .populate('batteryId', 'serialNumber model')
      .populate('technicianId', 'name phone email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get complaints', error: error.message });
  }
};

exports.getAssignedComplaints = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const complaints = await Complaint.find({ technicianId })
      .populate('customerId', 'name email phone address')
      .populate('batteryId', 'serialNumber model purchaseDate warrantyYears')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get assigned complaints', error: error.message });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id)
      .populate('customerId', 'name email phone address')
      .populate('batteryId', 'serialNumber model purchaseDate warrantyYears dealerName invoiceImage')
      .populate('technicianId', 'name phone email')
      .populate({
        path: 'timeline.updatedBy',
        select: 'name role'
      })
      .lean();

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Access control
    if (req.user.role === 'customer' && complaint.customerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if (req.user.role === 'technician' && complaint.technicianId && complaint.technicianId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You are not assigned to this complaint.' });
    }

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get complaint details', error: error.message });
  }
};

exports.assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({ message: 'Technician ID is required' });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const technician = await User.findOne({ _id: technicianId, role: 'technician' });
    if (!technician) {
      return res.status(404).json({ message: 'Active technician not found' });
    }

    complaint.technicianId = technicianId;
    complaint.status = 'Assigned';
    complaint.timeline.push({
      status: 'Assigned',
      note: `Assigned to technician ${technician.name}`,
      updatedBy: req.user.id,
      date: new Date()
    });

    await complaint.save();

    // Notifications
    await createNotification(
      technicianId,
      'New Task Assigned',
      `You have been assigned to complaint ${complaint.complaintId}.`,
      'complaint_assigned'
    );

    await createNotification(
      complaint.customerId,
      'Technician Assigned',
      `Technician ${technician.name} (${technician.phone}) has been assigned to your complaint ${complaint.complaintId}.`,
      'complaint_assigned'
    );

    res.status(200).json({ message: 'Technician assigned successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign technician', error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Role restrictions
    if (req.user.role === 'technician' && complaint.technicianId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You are not assigned to this complaint.' });
    }

    // Handle files if technician uploaded resolution screenshots
    const serviceImages = req.files ? req.files.map(file => file.filename) : [];
    if (serviceImages.length > 0) {
      complaint.images = [...complaint.images, ...serviceImages];
    }

    complaint.status = status;
    
    if (status === 'Resolved') {
      complaint.resolvedAt = new Date();
    }

    complaint.timeline.push({
      status,
      note: note || `Complaint status updated to ${status}`,
      updatedBy: req.user.id,
      date: new Date()
    });

    await complaint.save();

    // Notifications
    await createNotification(
      complaint.customerId,
      'Complaint Status Updated',
      `Your complaint ${complaint.complaintId} status is now: ${status}.`,
      'status_updated'
    );

    if (status === 'Resolved') {
      await createNotification(
        complaint.customerId,
        'Feedback Requested',
        `Complaint ${complaint.complaintId} is resolved. Please take a moment to rate our service.`,
        'feedback_request'
      );
    }

    res.status(200).json({ message: 'Status updated successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

exports.escalateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const priorityOrder = ['Low', 'Medium', 'High', 'Critical'];
    const currentIndex = priorityOrder.indexOf(complaint.priority);

    if (currentIndex < priorityOrder.length - 1) {
      complaint.priority = priorityOrder[currentIndex + 1];
      
      // Re-adjust estimated resolution time based on escalated priority
      const slaHours = getSlaHours(complaint.priority);
      complaint.estimatedResolutionDate = new Date(complaint.createdAt.getTime() + slaHours.resolutionHours * 60 * 60 * 1000);

      complaint.timeline.push({
        status: complaint.status,
        note: `Priority escalated to ${complaint.priority}`,
        updatedBy: req.user.id,
        date: new Date()
      });

      await complaint.save();

      // Notify customer
      await createNotification(
        complaint.customerId,
        'Complaint Priority Escalated',
        `Your complaint ${complaint.complaintId} priority has been escalated to ${complaint.priority}.`,
        'status_updated'
      );

      res.status(200).json({ message: `Complaint escalated to ${complaint.priority}`, complaint });
    } else {
      res.status(400).json({ message: 'Complaint is already at Critical priority' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to escalate complaint', error: error.message });
  }
};

exports.closeComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = 'Closed';
    complaint.timeline.push({
      status: 'Closed',
      note: 'Complaint closed and archived',
      updatedBy: req.user.id,
      date: new Date()
    });

    await complaint.save();

    // Notify customer
    await createNotification(
      complaint.customerId,
      'Complaint Closed',
      `Your complaint ${complaint.complaintId} has been successfully closed.`,
      'status_updated'
    );

    res.status(200).json({ message: 'Complaint closed successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Failed to close complaint', error: error.message });
  }
};

exports.deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    
    // We can do hard delete or soft delete by setting a deleted flag,
    // let's do hard delete since there's no deleted field in mongoose schema,
    // or we can remove from DB.
    await Complaint.findByIdAndDelete(id);
    res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete complaint', error: error.message });
  }
};

exports.trackComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    if (!complaintId) {
      return res.status(400).json({ message: 'Complaint ID is required' });
    }
    const complaint = await Complaint.findOne({ complaintId })
      .populate('batteryId', 'serialNumber model')
      .lean();

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const publicData = {
      complaintId: complaint.complaintId,
      status: complaint.status,
      priority: complaint.priority,
      type: complaint.type,
      createdAt: complaint.createdAt,
      batteryModel: complaint.batteryId?.model || 'N/A',
      timeline: complaint.timeline.map(item => ({
        status: item.status,
        note: item.note,
        date: item.date
      }))
    };

    res.status(200).json(publicData);
  } catch (error) {
    res.status(500).json({ message: 'Tracking failed', error: error.message });
  }
};
