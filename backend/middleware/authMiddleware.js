const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'apsfl_super_secret_key_123';

exports.protect = (req, res, next) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authenticated. Invalid token.' });
  }
};