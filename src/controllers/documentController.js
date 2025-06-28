const Document = require('../models/Document');
const TextComment = require('../models/TextComment');
const DocumentVersion = require('../models/DocumentVersion');
const User = require('../models/User');
const { createVersion } = require('./versionController');
const { Op } = require('sequelize');

// 获取文档内容
const getDocumentContent = async (req, res) => {
  try {
    const { documentId, userId } = req.params;

    const document = await Document.findOne({
      where: {
        id: documentId,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username']
        }
      ]
    });

    if (!document) {
      return res.status(404).json({ 
        code: 404,
        message: '文档不存在' 
      });
    }

    // 检查用户是否有权限访问（拥有者或协作者）
    const hasAccess = await checkDocumentAccess(documentId, userId);
    if (!hasAccess) {
      return res.status(403).json({ 
        code: 403,
        message: '没有权限访问此文档' 
      });
    }

    res.json({
      code: 200,
      message: '获取文档内容成功',
      data: {
        id: document.id,
        title: document.title,
        content: document.content,
        ownerId: document.ownerId,
        ownerName: document.owner?.username,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }
    });
  } catch (error) {
    console.error('获取文档内容错误:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器内部错误' 
    });
  }
};

// 保存富文本
const saveDocument = async (req, res) => {
  try {
    const { userId, documentId, newContent, updateTime } = req.body;

    const document = await Document.findOne({
      where: {
        id: documentId,
        isActive: true
      }
    });

    if (!document) {
      return res.status(404).json({ 
        code: 404,
        message: '文档不存在' 
      });
    }

    // 检查用户是否有权限编辑
    const hasEditAccess = await checkDocumentEditAccess(documentId, userId);
    if (!hasEditAccess) {
      return res.status(403).json({ 
        code: 403,
        message: '没有权限编辑此文档' 
      });
    }

    // 更新文档内容
    await document.update({
      content: newContent,
      updatedAt: updateTime || new Date()
    });

    // 自动创建新版本
    const newVersion = await createVersion(documentId, newContent, userId);

    res.json({
      code: 200,
      message: '文档保存成功',
      data: {
        documentId,
        versionNumber: newVersion.versionNumber,
        diff: newVersion.diff,
        updatedAt: document.updatedAt
      }
    });
  } catch (error) {
    console.error('保存文档错误:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器内部错误' 
    });
  }
};

// 删除文档
const deleteDocument = async (req, res) => {
  try {
    const { documentId, userId } = req.params;

    const document = await Document.findOne({
      where: {
        id: documentId,
        isActive: true
      }
    });

    if (!document) {
      return res.status(404).json({ 
        code: 404,
        message: '文档不存在' 
      });
    }

    // 只有拥有者才能删除
    if (document.ownerId !== parseInt(userId)) {
      return res.status(403).json({ 
        code: 403,
        message: '只有文档拥有者才能删除文档' 
      });
    }

    // 软删除文档
    await document.update({ isActive: false });

    // 同时删除相关的文本评论和版本记录
    await TextComment.update(
      { isActive: false },
      { where: { documentId } }
    );

    await DocumentVersion.update(
      { isActive: false },
      { where: { documentId } }
    );

    res.json({
      code: 200,
      message: '文档删除成功'
    });
  } catch (error) {
    console.error('删除文档错误:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器内部错误' 
    });
  }
};

// 检查文档访问权限
const checkDocumentAccess = async (documentId, userId) => {
  try {
    const document = await Document.findOne({
      where: { id: documentId, isActive: true }
    });

    if (!document) return false;

    // 如果是拥有者，直接返回true
    if (document.ownerId === parseInt(userId)) {
      return true;
    }

    // 检查是否是协作者（这里需要根据你的协作逻辑来实现）
    // 暂时返回false，你可以根据实际需求修改
    return false;
  } catch (error) {
    console.error('检查文档访问权限错误:', error);
    return false;
  }
};

// 检查文档编辑权限
const checkDocumentEditAccess = async (documentId, userId) => {
  try {
    const document = await Document.findOne({
      where: { id: documentId, isActive: true }
    });

    if (!document) return false;

    // 如果是拥有者，直接返回true
    if (document.ownerId === parseInt(userId)) {
      return true;
    }

    // 检查是否是协作者且有编辑权限
    // 暂时返回false，你可以根据实际需求修改
    return false;
  } catch (error) {
    console.error('检查文档编辑权限错误:', error);
    return false;
  }
};

// 创建文档
const createDocument = async (req, res) => {
  try {
    const { title, content, ownerId, knowledgeBaseId, folderId } = req.body;

    // 验证必填参数
    if (!title || !ownerId || !knowledgeBaseId) {
      return res.status(400).json({
        code: 400,
        message: '标题、拥有者ID和知识库ID为必填参数'
      });
    }

    // 验证用户是否存在
    const user = await User.findByPk(ownerId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 创建文档
    const document = await Document.create({
      title,
      content: content || '',
      ownerId,
      knowledgeBaseId,
      folderId: folderId || null,
      isActive: true
    });

    // 创建初始版本记录
    await DocumentVersion.create({
      documentId: document.id,
      versionNumber: 1,
      content: content || '',
      diff: '初始版本',
      savedAt: new Date()
    });

    res.status(200).json({
      code: 200,
      message: '文档创建成功',
      data: {
        id: document.id,
        title: document.title,
        content: document.content,
        ownerId: document.ownerId,
        knowledgeBaseId: document.knowledgeBaseId,
        folderId: document.folderId,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }
    });
  } catch (error) {
    console.error('创建文档错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取文档列表
const getDocumentList = async (req, res) => {
  try {
    const { knowledgeBaseId, userId } = req.params;

    // 构建查询条件
    const whereCondition = {
      knowledgeBaseId: parseInt(knowledgeBaseId),
      isActive: true
    };

    // 如果指定了用户ID，只返回该用户有权限的文档
    if (userId) {
      whereCondition.ownerId = parseInt(userId);
    }

    const documents = await Document.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.json({
      code: 200,
      message: '获取文档列表成功',
      data: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        ownerId: doc.ownerId,
        ownerName: doc.owner?.username,
        knowledgeBaseId: doc.knowledgeBaseId,
        folderId: doc.folderId,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }))
    });
  } catch (error) {
    console.error('获取文档列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getDocumentContent,
  saveDocument,
  deleteDocument,
  createDocument,
  getDocumentList
}; 