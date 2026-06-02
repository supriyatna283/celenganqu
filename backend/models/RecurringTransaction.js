const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Account = require('./Account');

const RecurringTransaction = sequelize.define('RecurringTransaction', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  account_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: Account,
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  frequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  last_run_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  next_run_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'recurring_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
User.hasMany(RecurringTransaction, { foreignKey: 'user_id', as: 'recurring_transactions' });
RecurringTransaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Account.hasMany(RecurringTransaction, { foreignKey: 'account_id', as: 'recurring_transactions' });
RecurringTransaction.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

module.exports = RecurringTransaction;
