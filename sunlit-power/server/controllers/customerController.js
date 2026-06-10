const User = require('../models/User');

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).sort({ name: 1 }).lean();
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve customers', error: error.message });
  }
};

exports.getCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await User.findOne({ _id: id, role: 'customer' }).lean();

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve profile', error: error.message });
  }
};

exports.updateCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;

    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (address) customer.address = address;

    if (req.file) {
      customer.profileImage = req.file.filename;
    }

    await customer.save();
    res.status(200).json({ message: 'Customer profile updated successfully', customer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};
