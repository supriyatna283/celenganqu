const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findOne({
        where: { uuid: decoded.uuid },
        attributes: { exclude: ['password_hash'] }
      });

      if (!req.user) {
        return res.status(401).json({ message: 'User tidak ditemukan.' });
      }

      if (!req.user.is_active) {
        return res.status(403).json({ message: 'Akun Anda dinonaktifkan.' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Tidak diotorisasi, token tidak valid.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Tidak diotorisasi, token tidak ditemukan.' });
  }
};

module.exports = { protect };
