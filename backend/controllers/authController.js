const jwt = require('jsonwebtoken');

// Using environment variables with a fallback to the requested default credentials
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin';
const JWT_SECRET = process.env.JWT_SECRET || 'apsfl_super_secret_key_123';

exports.login = (req, res) => {
  const { username, password } = req.body;

  console.log("👉 Login attempt:", { username, password });
  console.log("👉 Expected credentials:", { ADMIN_USER, ADMIN_PASS });

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });

    // Set JWT in a secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.json({ success: true, message: 'Logged in successfully', data: { username, role: 'admin' } });
  }

  return res.status(401).json({ success: false, message: 'Invalid username or password' });
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, data: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};