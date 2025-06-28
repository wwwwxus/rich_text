const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ÎÄµµÓµÓÐÕßID'
  },
  knowledgeBaseId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  folderId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Documents',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Document; 