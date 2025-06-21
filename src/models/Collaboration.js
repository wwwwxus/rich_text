const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Collaboration = sequelize.define('Collaboration', {
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
  permission: {
    type: DataTypes.ENUM('read', 'write', 'admin'),
    defaultValue: 'read'
  }
}, {
  tableName: 'Collaborations',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Collaboration; 