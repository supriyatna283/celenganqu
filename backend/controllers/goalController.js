const Goal = require('../models/Goal');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const sequelize = require('../config/database');

exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.findAll({
      where: { user_id: req.user.id },
      order: [['is_completed', 'ASC'], ['created_at', 'DESC']]
    });
    return res.status(200).json(goals);
  } catch (error) {
    console.error('getGoals error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data tujuan keuangan.' });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const { name, target_amount, target_date, color } = req.body;

    if (!name || !target_amount) {
      return res.status(400).json({ message: 'Nama tujuan dan target nominal wajib diisi.' });
    }

    const goal = await Goal.create({
      user_id: req.user.id,
      name,
      target_amount,
      current_amount: 0.00,
      target_date: target_date || null,
      color: color || '#1A56A0',
      is_completed: false
    });

    return res.status(201).json(goal);
  } catch (error) {
    console.error('createGoal error:', error);
    return res.status(500).json({ message: 'Gagal membuat tujuan keuangan.' });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, target_amount, target_date, color } = req.body;

    const goal = await Goal.findOne({ where: { id, user_id: req.user.id } });
    if (!goal) {
      return res.status(404).json({ message: 'Tujuan keuangan tidak ditemukan.' });
    }

    if (name) goal.name = name;
    if (target_amount) {
      goal.target_amount = target_amount;
      goal.is_completed = parseFloat(goal.current_amount) >= parseFloat(target_amount);
    }
    if (target_date !== undefined) goal.target_date = target_date;
    if (color) goal.color = color;

    await goal.save();

    return res.status(200).json(goal);
  } catch (error) {
    console.error('updateGoal error:', error);
    return res.status(500).json({ message: 'Gagal memperbarui tujuan keuangan.' });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findOne({ where: { id, user_id: req.user.id } });
    if (!goal) {
      return res.status(404).json({ message: 'Tujuan keuangan tidak ditemukan.' });
    }

    await goal.destroy();

    return res.status(200).json({ message: 'Tujuan keuangan berhasil dihapus.' });
  } catch (error) {
    console.error('deleteGoal error:', error);
    return res.status(500).json({ message: 'Gagal menghapus tujuan keuangan.' });
  }
};

// Custom logic to deposit money from an Account to a Goal
exports.depositToGoal = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { account_id, amount } = req.body;

    const numericAmount = parseFloat(amount);
    if (!account_id || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Pilih akun asal dan isi jumlah nominal dengan benar.' });
    }

    // 1. Find goal
    const goal = await Goal.findOne({ where: { id, user_id: req.user.id }, transaction: t });
    if (!goal) {
      return res.status(404).json({ message: 'Tujuan keuangan tidak ditemukan.' });
    }

    // 2. Find and check account balance
    const account = await Account.findOne({ where: { id: account_id, user_id: req.user.id }, transaction: t });
    if (!account) {
      return res.status(404).json({ message: 'Akun asal tidak ditemukan.' });
    }

    if (parseFloat(account.balance) < numericAmount) {
      return res.status(400).json({ message: 'Saldo akun tidak mencukupi untuk menabung.' });
    }

    // 3. Update account balance (subtract)
    account.balance = parseFloat(account.balance) - numericAmount;
    await account.save({ transaction: t });

    // 4. Create transaction (expense log)
    await Transaction.create({
      user_id: req.user.id,
      account_id,
      type: 'expense',
      amount: numericAmount,
      category: 'Tabungan',
      description: `Menabung untuk: ${goal.name}`,
      transaction_date: new Date().toISOString().split('T')[0]
    }, { transaction: t });

    const oldAmount = parseFloat(goal.current_amount);
    const targetAmount = parseFloat(goal.target_amount);
    const oldPercent = (oldAmount / targetAmount) * 100;

    // 5. Update goal current amount
    goal.current_amount = oldAmount + numericAmount;
    goal.is_completed = parseFloat(goal.current_amount) >= targetAmount;
    await goal.save({ transaction: t });

    const newPercent = (parseFloat(goal.current_amount) / targetAmount) * 100;

    // 6. Check Milestones and Notify
    const milestones = [100, 75, 50, 25];
    for (const m of milestones) {
      if (oldPercent < m && newPercent >= m) {
        await Notification.create({
          user_id: req.user.id,
          type: m === 100 ? 'success' : 'info',
          title: `Milestone ${m}% Tercapai!`,
          message: m === 100 
            ? `Selamat! Target tujuan keuangan "${goal.name}" telah terpenuhi 100%.`
            : `Hebat! Tabungan untuk "${goal.name}" sudah mencapai ${m}% dari target.`,
          is_read: false
        }, { transaction: t });
        break; // Only trigger the highest milestone passed
      }
    }

    await t.commit();
    return res.status(200).json(goal);
  } catch (error) {
    await t.rollback();
    console.error('depositToGoal error:', error);
    return res.status(500).json({ message: error.message || 'Gagal menabung ke tujuan keuangan.' });
  }
};
