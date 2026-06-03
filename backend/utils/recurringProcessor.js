const { Op } = require('sequelize');
const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

exports.processRecurringTransactions = async (userId) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Find active templates that are due
    const dueTemplates = await RecurringTransaction.findAll({
      where: {
        user_id: userId,
        is_active: true,
        next_run_date: {
          [Op.lte]: todayStr
        }
      }
    });

    for (const template of dueTemplates) {
      let currentNextRun = new Date(template.next_run_date);
      const today = new Date(todayStr);

      // Loop to generate transactions for each missed run date up to today
      while (currentNextRun <= today) {
        const runDateStr = currentNextRun.toISOString().split('T')[0];

        // 1. Create actual Transaction
        await Transaction.create({
          user_id: template.user_id,
          account_id: template.account_id,
          type: template.type,
          amount: template.amount,
          category: template.category,
          description: template.description ? `${template.description} (Berulang)` : 'Transaksi Berulang',
          transaction_date: runDateStr,
          is_recurring: true
        });

        // 2. Update Account balance
        const account = await Account.findByPk(template.account_id);
        if (account) {
          const balance = parseFloat(account.balance);
          const amount = parseFloat(template.amount);
          if (template.type === 'income') {
            account.balance = balance + amount;
          } else {
            account.balance = balance - amount;
          }
          await account.save();
        }

        // Keep track of the last run date
        template.last_run_date = runDateStr;

        // Advance currentNextRun based on frequency
        if (template.frequency === 'daily') {
          currentNextRun.setDate(currentNextRun.getDate() + 1);
        } else if (template.frequency === 'weekly') {
          currentNextRun.setDate(currentNextRun.getDate() + 7);
        } else if (template.frequency === 'monthly') {
          currentNextRun.setMonth(currentNextRun.getMonth() + 1);
        } else if (template.frequency === 'yearly') {
          currentNextRun.setFullYear(currentNextRun.getFullYear() + 1);
        }
      }

      // Update the template next run date
      template.next_run_date = currentNextRun.toISOString().split('T')[0];
      await template.save();
    }
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
  }
};
