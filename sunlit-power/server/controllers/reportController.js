const User = require('../models/User');
const Battery = require('../models/Battery');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const { calculateSlaStatus } = require('../utils/slaCalculator');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalBatteries = await Battery.countDocuments({ isActive: true });
    const openComplaints = await Complaint.countDocuments({ status: { $in: ['Submitted', 'Assigned', 'In Progress'] } });
    const closedComplaints = await Complaint.countDocuments({ status: { $in: ['Resolved', 'Closed'] } });
    const activeTechnicians = await User.countDocuments({ role: 'technician', isActive: true });

    // Satisfaction calculation
    const avgFeedback = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$serviceRating' }
        }
      }
    ]);
    const satisfactionPct = avgFeedback.length > 0 ? Math.round((avgFeedback[0].avgRating / 5) * 100) : 100;

    res.status(200).json({
      totalCustomers,
      totalBatteries,
      openComplaints,
      closedComplaints,
      activeTechnicians,
      satisfactionPct
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve dashboard stats', error: error.message });
  }
};

exports.getMonthlyComplaints = async (req, res) => {
  try {
    const last12Months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = await Complaint.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const monthName = date.toLocaleString('default', { month: 'short' });
      last12Months.push({
        month: `${monthName} ${date.getFullYear().toString().substr(-2)}`,
        count
      });
    }

    res.status(200).json(last12Months);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve monthly complaints', error: error.message });
  }
};

exports.getResolutionTrends = async (req, res) => {
  try {
    const trends = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      // Find complaints resolved in this month
      const resolvedComplaints = await Complaint.find({
        status: { $in: ['Resolved', 'Closed'] },
        resolvedAt: { $gte: startOfMonth, $lte: endOfMonth }
      }).lean();

      let totalDays = 0;
      let count = resolvedComplaints.length;

      for (const comp of resolvedComplaints) {
        const start = new Date(comp.createdAt).getTime();
        const end = new Date(comp.resolvedAt || comp.createdAt).getTime();
        const diffDays = (end - start) / (1000 * 60 * 60 * 24);
        totalDays += diffDays;
      }

      const avgDays = count > 0 ? Math.round((totalDays / count) * 10) / 10 : 0;
      const monthName = date.toLocaleString('default', { month: 'short' });

      trends.push({
        month: `${monthName} ${date.getFullYear().toString().substr(-2)}`,
        days: avgDays
      });
    }

    res.status(200).json(trends);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve resolution trends', error: error.message });
  }
};

exports.getProductComplaints = async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $lookup: {
          from: 'batteries',
          localField: 'batteryId',
          foreignField: '_id',
          as: 'battery'
        }
      },
      { $unwind: '$battery' },
      {
        $group: {
          _id: '$battery.model',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: '$count',
          _id: 0
        }
      }
    ]);

    // Format if empty
    const formattedResult = result.length > 0 ? result : [
      { name: 'Telecom', value: 0 },
      { name: 'EV', value: 0 },
      { name: 'Solar', value: 0 },
      { name: 'Industrial', value: 0 },
      { name: 'Robotics', value: 0 },
      { name: 'Agriculture', value: 0 }
    ];

    res.status(200).json(formattedResult);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve product complaints', error: error.message });
  }
};

exports.getSlaSummary = async (req, res) => {
  try {
    const openComplaints = await Complaint.find({ status: { $nin: ['Resolved', 'Closed'] } }).lean();

    let compliant = 0;
    let nearBreach = 0;
    let breached = 0;

    for (const comp of openComplaints) {
      const statusInfo = calculateSlaStatus(comp.createdAt, comp.priority, false, null);
      if (statusInfo.status === 'Green') {
        compliant++;
      } else if (statusInfo.status === 'Yellow') {
        nearBreach++;
      } else {
        breached++;
      }
    }

    const totalOpen = openComplaints.length;
    const compliancePct = totalOpen > 0 ? Math.round(((compliant + nearBreach) / totalOpen) * 100) : 100;

    res.status(200).json({
      compliant,
      nearBreach,
      breached,
      compliancePct
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve SLA summary', error: error.message });
  }
};

exports.getTechnicianPerf = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician', isActive: true }).lean();
    const perfData = [];

    for (const tech of technicians) {
      // Find complaints assigned to this technician
      const complaints = await Complaint.find({ technicianId: tech._id }).lean();
      const resolvedComplaints = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status));
      const totalResolvedCount = resolvedComplaints.length;

      // Calculate avg days to resolve
      let totalDays = 0;
      for (const comp of resolvedComplaints) {
        const start = new Date(comp.createdAt).getTime();
        const end = new Date(comp.resolvedAt || comp.createdAt).getTime();
        totalDays += (end - start) / (1000 * 60 * 60 * 24);
      }
      const avgDays = totalResolvedCount > 0 ? Math.round((totalDays / totalResolvedCount) * 10) / 10 : 0;

      // Calculate avg rating from Feedbacks
      let totalRating = 0;
      let feedbackCount = 0;
      const complaintIds = complaints.map(c => c._id);
      
      const feedbacks = await Feedback.find({ complaintId: { $in: complaintIds } }).lean();
      for (const feed of feedbacks) {
        totalRating += feed.techRating;
        feedbackCount++;
      }
      const avgRating = feedbackCount > 0 ? Math.round((totalRating / feedbackCount) * 10) / 10 : 0;

      perfData.push({
        technicianId: tech._id,
        name: tech.name,
        assigned: complaints.length,
        resolved: totalResolvedCount,
        avgRating,
        avgDays
      });
    }

    res.status(200).json(perfData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve technician performance', error: error.message });
  }
};
