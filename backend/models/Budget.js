const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Budget = sequelize.define('Budget', {
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
  category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  amount_limit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  period_month: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  period_year: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  }
}, {
  tableName: 'budgets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
User.hasMany(Budget, { foreignKey: 'user_id', as: 'budgets' });
Budget.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Budget;
