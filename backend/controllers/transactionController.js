const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const sequelize = require('../config/database');
const { processRecurringTransactions } = require('../utils/recurringProcessor');

// Helper to update account balances based on transaction parameters
const applyBalanceChange = async (transaction, reverse = false, transactionObj = null) => {
  const { type, amount, account_id, destination_account_id } = transaction;
  const numericAmount = parseFloat(amount);

  const factor = reverse ? -1 : 1;

  // Source Account
  const sourceAccount = await Account.findByPk(account_id, { transaction: transactionObj });
  if (!sourceAccount) throw new Error('Akun asal tidak ditemukan.');

  if (type === 'income') {
    sourceAccount.balance = parseFloat(sourceAccount.balance) + (numericAmount * factor);
  } else if (type === 'expense') {
    sourceAccount.balance = parseFloat(sourceAccount.balance) - (numericAmount * factor);
  } else if (type === 'transfer') {
    sourceAccount.balance = parseFloat(sourceAccount.balance) - (numericAmount * factor);

    // Destination Account
    if (!destination_account_id) throw new Error('Akun tujuan transfer wajib ditentukan.');
    const destAccount = await Account.findByPk(destination_account_id, { transaction: transactionObj });
    if (!destAccount) throw new Error('Akun tujuan tidak ditemukan.');
    destAccount.balance = parseFloat(destAccount.balance) + (numericAmount * factor);
    await destAccount.save({ transaction: transactionObj });
  }

  await sourceAccount.save({ transaction: transactionObj });
};

exports.getTransactions = async (req, res) => {
  try {
    // Process recurring transactions first!
    await processRecurringTransactions(req.user.id);

    const { account_id, type, category, start_date, end_date } = req.query;

    const whereClause = { user_id: req.user.id };

    if (account_id) {
      whereClause.account_id = account_id;
    }
    if (type) {
      whereClause.type = type;
    }
    if (category) {
      whereClause.category = category;
    }
    if (start_date && end_date) {
      const { Op } = require('sequelize');
      whereClause.transaction_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      include: [
        { model: Account, as: 'account', attributes: ['id', 'name', 'type', 'color'] },
        { model: Account, as: 'destination_account', attributes: ['id', 'name', 'type', 'color'] }
      ],
      order: [['transaction_date', 'DESC'], ['created_at', 'DESC']]
    });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('getTransactions error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data transaksi.' });
  }
};

exports.createTransaction = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { account_id, destination_account_id, type, amount, category, description, transaction_date } = req.body;

    if (!account_id || !type || !amount || !category || !transaction_date) {
      return res.status(400).json({ message: 'Kolom akun, tipe, jumlah, kategori, dan tanggal wajib diisi.' });
    }

    const transaction = await Transaction.create({
      user_id: req.user.id,
      account_id,
      destination_account_id: type === 'transfer' ? destination_account_id : null,
      type,
      amount,
      category,
      description,
      transaction_date
    }, { transaction: t });

    // Update balance
    await applyBalanceChange(transaction, false, t);

    await t.commit();

    // Fetch the created transaction with associations to return
    const result = await Transaction.findByPk(transaction.id, {
      include: [
        { model: Account, as: 'account', attributes: ['id', 'name', 'type', 'color'] },
        { model: Account, as: 'destination_account', attributes: ['id', 'name', 'type', 'color'] }
      ]
    });

    return res.status(201).json(result);
  } catch (error) {
    await t.rollback();
    console.error('createTransaction error:', error);
    return res.status(500).json({ message: error.message || 'Gagal membuat transaksi.' });
  }
};

exports.deleteTransaction = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    // Reverse balance change
    await applyBalanceChange(transaction, true, t);

    // Delete transaction
    await transaction.destroy({ transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'Transaksi berhasil dihapus.' });
  } catch (error) {
    await t.rollback();
    console.error('deleteTransaction error:', error);
    return res.status(500).json({ message: error.message || 'Gagal menghapus transaksi.' });
  }
};

exports.updateTransaction = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { account_id, destination_account_id, type, amount, category, description, transaction_date } = req.body;

    const transaction = await Transaction.findOne({ where: { id, user_id: req.user.id } });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    // 1. Reverse the old balance impact
    await applyBalanceChange(transaction, true, t);

    // 2. Update transaction fields
    if (account_id) transaction.account_id = account_id;
    if (type) transaction.type = type;
    if (amount) transaction.amount = amount;
    if (category) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (transaction_date) transaction.transaction_date = transaction_date;
    transaction.destination_account_id = type === 'transfer' ? destination_account_id : null;

    await transaction.save({ transaction: t });

    // 3. Apply the new balance impact
    await applyBalanceChange(transaction, false, t);

    await t.commit();

    const result = await Transaction.findByPk(transaction.id, {
      include: [
        { model: Account, as: 'account', attributes: ['id', 'name', 'type', 'color'] },
        { model: Account, as: 'destination_account', attributes: ['id', 'name', 'type', 'color'] }
      ]
    });

    return res.status(200).json(result);
  } catch (error) {
    await t.rollback();
    console.error('updateTransaction error:', error);
    return res.status(500).json({ message: error.message || 'Gagal memperbarui transaksi.' });
  }
};
