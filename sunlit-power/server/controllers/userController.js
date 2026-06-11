const User = require('../models/User');
const Customer = require('../models/Customer');
const Technician = require('../models/Technician');
const bcrypt = require('bcryptjs');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;
    const filter = {};
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve users', error: error.message });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, companyName, gstNumber } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email address already exists' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
      role,
      phone,
      address,
      isActive: true
    });

    await newUser.save();

    // Create sub-profile depending on role
    if (role === 'customer') {
      const newCustomer = new Customer({
        userId: newUser._id,
        companyName: companyName || '',
        gstNumber: gstNumber || ''
      });
      await newCustomer.save();
    } else if (role === 'technician') {
      const newTechnician = new Technician({
        userId: newUser._id,
        skills: ['Battery Maintenance', 'Electrical Diagnostics'],
        isActive: true
      });
      await newTechnician.save();
    }

    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;

    res.status(201).json({
      message: 'User registered successfully by Administrator',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

// Toggle user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ message: 'isActive status is required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    // If technician, update active flag on profile too
    if (user.role === 'technician') {
      await Technician.findOneAndUpdate({ userId: user._id }, { isActive });
    }

    res.status(200).json({
      message: `User status updated to ${isActive ? 'Active' : 'Inactive'}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete role specific profile first
    if (user.role === 'customer') {
      await Customer.findOneAndDelete({ userId: user._id });
    } else if (user.role === 'technician') {
      await Technician.findOneAndDelete({ userId: user._id });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'User and associated profiles deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};
