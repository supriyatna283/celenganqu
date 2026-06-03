const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Account = require('./models/Account');
const Category = require('./models/Category');
const Transaction = require('./models/Transaction');
const Budget = require('./models/Budget');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Note: sequelize.sync is already happening in server.js but we do it here too just in case
    await sequelize.sync();

    // 1. Create a dummy user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    let user = await User.findOne({ where: { email: 'demo@duitku.id' } });
    if (!user) {
      user = await User.create({
        name: 'Demo User',
        email: 'demo@duitku.id',
        password_hash: hashedPassword,
      });
      console.log('Dummy user created.');
    } else {
      console.log('Dummy user already exists.');
    }

    let user2 = await User.findOne({ where: { email: 'istri@duitku.id' } });
    if (!user2) {
      user2 = await User.create({
        name: 'Istri User',
        email: 'istri@duitku.id',
        password_hash: hashedPassword,
      });
      console.log('Dummy wife user created.');
    }

    // 2. Create default categories
    const categories = ['Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Gaji', 'Bonus'];
    for (const catName of categories) {
      const exists = await Category.findOne({ where: { name: catName, user_id: user.id } });
      if (!exists) {
        await Category.create({ name: catName, type: ['Gaji', 'Bonus'].includes(catName) ? 'income' : 'expense', user_id: user.id });
      }
    }

    // 3. Create Accounts
    let account = await Account.findOne({ where: { name: 'Bank BCA', user_id: user.id } });
    if (!account) {
      account = await Account.create({
        user_id: user.id,
        name: 'Bank BCA',
        type: 'savings',
        balance: 15000000,
        color: '#1A56A0'
      });
      console.log('Account BCA created.');
    }

    let ewallet = await Account.findOne({ where: { name: 'GoPay', user_id: user.id } });
    if (!ewallet) {
      ewallet = await Account.create({
        user_id: user.id,
        name: 'GoPay',
        type: 'wallet',
        balance: 500000,
        color: '#16A085'
      });
      console.log('Account GoPay created.');
    }

    // 4. Create dummy transactions for current month
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const count = await Transaction.count({ where: { user_id: user.id } });
    if (count < 5) {
      await Transaction.create({
        user_id: user.id,
        account_id: account.id,
        type: 'income',
        amount: 10000000,
        category: 'Gaji',
        description: 'Gaji Bulanan',
        transaction_date: `${currentMonthStr}-01`
      });

      await Transaction.create({
        user_id: user.id,
        account_id: account.id,
        type: 'expense',
        amount: 2500000,
        category: 'Tagihan',
        description: 'Bayar Listrik dan Internet',
        transaction_date: `${currentMonthStr}-05`
      });

      await Transaction.create({
        user_id: user.id,
        account_id: ewallet.id,
        type: 'expense',
        amount: 50000,
        category: 'Makanan & Minuman',
        description: 'Kopi Starbucks',
        transaction_date: `${currentMonthStr}-10`
      });

      await Transaction.create({
        user_id: user.id,
        account_id: ewallet.id,
        type: 'expense',
        amount: 150000,
        category: 'Transportasi',
        description: 'Isi Saldo GoRide',
        transaction_date: `${currentMonthStr}-12`
      });

      await Transaction.create({
        user_id: user.id,
        account_id: account.id,
        destination_account_id: ewallet.id,
        type: 'transfer',
        amount: 500000,
        category: 'Transfer',
        description: 'Top up GoPay',
        transaction_date: `${currentMonthStr}-15`
      });
      
      console.log('Dummy transactions created.');
    } else {
      console.log('Transactions already exist.');
    }

    // 5. Create budget
    const budgetExists = await Budget.findOne({ where: { user_id: user.id, category: 'Makanan & Minuman', period_month: today.getMonth() + 1 } });
    if (!budgetExists) {
      await Budget.create({
        user_id: user.id,
        category: 'Makanan & Minuman',
        amount_limit: 3000000,
        period_month: today.getMonth() + 1,
        period_year: today.getFullYear()
      });
      console.log('Budget created.');
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
