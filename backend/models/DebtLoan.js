const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const DebtLoan = sequelize.define('DebtLoan', {
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
  type: {
    type: DataTypes.ENUM('debt', 'loan'),
    allowNull: false
  },
  person_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  remaining_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'paid'),
    defaultValue: 'active',
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'debts_loans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
User.hasMany(DebtLoan, { foreignKey: 'user_id', as: 'debts_loans' });
DebtLoan.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = DebtLoan;
