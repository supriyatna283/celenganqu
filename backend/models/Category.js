const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Category = sequelize.define('Category', {
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
  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#3B82F6' // default Tailwind blue-500
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Folder'
  }
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
User.hasMany(Category, { foreignKey: 'user_id', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Category;
