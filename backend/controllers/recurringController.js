const RecurringTransaction = require('../models/RecurringTransaction');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const sequelize = require('../config/database');

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

exports.payEarlyRecurringTemplate = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const template = await RecurringTransaction.findOne({ 
      where: { id, user_id: req.user.id },
      transaction: t
    });

    if (!template) {
      await t.rollback();
      return res.status(404).json({ message: 'Rencana transaksi tidak ditemukan.' });
    }

    const runDateStr = new Date().toISOString().split('T')[0];

    // 1. Create actual Transaction
    await Transaction.create({
      user_id: template.user_id,
      account_id: template.account_id,
      type: template.type,
      amount: template.amount,
      category: template.category,
      description: template.description ? `${template.description} (Bayar Awal)` : 'Transaksi Berulang (Bayar Awal)',
      transaction_date: runDateStr,
      is_recurring: true
    }, { transaction: t });

    // 2. Update Account balance
    const account = await Account.findByPk(template.account_id, { transaction: t });
    if (account) {
      const balance = parseFloat(account.balance);
      const amount = parseFloat(template.amount);
      if (template.type === 'income') {
        account.balance = balance + amount;
      } else {
        account.balance = balance - amount;
      }
      await account.save({ transaction: t });
    }

    // 3. Advance the next_run_date
    template.last_run_date = runDateStr;
    let currentNextRun = new Date(template.next_run_date);
    
    if (template.frequency === 'daily') {
      currentNextRun.setDate(currentNextRun.getDate() + 1);
    } else if (template.frequency === 'weekly') {
      currentNextRun.setDate(currentNextRun.getDate() + 7);
    } else if (template.frequency === 'monthly') {
      currentNextRun.setMonth(currentNextRun.getMonth() + 1);
    } else if (template.frequency === 'yearly') {
      currentNextRun.setFullYear(currentNextRun.getFullYear() + 1);
    }
    
    template.next_run_date = currentNextRun.toISOString().split('T')[0];
    await template.save({ transaction: t });

    await t.commit();

    const populated = await RecurringTransaction.findByPk(template.id, {
      include: [{ model: Account, as: 'account', attributes: ['name'] }]
    });

    return res.status(200).json(populated);
  } catch (error) {
    await t.rollback();
    console.error('payEarlyRecurringTemplate error:', error);
    return res.status(500).json({ message: 'Gagal melakukan pembayaran lebih awal.' });
  }
};
