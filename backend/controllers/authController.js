const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Semua field (nama, email, password) wajib diisi.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password_hash
    });

    // Seed default categories
    const defaultCategories = [
      // Expenses
      { user_id: user.id, name: 'Makanan & Minuman', type: 'expense', color: '#EF4444', icon: 'Utensils' },
      { user_id: user.id, name: 'Transportasi', type: 'expense', color: '#F59E0B', icon: 'Car' },
      { user_id: user.id, name: 'Belanja', type: 'expense', color: '#10B981', icon: 'ShoppingBag' },
      { user_id: user.id, name: 'Hiburan', type: 'expense', color: '#8B5CF6', icon: 'Film' },
      { user_id: user.id, name: 'Tagihan & Utilitas', type: 'expense', color: '#3B82F6', icon: 'CreditCard' },
      { user_id: user.id, name: 'Kesehatan', type: 'expense', color: '#EC4899', icon: 'HeartPulse' },
      { user_id: user.id, name: 'Lainnya', type: 'expense', color: '#6B7280', icon: 'HelpCircle' },
      // Income
      { user_id: user.id, name: 'Gaji', type: 'income', color: '#10B981', icon: 'Briefcase' },
      { user_id: user.id, name: 'Investasi', type: 'income', color: '#3B82F6', icon: 'TrendingUp' },
      { user_id: user.id, name: 'Hibah & Hadiah', type: 'income', color: '#F59E0B', icon: 'Gift' },
      { user_id: user.id, name: 'Lainnya', type: 'income', color: '#6B7280', icon: 'HelpCircle' }
    ];

    await Category.bulkCreate(defaultCategories);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.status(201).json({
      message: 'Registrasi berhasil.',
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        currency: user.currency,
        avatar_url: user.avatar_url
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // Check active
    if (!user.is_active) {
      return res.status(403).json({ message: 'Akun Anda dinonaktifkan.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.status(200).json({
      message: 'Login berhasil.',
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        currency: user.currency,
        avatar_url: user.avatar_url
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token tidak ditemukan.' });
    }

    // Verify the refresh token
    const jwt = require('jsonwebtoken');
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Refresh token tidak valid atau kedaluwarsa.' });
      }

      // Find user
      const user = await User.findOne({ where: { uuid: decoded.uuid } });
      if (!user || !user.is_active) {
        return res.status(403).json({ message: 'User tidak valid atau dinonaktifkan.' });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};
