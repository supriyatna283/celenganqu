const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Account = require('./Account');

const Transaction = sequelize.define('Transaction', {
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
  destination_account_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: Account,
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('income', 'expense', 'transfer'),
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
  attachment_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  is_recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Account.hasMany(Transaction, { foreignKey: 'account_id', as: 'transactions' });
Transaction.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

Account.hasMany(Transaction, { foreignKey: 'destination_account_id', as: 'incoming_transfers' });
Transaction.belongsTo(Account, { foreignKey: 'destination_account_id', as: 'destination_account' });

module.exports = Transaction;
