const sequelize = require('./config/database');

async function alterEnum() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    await sequelize.query(`ALTER TABLE accounts MODIFY COLUMN type ENUM('savings', 'wallet', 'credit', 'investment', 'emoney', 'loan', 'business') NOT NULL;`);
    console.log('Enum altered successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

alterEnum();
