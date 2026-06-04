require('dotenv').config();
const sequelize = require('./config/database');

async function migrate() {
  try {
    console.log('Starting migration for goal virtual accounts...');

    // 1. Alter enum 'type' in accounts
    await sequelize.query(`
      ALTER TABLE accounts 
      MODIFY COLUMN type ENUM('savings', 'wallet', 'credit', 'investment', 'emoney', 'loan', 'business', 'goal') NOT NULL;
    `);
    console.log('Successfully updated accounts type ENUM.');

    // 2. Add account_id to goals
    // We check if it exists first
    const [results] = await sequelize.query(`
      SHOW COLUMNS FROM goals LIKE 'account_id';
    `);

    if (results.length === 0) {
      await sequelize.query(`
        ALTER TABLE goals 
        ADD COLUMN account_id BIGINT UNSIGNED NULL AFTER user_id;
      `);
      await sequelize.query(`
        ALTER TABLE goals
        ADD CONSTRAINT fk_goal_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
      `);
      console.log('Successfully added account_id to goals.');
    } else {
      console.log('account_id already exists in goals table.');
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();
