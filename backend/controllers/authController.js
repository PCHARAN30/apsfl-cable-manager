const User = require('../models/User');

exports.signup = async (req, res) => {
  try {
    const { username, phone, password } = req.body;

    if (!username || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid 10-digit phone number' });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    const user = await User.create({ username, phone, password });

    return res.status(201).json({ 
      success: true, 
      message: 'Signed up successfully', 
      userId: user._id.toString(), 
      data: { username: user.username } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && user.matchPassword(password)) {
      return res.json({ 
        success: true, 
        message: 'Logged in successfully', 
        userId: user._id.toString(), 
        data: { username: user.username } 
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const userId = req.headers.authorization;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: { username: user.username, phone: user.phone } });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid session' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const userId = req.headers.authorization;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const { phone, password } = req.body;
    if (phone) {
      if (!/^\d{10}$/.test(phone)) return res.status(400).json({ success: false, message: 'Invalid 10-digit phone number' });
      user.phone = phone;
    }
    if (password) {
      if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      user.password = password;
    }
    await user.save();

    res.json({ success: true, message: 'Profile updated successfully', data: { username: user.username, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};