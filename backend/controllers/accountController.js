const Account = require('../models/Account');
const SharedAccount = require('../models/SharedAccount');
const User = require('../models/User');

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.findAll({
      where: { user_id: req.user.id, is_active: true },
      order: [['created_at', 'DESC']]
    });

    const sharedMappings = await SharedAccount.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Account,
        as: 'account',
        where: { is_active: true },
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
      }]
    });

    const sharedAccounts = sharedMappings.map(mapping => {
      const acc = mapping.account.toJSON();
      acc.is_shared = true;
      acc.shared_role = mapping.role;
      acc.owner = mapping.account.user;
      return acc;
    });

    const allAccounts = [...accounts.map(a => a.toJSON()), ...sharedAccounts];
    // Sort all accounts by creation date descending
    allAccounts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json(allAccounts);
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

exports.shareAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const account = await Account.findOne({ where: { id, user_id: req.user.id } });
    if (!account) return res.status(404).json({ message: 'Akun tidak ditemukan atau Anda bukan pemiliknya.' });

    const userToShare = await User.findOne({ where: { email } });
    if (!userToShare) return res.status(404).json({ message: 'Pengguna dengan email tersebut tidak ditemukan. Pastikan mereka sudah terdaftar di Duitku.' });

    if (userToShare.id === req.user.id) return res.status(400).json({ message: 'Anda tidak bisa membagikan akun ke diri sendiri.' });

    const existingShare = await SharedAccount.findOne({ where: { account_id: id, user_id: userToShare.id } });
    if (existingShare) {
      existingShare.role = role || 'editor';
      await existingShare.save();
    } else {
      await SharedAccount.create({ account_id: id, user_id: userToShare.id, role: role || 'editor' });
    }

    return res.status(200).json({ message: `Akun berhasil dibagikan ke ${userToShare.name}.` });
  } catch (error) {
    console.error('shareAccount error:', error);
    return res.status(500).json({ message: 'Gagal membagikan akun.' });
  }
};
