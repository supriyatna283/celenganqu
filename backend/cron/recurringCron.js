const cron = require('node-cron');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { applyBalanceChange } = require('../controllers/transactionController'); // Need to extract this or reimplement

// We need to implement a local balance changer to avoid circular dependencies
async function processRecurringTransactions() {
  console.log('[CRON] Memulai proses pengecekan transaksi rutin...');
  
  const today = new Date().toISOString().split('T')[0];

  try {
    const recurrings = await RecurringTransaction.findAll({
      where: {
        is_active: true,
        next_run_date: {
          [Op.lte]: today
        }
      }
    });

    if (recurrings.length === 0) {
      console.log('[CRON] Tidak ada transaksi rutin yang perlu diproses hari ini.');
      return;
    }

    console.log(`[CRON] Ditemukan ${recurrings.length} transaksi rutin untuk diproses.`);

    for (const r of recurrings) {
      const t = await sequelize.transaction();
      try {
        // 1. Create the actual transaction
        const newTx = await Transaction.create({
          user_id: r.user_id,
          account_id: r.account_id,
          type: r.type,
          amount: r.amount,
          category: r.category,
          description: r.description || `Otomatis: ${r.category}`,
          transaction_date: today,
          is_recurring: true
        }, { transaction: t });

        // 2. Update account balance (manual query to avoid require cycle)
        const account = await sequelize.models.Account.findByPk(r.account_id, { transaction: t });
        if (account) {
          const numericAmount = parseFloat(r.amount);
          if (r.type === 'income') {
            account.balance = parseFloat(account.balance) + numericAmount;
          } else if (r.type === 'expense') {
            account.balance = parseFloat(account.balance) - numericAmount;
          }
          await account.save({ transaction: t });
        }

        // 3. Update RecurringTransaction next_run_date
        r.last_run_date = today;
        
        let nextDate = new Date(today);
        if (r.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (r.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (r.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (r.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        
        r.next_run_date = nextDate.toISOString().split('T')[0];
        await r.save({ transaction: t });

        // 4. Create Notification for user
        await Notification.create({
          user_id: r.user_id,
          type: 'info',
          title: 'Tagihan / Rutin Otomatis',
          message: `Transaksi rutin "${r.category}" sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(r.amount)} telah diproses otomatis.`,
          is_read: false
        }, { transaction: t });

        await t.commit();
        console.log(`[CRON] Transaksi rutin ID ${r.id} berhasil diproses.`);
      } catch (innerErr) {
        await t.rollback();
        console.error(`[CRON] Gagal memproses transaksi rutin ID ${r.id}:`, innerErr);
      }
    }

  } catch (error) {
    console.error('[CRON] Kesalahan sistem saat memproses transaksi rutin:', error);
  }
}

const startCron = () => {
  // Run everyday at 00:01 AM
  cron.schedule('1 0 * * *', () => {
    processRecurringTransactions();
  });
  console.log('[CRON] Scheduler transaksi rutin diaktifkan (berjalan tiap 00:01).');
  
  // For testing purposes, we can run it immediately on startup
  // processRecurringTransactions();
};

module.exports = { startCron };
