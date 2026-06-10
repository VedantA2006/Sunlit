const Battery = require('../models/Battery');

exports.registerBattery = async (req, res) => {
  try {
    const { serialNumber, model, purchaseDate, dealerName, warrantyYears } = req.body;
    const customerId = req.user.id;

    if (!serialNumber || !model || !purchaseDate) {
      return res.status(400).json({ message: 'Serial number, model, and purchase date are required' });
    }

    const existingBattery = await Battery.findOne({ serialNumber });
    if (existingBattery) {
      return res.status(400).json({ message: 'Battery with this serial number is already registered' });
    }

    const invoiceImage = req.file ? req.file.filename : undefined;

    const battery = new Battery({
      serialNumber,
      model,
      purchaseDate,
      dealerName,
      warrantyYears: warrantyYears ? parseInt(warrantyYears) : 2,
      invoiceImage,
      customerId
    });

    await battery.save();
    res.status(201).json({ message: 'Battery registered successfully', battery });
  } catch (error) {
    res.status(500).json({ message: 'Failed to register battery', error: error.message });
  }
};

exports.getMyBatteries = async (req, res) => {
  try {
    const customerId = req.user.id;
    const batteries = await Battery.find({ customerId, isActive: true }).sort({ registeredAt: -1 }).lean();
    res.status(200).json(batteries);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get batteries', error: error.message });
  }
};

exports.getAllBatteries = async (req, res) => {
  try {
    // Admin only
    const batteries = await Battery.find().populate('customerId', 'name email phone').sort({ registeredAt: -1 }).lean();
    res.status(200).json(batteries);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get batteries', error: error.message });
  }
};

exports.getBatteryById = async (req, res) => {
  try {
    const { id } = req.params;
    const battery = await Battery.findById(id).populate('customerId', 'name email phone address').lean();

    if (!battery) {
      return res.status(404).json({ message: 'Battery not found' });
    }

    // Customer can only view their own batteries
    if (req.user.role === 'customer' && battery.customerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. This is not your battery.' });
    }

    res.status(200).json(battery);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get battery details', error: error.message });
  }
};

exports.updateBattery = async (req, res) => {
  try {
    const { id } = req.params;
    const { model, purchaseDate, dealerName, warrantyYears } = req.body;
    
    let battery = await Battery.findById(id);
    if (!battery) {
      return res.status(404).json({ message: 'Battery not found' });
    }

    // Role check
    if (req.user.role === 'customer' && battery.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (model) battery.model = model;
    if (purchaseDate) battery.purchaseDate = purchaseDate;
    if (dealerName) battery.dealerName = dealerName;
    if (warrantyYears) battery.warrantyYears = parseInt(warrantyYears);

    if (req.file) {
      battery.invoiceImage = req.file.filename;
    }

    await battery.save();
    res.status(200).json({ message: 'Battery updated successfully', battery });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update battery', error: error.message });
  }
};

exports.deactivateBattery = async (req, res) => {
  try {
    const { id } = req.params;
    const battery = await Battery.findById(id);

    if (!battery) {
      return res.status(404).json({ message: 'Battery not found' });
    }

    battery.isActive = false;
    await battery.save();
    res.status(200).json({ message: 'Battery deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to deactivate battery', error: error.message });
  }
};
