const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    { uuid: user.uuid, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { uuid: user.uuid },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};
