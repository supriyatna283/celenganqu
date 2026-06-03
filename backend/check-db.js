require('dotenv').config();
const sequelize = require('./config/database');
const Transaction = require('./models/Transaction');

async function check() {
  await sequelize.authenticate();
  const txs = await Transaction.findAll({
    order: [['created_at', 'DESC']],
    limit: 5
  });
  console.log("Last 5 transactions:");
  txs.forEach(t => console.log(t.toJSON()));
  process.exit();
}
check();
