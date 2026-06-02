const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Goal = sequelize.define('Goal', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  target_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  current_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  target_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  color: {
    type: DataTypes.CHAR(7),
    allowNull: true,
    defaultValue: '#1A56A0'
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'goals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
User.hasMany(Goal, { foreignKey: 'user_id', as: 'goals' });
Goal.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Goal;
