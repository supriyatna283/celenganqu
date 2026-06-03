const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Account = require('./Account');

const SharedAccount = sequelize.define('SharedAccount', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  account_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: Account,
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('editor', 'viewer'),
    defaultValue: 'editor',
    allowNull: false
  }
}, {
  tableName: 'shared_accounts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Account.hasMany(SharedAccount, { foreignKey: 'account_id', as: 'shared_users' });
SharedAccount.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

User.hasMany(SharedAccount, { foreignKey: 'user_id', as: 'shared_accounts' });
SharedAccount.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = SharedAccount;
