const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecentAccess = sequelize.define('RecentAccess', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  knowledgeBaseId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'RecentAccess',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = RecentAccess; 