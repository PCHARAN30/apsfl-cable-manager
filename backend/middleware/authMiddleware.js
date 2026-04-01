const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    const userId = req.headers.authorization;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated. No user ID provided.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated. User not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};