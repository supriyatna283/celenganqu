require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Account = require('./models/Account');
const Goal = require('./models/Goal');

async function deleteData() {
  const t = await sequelize.transaction();
  try {
    console.log('Mencari user dengan email ucilkecil387@gmail.com...');
    const user = await User.findOne({ where: { email: 'ucilkecil387@gmail.com' } });
    
    if (!user) {
      console.log('User tidak ditemukan!');
      await t.rollback();
      process.exit();
    }
    
    console.log(`User ditemukan! ID: ${user.id}`);
    
    // 1. Delete all transactions
    const deletedTransactions = await Transaction.destroy({
      where: { user_id: user.id },
      transaction: t
    });
    console.log(`Berhasil menghapus ${deletedTransactions} transaksi.`);

    // 2. Reset Goal balances (tabungan)
    const resetGoals = await Goal.update(
      { current_amount: 0 },
      { where: { user_id: user.id }, transaction: t }
    );
    console.log(`Berhasil mereset saldo pada ${resetGoals[0]} tujuan tabungan.`);

    // 3. Reset Account balances (akun dompet/bank)
    const resetAccounts = await Account.update(
      { balance: 0 },
      { where: { user_id: user.id }, transaction: t }
    );
    console.log(`Berhasil mereset saldo pada ${resetAccounts[0]} akun.`);

    await t.commit();
    console.log('Semua data transaksi dan tabungan berhasil dibersihkan.');
  } catch (error) {
    await t.rollback();
    console.error('Terjadi kesalahan:', error);
  } finally {
    process.exit();
  }
}

deleteData();
