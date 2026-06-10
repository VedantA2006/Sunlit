const User = require('../models/User');

exports.getAllTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).sort({ name: 1 }).lean();
    res.status(200).json(technicians);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve technicians', error: error.message });
  }
};

exports.getTechnicianProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const technician = await User.findOne({ _id: id, role: 'technician' }).lean();

    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    res.status(200).json(technician);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve profile', error: error.message });
  }
};
