const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TextComment = sequelize.define('TextComment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  textNanoid: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '所选文本的唯一标识'
  },
  textContent: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '被选中的文本内容'
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '评论内容'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '评论用户ID'
  },
  documentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '文档ID'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否有效'
  }
}, {
  tableName: 'TextComments',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['textNanoid']
    },
    {
      fields: ['documentId']
    },
    {
      fields: ['userId']
    }
  ]
});

module.exports = TextComment; 