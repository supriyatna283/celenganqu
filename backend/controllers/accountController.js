const Account = require('../models/Account');

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.findAll({
      where: { user_id: req.user.id, is_active: true },
      order: [['created_at', 'DESC']]
    });
    return res.status(200).json(accounts);
  } catch (error) {
    console.error('getAccounts error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data akun.' });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { name, type, balance, color } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Nama akun dan tipe wajib diisi.' });
    }

    const account = await Account.create({
      user_id: req.user.id,
      name,
      type,
      balance: balance || 0.00,
      color: color || '#1A56A0'
    });

    return res.status(201).json(account);
  } catch (error) {
    console.error('createAccount error:', error);
    return res.status(500).json({ message: 'Gagal membuat akun.' });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, color } = req.body;

    const account = await Account.findOne({ where: { id, user_id: req.user.id } });
    if (!account) {
      return res.status(404).json({ message: 'Akun tidak ditemukan.' });
    }

    if (name) account.name = name;
    if (type) account.type = type;
    if (color) account.color = color;

    await account.save();

    return res.status(200).json(account);
  } catch (error) {
    console.error('updateAccount error:', error);
    return res.status(500).json({ message: 'Gagal memperbarui akun.' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await Account.findOne({ where: { id, user_id: req.user.id } });
    if (!account) {
      return res.status(404).json({ message: 'Akun tidak ditemukan.' });
    }

    // Soft delete by setting is_active to false
    account.is_active = false;
    await account.save();

    return res.status(200).json({ message: 'Akun berhasil dihapus.' });
  } catch (error) {
    console.error('deleteAccount error:', error);
    return res.status(500).json({ message: 'Gagal menghapus akun.' });
  }
};
