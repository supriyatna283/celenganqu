const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');
const SharedAccount = require('../models/SharedAccount');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { processRecurringTransactions } = require('../utils/recurringProcessor');
const { Parser } = require('json2csv');
const fs = require('fs');
const csv = require('csv-parser');

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

// Helper to check budget threshold and create notification
const checkBudgetThreshold = async (user_id, category, transaction_date) => {
  try {
    const dateObj = new Date(transaction_date);
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();

    const budget = await Budget.findOne({
      where: { user_id, category, period_month: month, period_year: year }
    });

    if (!budget) return;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const totalSpent = await Transaction.sum('amount', {
      where: {
        user_id,
        category,
        type: 'expense',
        transaction_date: {
          [Op.between]: [startDate, endDate]
        }
      }
    }) || 0;

    const percentage = (totalSpent / budget.amount_limit) * 100;
    
    let thresholdType = null;
    let title = '';
    let message = '';

    if (percentage >= 100) {
      thresholdType = 'budget_100';
      title = 'Anggaran Habis!';
      message = `Pengeluaran Anda untuk kategori ${category} bulan ini telah mencapai atau melebihi batas anggaran (Rp ${parseFloat(budget.amount_limit).toLocaleString('id-ID')}).`;
    } else if (percentage >= 80) {
      thresholdType = 'budget_80';
      title = 'Peringatan Anggaran';
      message = `Pengeluaran Anda untuk kategori ${category} bulan ini telah mencapai ${percentage.toFixed(1)}% dari batas anggaran.`;
    }

    if (thresholdType) {
      const existingNotif = await Notification.findOne({
        where: {
          user_id,
          title,
          message
        }
      });

      if (!existingNotif) {
        await Notification.create({
          user_id,
          title,
          message,
          type: percentage >= 100 ? 'danger' : 'warning'
        });
      }
    }
  } catch (error) {
    console.error('checkBudgetThreshold error:', error);
  }
};

exports.getTransactions = async (req, res) => {
  try {
    await processRecurringTransactions(req.user.id);
    const { account_id, type, category, start_date, end_date } = req.query;

    const userAccounts = await Account.findAll({ where: { user_id: req.user.id } });
    const sharedAccounts = await SharedAccount.findAll({ where: { user_id: req.user.id } });
    const allAccountIds = [...userAccounts.map(a => a.id), ...sharedAccounts.map(a => a.account_id)];

    const whereClause = {
      account_id: {
        [Op.in]: allAccountIds
      }
    };

    if (account_id) {
      if (!allAccountIds.includes(parseInt(account_id))) {
        return res.status(403).json({ message: 'Akses ditolak ke akun ini.' });
      }
      whereClause.account_id = account_id;
    }

    if (type) whereClause.type = type;
    if (category) whereClause.category = category;
    if (start_date && end_date) {
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

    const userAccounts = await Account.findAll({ where: { user_id: req.user.id } });
    const sharedAccounts = await SharedAccount.findAll({ where: { user_id: req.user.id, role: 'editor' } });
    const writableAccountIds = [...userAccounts.map(a => a.id), ...sharedAccounts.map(a => a.account_id)];
    
    if (!writableAccountIds.includes(parseInt(account_id))) {
      await t.rollback();
      return res.status(403).json({ message: 'Anda tidak memiliki hak tulis ke akun ini.' });
    }

    let attachment_url = null;
    if (req.file) {
      attachment_url = '/uploads/' + req.file.filename;
    }

    const transaction = await Transaction.create({
      user_id: req.user.id,
      account_id,
      destination_account_id: type === 'transfer' ? destination_account_id : null,
      type,
      amount,
      category,
      description,
      transaction_date,
      attachment_url
    }, { transaction: t });

    await applyBalanceChange(transaction, false, t);
    await t.commit();

    if (type === 'expense') {
      await checkBudgetThreshold(req.user.id, category, transaction_date);
    }

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

    await applyBalanceChange(transaction, true, t);
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

    await applyBalanceChange(transaction, true, t);

    if (account_id) transaction.account_id = account_id;
    if (type) transaction.type = type;
    if (amount) transaction.amount = amount;
    if (category) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (transaction_date) transaction.transaction_date = transaction_date;
    transaction.destination_account_id = type === 'transfer' ? destination_account_id : null;

    if (req.file) {
      transaction.attachment_url = '/uploads/' + req.file.filename;
    }

    await transaction.save({ transaction: t });
    await applyBalanceChange(transaction, false, t);
    await t.commit();

    if (transaction.type === 'expense') {
      await checkBudgetThreshold(req.user.id, transaction.category, transaction.transaction_date);
    }

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

exports.exportCSV = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Account, as: 'account', attributes: ['name'] },
        { model: Account, as: 'destination_account', attributes: ['name'] }
      ],
      order: [['transaction_date', 'DESC']]
    });

    const data = transactions.map(t => ({
      Tanggal: t.transaction_date,
      Tipe: t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer',
      Kategori: t.category,
      Akun: t.account ? t.account.name : '',
      AkunTujuan: t.destination_account ? t.destination_account.name : '',
      Jumlah: parseFloat(t.amount),
      Deskripsi: t.description || ''
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`Transaksi_Duitku_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    console.error('exportCSV error:', error);
    return res.status(500).json({ message: 'Gagal mengekspor data.' });
  }
};

exports.importCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File CSV tidak ditemukan.' });
  }

  const results = [];
  try {
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let imported = 0;
        let errors = 0;
        
        // Caching account IDs to prevent multiple DB calls
        const accountsCache = {};
        const accounts = await Account.findAll({ where: { user_id: req.user.id } });
        accounts.forEach(acc => {
          accountsCache[acc.name.toLowerCase()] = acc.id;
        });

        // We process sequentially to ensure balance logic runs correctly
        for (const row of results) {
          try {
            const date = row['Tanggal'];
            const tipeRaw = row['Tipe'] ? row['Tipe'].toLowerCase() : '';
            const type = tipeRaw.includes('masuk') ? 'income' : (tipeRaw.includes('keluar') ? 'expense' : 'transfer');
            const category = row['Kategori'];
            const accountName = row['Akun'] ? row['Akun'].toLowerCase() : null;
            const destAccountName = row['AkunTujuan'] ? row['AkunTujuan'].toLowerCase() : null;
            const amount = parseFloat(row['Jumlah']);
            const description = row['Deskripsi'];

            if (!date || !type || !category || !accountName || isNaN(amount)) {
               errors++;
               continue;
            }

            const account_id = accountsCache[accountName];
            if (!account_id) {
               errors++;
               continue;
            }

            let destination_account_id = null;
            if (type === 'transfer') {
               destination_account_id = accountsCache[destAccountName];
               if (!destination_account_id) {
                  errors++;
                  continue;
               }
            }

            const t = await sequelize.transaction();
            const transaction = await Transaction.create({
              user_id: req.user.id,
              account_id,
              destination_account_id,
              type,
              amount,
              category,
              description,
              transaction_date: date
            }, { transaction: t });

            await applyBalanceChange(transaction, false, t);
            await t.commit();

            if (type === 'expense') {
              await checkBudgetThreshold(req.user.id, category, date);
            }

            imported++;
          } catch (e) {
            console.error('Import row error', e);
            errors++;
          }
        }

        fs.unlinkSync(req.file.path); // clean up
        return res.status(200).json({ message: `Selesai: ${imported} transaksi diimpor, ${errors} gagal.` });
      });
  } catch (error) {
    console.error('importCSV error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(500).json({ message: 'Terjadi kesalahan saat membaca file CSV.' });
  }
};
