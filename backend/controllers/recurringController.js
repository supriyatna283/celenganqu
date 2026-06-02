const RecurringTransaction = require('../models/RecurringTransaction');
const Account = require('../models/Account');

exports.getRecurringTemplates = async (req, res) => {
  try {
    const templates = await RecurringTransaction.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Account, as: 'account', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    return res.status(200).json(templates);
  } catch (error) {
    console.error('getRecurringTemplates error:', error);
    return res.status(500).json({ message: 'Gagal memuat rencana transaksi rutin.' });
  }
};

exports.createRecurringTemplate = async (req, res) => {
  try {
    const { account_id, type, amount, category, description, frequency, start_date } = req.body;

    if (!account_id || !type || !amount || !category || !frequency || !start_date) {
      return res.status(400).json({ message: 'Semua field wajib wajib diisi.' });
    }

    const account = await Account.findOne({ where: { id: account_id, user_id: req.user.id } });
    if (!account) {
      return res.status(400).json({ message: 'Akun keuangan tidak valid.' });
    }

    const template = await RecurringTransaction.create({
      user_id: req.user.id,
      account_id,
      type,
      amount,
      category,
      description,
      frequency,
      start_date,
      next_run_date: start_date // First run is scheduled on start_date
    });

    const populated = await RecurringTransaction.findByPk(template.id, {
      include: [{ model: Account, as: 'account', attributes: ['name'] }]
    });

    return res.status(201).json(populated);
  } catch (error) {
    console.error('createRecurringTemplate error:', error);
    return res.status(500).json({ message: 'Gagal membuat rencana transaksi rutin.' });
  }
};

exports.deleteRecurringTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await RecurringTransaction.findOne({ where: { id, user_id: req.user.id } });

    if (!template) {
      return res.status(404).json({ message: 'Rencana transaksi tidak ditemukan.' });
    }

    await template.destroy();
    return res.status(200).json({ message: 'Rencana transaksi berhasil dihapus.' });
  } catch (error) {
    console.error('deleteRecurringTemplate error:', error);
    return res.status(500).json({ message: 'Gagal menghapus rencana transaksi.' });
  }
};

exports.toggleRecurringTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await RecurringTransaction.findOne({ where: { id, user_id: req.user.id } });

    if (!template) {
      return res.status(404).json({ message: 'Rencana transaksi tidak ditemukan.' });
    }

    template.is_active = !template.is_active;
    await template.save();

    const populated = await RecurringTransaction.findByPk(template.id, {
      include: [{ model: Account, as: 'account', attributes: ['name'] }]
    });

    return res.status(200).json(populated);
  } catch (error) {
    console.error('toggleRecurringTemplate error:', error);
    return res.status(500).json({ message: 'Gagal mengubah status rencana transaksi.' });
  }
};
