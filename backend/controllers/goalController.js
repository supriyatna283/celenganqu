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
  const t = await sequelize.transaction();
  try {
    const { name, target_amount, target_date, color } = req.body;

    if (!name || !target_amount) {
      await t.rollback();
      return res.status(400).json({ message: 'Nama tujuan dan target nominal wajib diisi.' });
    }

    // 1. Create a virtual account for this goal
    const newAccount = await Account.create({
      user_id: req.user.id,
      name: `Tabungan: ${name}`,
      type: 'goal',
      balance: 0.00,
      color: color || '#1A56A0',
      is_active: true
    }, { transaction: t });

    // 2. Create the goal linking to this account
    const goal = await Goal.create({
      user_id: req.user.id,
      account_id: newAccount.id,
      name,
      target_amount,
      current_amount: 0.00,
      target_date: target_date || null,
      color: color || '#1A56A0',
      is_completed: false
    }, { transaction: t });

    await t.commit();
    return res.status(201).json(goal);
  } catch (error) {
    await t.rollback();
    console.error('createGoal error:', error);
    return res.status(500).json({ message: 'Gagal membuat tujuan keuangan.' });
  }
};

exports.updateGoal = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { name, target_amount, target_date, color } = req.body;

    const goal = await Goal.findOne({ where: { id, user_id: req.user.id }, transaction: t });
    if (!goal) {
      await t.rollback();
      return res.status(404).json({ message: 'Tujuan keuangan tidak ditemukan.' });
    }

    if (name) {
      goal.name = name;
      if (goal.account_id) {
        await Account.update(
          { name: `Tabungan: ${name}` },
          { where: { id: goal.account_id }, transaction: t }
        );
      }
    }
    if (target_amount) {
      goal.target_amount = target_amount;
      goal.is_completed = parseFloat(goal.current_amount) >= parseFloat(target_amount);
    }
    if (target_date !== undefined) goal.target_date = target_date;
    if (color) {
      goal.color = color;
      if (goal.account_id) {
        await Account.update(
          { color: color },
          { where: { id: goal.account_id }, transaction: t }
        );
      }
    }

    await goal.save({ transaction: t });
    await t.commit();

    return res.status(200).json(goal);
  } catch (error) {
    await t.rollback();
    console.error('updateGoal error:', error);
    return res.status(500).json({ message: 'Gagal memperbarui tujuan keuangan.' });
  }
};

exports.deleteGoal = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const goal = await Goal.findOne({ where: { id, user_id: req.user.id }, transaction: t });
    if (!goal) {
      await t.rollback();
      return res.status(404).json({ message: 'Tujuan keuangan tidak ditemukan.' });
    }

    // Handle linked virtual account
    if (goal.account_id) {
      const account = await Account.findOne({ where: { id: goal.account_id }, transaction: t });
      if (account && parseFloat(account.balance) > 0) {
        await t.rollback();
        return res.status(400).json({ message: 'Tidak dapat menghapus tujuan tabungan yang masih memiliki saldo. Pindahkan saldo terlebih dahulu lewat menu Transaksi (Transfer).' });
      }
      
      // Delete any associated transactions (should be 0 or transfers that were reverted)
      await Transaction.destroy({ where: { destination_account_id: goal.account_id }, transaction: t });
      await Transaction.destroy({ where: { account_id: goal.account_id }, transaction: t });
      
      // Delete the account
      await Account.destroy({ where: { id: goal.account_id }, transaction: t });
    }

    await goal.destroy({ transaction: t });
    await t.commit();

    return res.status(200).json({ message: 'Tujuan keuangan berhasil dihapus.' });
  } catch (error) {
    await t.rollback();
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
      await t.rollback();
      return res.status(400).json({ message: 'Pilih akun asal dan isi jumlah nominal dengan benar.' });
    }

    // 1. Find goal
    const goal = await Goal.findOne({ where: { id, user_id: req.user.id }, transaction: t });
    if (!goal) {
      await t.rollback();
      return res.status(404).json({ message: 'Tujuan keuangan tidak ditemukan.' });
    }

    if (!goal.account_id) {
      await t.rollback();
      return res.status(400).json({ message: 'Tujuan tabungan ini tidak memiliki akun virtual. Buat ulang tujuan tabungan Anda.' });
    }

    // 2. Find and check source account
    const sourceAccount = await Account.findOne({ where: { id: account_id, user_id: req.user.id }, transaction: t });
    if (!sourceAccount) {
      await t.rollback();
      return res.status(404).json({ message: 'Akun asal tidak ditemukan.' });
    }

    if (parseFloat(sourceAccount.balance) < numericAmount) {
      await t.rollback();
      return res.status(400).json({ message: 'Saldo akun asal tidak mencukupi untuk menabung.' });
    }

    // 3. Find goal account
    const goalAccount = await Account.findOne({ where: { id: goal.account_id, user_id: req.user.id }, transaction: t });
    if (!goalAccount) {
      await t.rollback();
      return res.status(404).json({ message: 'Akun kantong tabungan tidak ditemukan.' });
    }

    // 4. Create transfer transaction
    await Transaction.create({
      user_id: req.user.id,
      account_id: sourceAccount.id,
      destination_account_id: goalAccount.id,
      type: 'transfer',
      amount: numericAmount,
      category: 'Transfer',
      description: `Menabung untuk: ${goal.name}`,
      transaction_date: new Date().toISOString().split('T')[0]
    }, { transaction: t });

    // 5. Update balances manually (bypassing transactionController hooks if any)
    sourceAccount.balance = parseFloat(sourceAccount.balance) - numericAmount;
    await sourceAccount.save({ transaction: t });

    goalAccount.balance = parseFloat(goalAccount.balance) + numericAmount;
    await goalAccount.save({ transaction: t });

    const oldAmount = parseFloat(goal.current_amount);
    const targetAmount = parseFloat(goal.target_amount);

    // 6. Sync goal current amount
    goal.current_amount = goalAccount.balance;
    goal.is_completed = parseFloat(goal.current_amount) >= targetAmount;
    await goal.save({ transaction: t });

    const newPercent = (parseFloat(goal.current_amount) / targetAmount) * 100;
    const oldPercent = (oldAmount / targetAmount) * 100;

    // 7. Check Milestones and Notify
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
