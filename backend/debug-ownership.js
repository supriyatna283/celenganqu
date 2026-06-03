require('dotenv').config();
const sequelize = require('./config/database');

async function debug() {
  try {
    // Cek akun milik user 1010627
    const [accounts] = await sequelize.query("SELECT id, name, user_id FROM accounts WHERE user_id = 1010627");
    console.log("Accounts milik user 1010627:", accounts);

    // Cek transaksi terbaru yang disimpan AI (user_id 1010627)
    const [txns] = await sequelize.query("SELECT id, user_id, account_id, type, amount, description, transaction_date, created_at FROM transactions WHERE user_id = 1010627 ORDER BY created_at DESC LIMIT 5");
    console.log("\n5 transaksi terbaru user 1010627:");
    txns.forEach(t => console.log(t));

    // Cek apakah ada transaksi dengan account_id yang TIDAK dimiliki user
    const accountIds = accounts.map(a => a.id);
    const [orphanTxns] = await sequelize.query(`SELECT id, user_id, account_id, description FROM transactions WHERE user_id = 1010627 AND account_id NOT IN (${accountIds.join(',') || 0}) ORDER BY created_at DESC LIMIT 5`);
    console.log("\nTransaksi AI yang account_id-nya TIDAK ada di akun user:", orphanTxns);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
debug();
