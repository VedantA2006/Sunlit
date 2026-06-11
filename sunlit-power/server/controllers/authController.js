const User = require('../models/User');
const Customer = require('../models/Customer');
const Technician = require('../models/Technician');
const Battery = require('../models/Battery');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const sendEmail = require('../utils/sendEmail');

const setRefreshTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, gstNumber, companyName, batterySerialNumber, batteryModel } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole = role && ['customer', 'technician', 'admin'].includes(role) ? role : 'customer';

    const user = new User({
      name,
      email,
      passwordHash,
      role: userRole,
      phone,
      address
    });

    await user.save();

    if (userRole === 'customer') {
      const customer = new Customer({ 
        userId: user._id,
        gstNumber: gstNumber || '',
        companyName: companyName || ''
      });
      await customer.save();

      // Register first battery if serial number is provided
      if (batterySerialNumber && batteryModel) {
        const battery = new Battery({
          serialNumber: batterySerialNumber,
          model: batteryModel,
          purchaseDate: new Date(),
          dealerName: 'Sunlit Direct',
          warrantyYears: 3,
          customerId: user._id
        });
        await battery.save();
      }
    } else if (userRole === 'technician') {
      const technician = new Technician({ 
        userId: user._id,
        skills: req.body.skills || []
      });
      await technician.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials or user deactivated' });
    }

    // Optional role check
    if (role && user.role !== role) {
      return res.status(403).json({ message: `Access denied. Registered role is ${user.role}.` });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    const user = await User.findOne({ refreshToken });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    const jwt = require('jsonwebtoken');
    const isProd = process.env.NODE_ENV === 'production';
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_here', async (err, decoded) => {
      if (err) {
        user.refreshToken = null;
        await user.save();
        res.clearCookie('refreshToken', {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? 'none' : 'lax'
        });
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }

      const accessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      user.refreshToken = newRefreshToken;
      await user.save();

      setRefreshTokenCookie(res, newRefreshToken);

      res.status(200).json({
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          profileImage: user.profileImage
        }
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Token refresh failed', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return 200/success anyway to prevent user enumeration attacks
      return res.status(200).json({ message: 'If that email exists, we have sent a reset link' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password/${resetToken}`;

    const mailHtml = `
      <h3>Sunlit Power Pvt Ltd - Password Reset Request</h3>
      <p>Hello ${user.name},</p>
      <p>You requested a password reset. Click the link below to reset your password within the next hour:</p>
      <a href="${resetLink}" target="_blank">${resetLink}</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Sunlit Power Pvt Ltd - Reset Password',
      html: mailHtml
    });

    res.status(200).json({ message: 'Reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Forgot password request failed', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'New password is required' });
    }

    const user = await User.findOne({
      resetToken: token,
      resetExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetExpiry = undefined;
    user.refreshToken = null; // Invalidate current sessions
    await user.save();

    res.status(200).json({ message: 'Password reset successful. Please log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Reset password failed', error: error.message });
  }
};
