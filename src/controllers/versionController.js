const DocumentVersion = require('../models/DocumentVersion');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const checkKnowledgeBaseAccess = require('./knowledgeBaseController').checkKnowledgeBaseAccess;
const JsDiff = require('diff');
const { diffWords } = JsDiff;

// 自动创建版本（内部函数，供文档保存时调用）
const createVersion = async (documentId, content) => {
  try {
    // 使用 Sequelize 的 max 函数，直接获取数据库中最大的版本号
    // 这能确保无论版本是否被软删除,解决唯一键冲突问题
    const maxVersionNumber = await DocumentVersion.max('versionNumber', {
      where: { documentId }
    });

    const newVersionNumber = (maxVersionNumber || 0) + 1;

    // 获取上一个版本的内容用于 diff 计算
    const previousVersion = await DocumentVersion.findOne({
      where: {
        documentId,
        versionNumber: maxVersionNumber
      }
    });

    // 计算与上一版本的差异
    let diff = '';
    if (previousVersion) {
      diff = calculateDiff(previousVersion.content, content);
    } else {
      diff = '初始版本';
    }

    // 创建新版本
    const newVersion = await DocumentVersion.create({
      documentId,
      versionNumber: newVersionNumber,
      content,
      diff,
      savedAt: new Date()
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
    const userId = req.user.id;
    console.log('userId', userId);

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
    const hasAccess = await checkKnowledgeBaseAccess(userId, document.knowledgeBaseId);
    if (!hasAccess) {
      return res.status(403).json({
        code: 403,
        message: '没有权限回退此文档版本'
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
    const userId = req.user.id;

    // 验证文档是否存在
    const document = await Document.findOne({
      where: {
        id: documentId,
        isActive: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        code: 404,
        message: "文档不存在",
      });
    }

    // 检查用户是否有权限删除
    const hasAccess = await checkKnowledgeBaseAccess(
      userId,
      document.knowledgeBaseId
    );
    if (!hasAccess) {
      return res.status(403).json({
        code: 403,
        message: "没有权限回退此文档删除",
      });
    }

    // 获取要删除的版本
    const version = await DocumentVersion.findOne({
      where: {
        documentId,
        versionNumber,
        isActive: true,
      },
    });

    if (!version) {
      return res.status(404).json({
        code: 404,
        message: "版本不存在",
      });
    }

    // 软删除版本
    await version.update({ isActive: false });

    res.json({
      code: 200,
      message: "版本删除成功",
      data: {
        deletedVersionNumber: parseInt(versionNumber),
      },
    });
  } catch (error) {
    console.error('删除版本错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};



const compareVersions = async (req, res) => {
  try {
    const { documentId, versionNumber1, versionNumber2 } = req.params 

    const version1 = await DocumentVersion.findOne({
      where: { documentId, versionNumber: versionNumber1, isActive: true }
    }) 

    const version2 = await DocumentVersion.findOne({
      where: { documentId, versionNumber: versionNumber2, isActive: true }
    }) 

    if (!version1 || !version2) {
      return res.status(404).json({ code: 404, message: '一个或两个版本不存在' }) 
    }

    let json1, json2 
    try {
      json1 = JSON.parse(version1.content) 
    } catch (e) {
      json1 = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: version1.content }] }] } 
    }
    try {
      json2 = JSON.parse(version2.content) 
    } catch (e) {
      json2 = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: version2.content }] }] } 
    }

    // 递归对比，保留所有结构
    const diffResult = diffNodes(json1, json2) 

    res.json({
      code: 200,
      message: '高保真富文本对比成功',
      data: {
        tiptap: JSON.stringify(diffResult)
      }
    }) 
  } catch (error) {
    console.error('版本对比错误:', error) 
    res.status(500).json({ code: 500, message: '服务器内部错误' }) 
  }
} 

function diffNodes(node1, node2) {
  if (!node1 && !node2) return null 
  if (!node1) return { ...node2, marks: [...(node2.marks || []), { type: 'add' }] } 
  if (!node2) return { ...node1, marks: [...(node1.marks || []), { type: 'remove' }] } 

  if (node1.type !== node2.type) {
    // 类型不同，全部标记为删除和新增
    return [
      { ...node1, marks: [...(node1.marks || []), { type: 'remove' }] },
      { ...node2, marks: [...(node2.marks || []), { type: 'add' }] }
    ] 
  }

  if (node1.type === 'text' && node2.type === 'text') {
    const textEqual = (node1.text || '') === (node2.text || '');
    const marksEqual = JSON.stringify(node1.marks || []) === JSON.stringify(node2.marks || []);
    if (textEqual && !marksEqual) {
      // 样式不同，全部标记为删除和新增
      return [
        { ...node1, marks: [...(node1.marks || []), { type: 'remove' }] },
        { ...node2, marks: [...(node2.marks || []), { type: 'add' }] }
      ];
    }
    // 内容不同，按字符 diff
    const diff = JsDiff.diffChars(node1.text || '', node2.text || '');
    const result = [];
    diff.forEach(part => {
      if (part.added) {
        result.push({ type: 'text', text: part.value, marks: [...(node2.marks || []), { type: 'add' }] });
      } else if (part.removed) {
        result.push({ type: 'text', text: part.value, marks: [...(node1.marks || []), { type: 'remove' }] });
      } else {
        result.push({ type: 'text', text: part.value, marks: node1.marks || [] });
      }
    });
    return result;
  }

  // 递归对比子节点
  if (node1.content && node2.content) {
    const length = Math.max(node1.content.length, node2.content.length);
    const newContent = [];
    for (let i = 0; i < length; i++) {
      const diffed = diffNodes(node1.content[i], node2.content[i]);
      if (Array.isArray(diffed)) {
        newContent.push(...diffed);
      } else if (diffed) {
        newContent.push(diffed);
      }
    }
    return { ...node1, content: newContent };
  }
}

// 递归给所有文本节点加 mark
function markAllTextNodes(node, mark) {
  if (!node) return node;
  if (node.type === 'text') {
    return { ...node, marks: [...(node.marks || []), mark] };
  }
  if (Array.isArray(node.content)) {
    return { ...node, content: node.content.map(child => markAllTextNodes(child, mark)) };
  }
  return node;
}

module.exports = {
  createVersion,
  getVersions,
  getVersionContent,
  rollbackVersion,
  deleteVersion,
  compareVersions
}