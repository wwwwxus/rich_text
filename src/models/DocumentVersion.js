const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentVersion = sequelize.define('DocumentVersion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  documentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '文档ID'
  },
  versionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '版本号'
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true, // 允许为 null
    comment: '基线版本存全文，增量版本为 null'
  },
  isFull: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否为基线版本（全文存储）'
  },
  diff: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '与上一版本的差别'
  },
  savedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '保存时间'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否有效'
  }
}, {
  tableName: 'DocumentVersions',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['documentId']
    },
    {
      fields: ['documentId', 'versionNumber'],
      unique: true
    }
  ]
});

module.exports = DocumentVersion; 