const DebtLoan = require('../models/DebtLoan');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

exports.getDebtsLoans = async (req, res) => {
  try {
    const records = await DebtLoan.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });
    return res.status(200).json(records);
  } catch (error) {
    console.error('getDebtsLoans error:', error);
    return res.status(500).json({ message: 'Gagal memuat catatan hutang-piutang.' });
  }
};

exports.createDebtLoan = async (req, res) => {
  try {
    const { type, person_name, amount, due_date, description } = req.body;

    if (!type || !person_name || !amount) {
      return res.status(400).json({ message: 'Tipe, nama orang, dan nominal wajib diisi.' });
    }

    if (!['debt', 'loan'].includes(type)) {
      return res.status(400).json({ message: 'Tipe tidak valid.' });
    }

    const record = await DebtLoan.create({
      user_id: req.user.id,
      type,
      person_name,
      amount,
      remaining_amount: amount,
      due_date: due_date || null,
      description
    });

    return res.status(201).json(record);
  } catch (error) {
    console.error('createDebtLoan error:', error);
    return res.status(500).json({ message: 'Gagal mencatat hutang-piutang.' });
  }
};

exports.deleteDebtLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await DebtLoan.findOne({ where: { id, user_id: req.user.id } });

    if (!record) {
      return res.status(404).json({ message: 'Catatan tidak ditemukan.' });
    }

    await record.destroy();
    return res.status(200).json({ message: 'Catatan berhasil dihapus.' });
  } catch (error) {
    console.error('deleteDebtLoan error:', error);
    return res.status(500).json({ message: 'Gagal menghapus catatan.' });
  }
};

exports.payDebtLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, account_id } = req.body;

    if (!amount || !account_id) {
      return res.status(400).json({ message: 'Jumlah bayar dan akun wajib diisi.' });
    }

    const record = await DebtLoan.findOne({ where: { id, user_id: req.user.id } });
    if (!record) {
      return res.status(404).json({ message: 'Catatan hutang-piutang tidak ditemukan.' });
    }

    if (record.status === 'paid') {
      return res.status(400).json({ message: 'Catatan ini sudah lunas.' });
    }

    const paymentAmount = parseFloat(amount);
    const remaining = parseFloat(record.remaining_amount);

    if (paymentAmount <= 0) {
      return res.status(400).json({ message: 'Nominal pembayaran harus lebih besar dari 0.' });
    }

    if (paymentAmount > remaining) {
      return res.status(400).json({ message: 'Nominal pembayaran melebihi sisa sisa tagihan.' });
    }

    const account = await Account.findOne({ where: { id: account_id, user_id: req.user.id } });
    if (!account) {
      return res.status(400).json({ message: 'Akun keuangan tidak valid.' });
    }

    // 1. Update remaining amount & status
    const newRemaining = remaining - paymentAmount;
    record.remaining_amount = newRemaining;
    if (newRemaining <= 0) {
      record.status = 'paid';
    }
    await record.save();

    // 2. Generate actual transaction
    const txType = record.type === 'debt' ? 'expense' : 'income';
    const txCategory = record.type === 'debt' ? 'Tagihan & Utilitas' : 'Lainnya';
    const txDescription = record.type === 'debt' 
      ? `Pembayaran hutang ke ${record.person_name}` 
      : `Pengembalian piutang oleh ${record.person_name}`;

    await Transaction.create({
      user_id: req.user.id,
      account_id,
      type: txType,
      amount: paymentAmount,
      category: txCategory,
      description: txDescription,
      transaction_date: new Date().toISOString().split('T')[0]
    });

    // 3. Update account balance
    const accountBalance = parseFloat(account.balance);
    if (txType === 'expense') {
      account.balance = accountBalance - paymentAmount;
    } else {
      account.balance = accountBalance + paymentAmount;
    }
    await account.save();

    return res.status(200).json(record);
  } catch (error) {
    console.error('payDebtLoan error:', error);
    return res.status(500).json({ message: 'Gagal memproses pembayaran.' });
  }
};
