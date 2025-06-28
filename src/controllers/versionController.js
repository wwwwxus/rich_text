const DocumentVersion = require('../models/DocumentVersion');
const Document = require('../models/Document');
const { Op } = require('sequelize');

// 自动创建版本（内部函数，供文档保存时调用）
const createVersion = async (documentId, content, userId) => {
  try {
    // 获取最新版本号
    const latestVersion = await DocumentVersion.findOne({
      where: { 
        documentId,
        isActive: true 
      },
      order: [['versionNumber', 'DESC']]
    });
    
    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;
    
    // 计算与上一版本的差异
    let diff = '';
    if (latestVersion) {
      diff = calculateDiff(latestVersion.content, content);
    } else {
      diff = '初始版本';
    }
    
    // 创建新版本
    const newVersion = await DocumentVersion.create({
      documentId,
      versionNumber: newVersionNumber,
      content,
      diff,
      savedAt: new Date(),
      createdBy: userId
    });
    
    return newVersion;
  } catch (error) {
    console.error('创建版本错误:', error);
    throw error;
  }
};

// 简单的文本差异计算函数
const calculateDiff = (oldContent, newContent) => {
  if (!oldContent) return '初始版本';
  if (oldContent === newContent) return '内容无变化';
  
  // 简单的差异计算（实际项目中可以使用更复杂的diff算法）
  const oldLength = oldContent.length;
  const newLength = newContent.length;
  
  if (newLength > oldLength) {
    return `内容增加 ${newLength - oldLength} 个字符`;
  } else if (newLength < oldLength) {
    return `内容减少 ${oldLength - newLength} 个字符`;
  } else {
    return '内容被修改';
  }
};

// 查看版本列表
const getVersions = async (req, res) => {
  try {
    const { documentId } = req.params;

    // 验证文档是否存在
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

    // 获取所有版本
    const versions = await DocumentVersion.findAll({
      where: {
        documentId,
        isActive: true
      },
      order: [['versionNumber', 'DESC']],
      attributes: ['id', 'versionNumber', 'diff', 'savedAt', 'createdAt']
    });

    res.json({
      code: 200,
      message: '获取版本列表成功',
      data: versions.map(version => ({
        id: version.id,
        versionNumber: version.versionNumber,
        diff: version.diff,
        savedAt: version.savedAt,
        createdAt: version.createdAt
      }))
    });
  } catch (error) {
    console.error('获取版本列表错误:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器内部错误' 
    });
  }
};

// 获取特定版本内容
const getVersionContent = async (req, res) => {
  try {
    const { documentId, versionNumber } = req.params;

    // 验证文档是否存在
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

    // 获取特定版本
    const version = await DocumentVersion.findOne({
      where: {
        documentId,
        versionNumber,
        isActive: true
      }
    });

    if (!version) {
      return res.status(404).json({ 
        code: 404,
        message: '版本不存在' 
      });
    }

    res.json({
      code: 200,
      message: '获取版本内容成功',
      data: {
        id: version.id,
        documentId: version.documentId,
        versionNumber: version.versionNumber,
        content: version.content,
        diff: version.diff,
        savedAt: version.savedAt,
        createdAt: version.createdAt
      }
    });
  } catch (error) {
    console.error('获取版本内容错误:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器内部错误' 
    });
  }
};

// 回退版本
const rollbackVersion = async (req, res) => {
  try {
    const { documentId, versionNumber } = req.params;
    const { userId } = req.body;

    // 验证文档是否存在
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
    if (document.ownerId !== parseInt(userId)) {
      return res.status(403).json({ 
        code: 403,
        message: '只有文档拥有者才能回退版本' 
      });
    }

    // 获取目标版本
    const targetVersion = await DocumentVersion.findOne({
      where: {
        documentId,
        versionNumber,
        isActive: true
      }
    });

    if (!targetVersion) {
      return res.status(404).json({ 
        code: 404,
        message: '目标版本不存在' 
      });
    }

    // 更新文档内容为目标版本的内容
    await document.update({
      content: targetVersion.content,
      updatedAt: new Date()
    });

    // 创建新的版本记录（回退操作）
    const newVersion = await createVersion(documentId, targetVersion.content, userId);

    res.json({
      code: 200,
      message: '版本回退成功',
      data: {
        documentId,
        rollbackToVersion: parseInt(versionNumber),
        newVersionNumber: newVersion.versionNumber,
        content: targetVersion.content,
        updatedAt: document.updatedAt
      }
    });
  } catch (error) {
    console.error('回退版本错误:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器内部错误' 
    });
  }
};

// 删除版本
const deleteVersion = async (req, res) => {
  try {
    const { documentId, versionNumber } = req.params;
    const { userId } = req.body;

    // 验证文档是否存在
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

    // 只有文档拥有者才能删除版本
    if (document.ownerId !== parseInt(userId)) {
      return res.status(403).json({ 
        code: 403,
        message: '只有文档拥有者才能删除版本' 
      });
    }

    // 获取要删除的版本
    const version = await DocumentVersion.findOne({
      where: {
        documentId,
        versionNumber,
        isActive: true
      }
    });

    if (!version) {
      return res.status(404).json({ 
        code: 404,
        message: '版本不存在' 
      });
    }

    // 软删除版本
    await version.update({ isActive: false });

    res.json({
      code: 200,
      message: '版本删除成功',
      data: {
        deletedVersionNumber: parseInt(versionNumber)
      }
    });
  } catch (error) {
    console.error('删除版本错误:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器内部错误' 
    });
  }
};

module.exports = {
  createVersion,
  getVersions,
  getVersionContent,
  rollbackVersion,
  deleteVersion
}; 