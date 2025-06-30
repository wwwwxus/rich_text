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


function addMark(node, markType) {
  if (node.marks) {
    if (!node.marks.some(m => m.type === markType)) {
      node.marks.push({ type: markType });
    }
  } else {
    node.marks = [{ type: markType }];
  }

  if (node.content) {
    node.content.forEach(child => addMark(child, markType));
  }
}

function createCharMap(tiptapJson) {
  const charMap = [];
  let plainText = '';

  function traverse(nodes) {
    if (!nodes || !Array.isArray(nodes)) return;
    nodes.forEach(node => {
      if (node.type === 'text') {
        const text = node.text || '';
        for (const char of text) {
          charMap.push({ char, marks: node.marks || [] });
          plainText += char;
        }
      } else if (node.content) {
        traverse(node.content);
      }
    });
  }

  traverse(tiptapJson.content);
  return { charMap, plainText };
}

function mergeTextNodes(nodes) {
  if (!nodes || nodes.length === 0) return [];
  const merged = [JSON.parse(JSON.stringify(nodes[0]))];

  for (let i = 1; i < nodes.length; i++) {
    const current = nodes[i];
    const last = merged[merged.length - 1];

    const lastMarks = JSON.stringify(last.marks || []);
    const currentMarks = JSON.stringify(current.marks || []);

    if (last.type === 'text' && current.type === 'text' && lastMarks === currentMarks) {
      last.text += current.text;
    } else {
      merged.push(JSON.parse(JSON.stringify(current)));
    }
  }
  return merged;
}

const compareVersions = async (req, res) => {
  try {
    const { documentId, versionNumber1, versionNumber2 } = req.params;

    const version1 = await DocumentVersion.findOne({
      where: { documentId, versionNumber: versionNumber1, isActive: true }
    });

    const version2 = await DocumentVersion.findOne({
      where: { documentId, versionNumber: versionNumber2, isActive: true }
    });

    if (!version1 || !version2) {
      return res.status(404).json({ code: 404, message: '一个或两个版本不存在' });
    }

    let json1, json2;
    try {
      json1 = JSON.parse(version1.content);
    } catch (e) {
      json1 = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: version1.content }] }] };
    }
    try {
      json2 = JSON.parse(version2.content);
    } catch (e) {
      json2 = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: version2.content }] }] };
    }

    const { charMap: charMap1, plainText: plainText1 } = createCharMap(json1);
    const { plainText: plainText2 } = createCharMap(json2);

    const diff = JsDiff.diffChars(plainText1, plainText2);
    const newTextNodes = [];
    let charMapIndex = 0;

    diff.forEach(part => {
      if (part.added) {
        newTextNodes.push({ type: 'text', text: part.value, marks: [{ type: 'add' }] });
      } else if (part.removed) {
        for (let i = 0; i < part.value.length; i++) {
          const charInfo = charMap1[charMapIndex++];
          const marks = [...charInfo.marks, { type: 'remove' }];
          newTextNodes.push({ type: 'text', text: charInfo.char, marks });
        }
      } else { // common
        for (let i = 0; i < part.value.length; i++) {
          const charInfo = charMap1[charMapIndex++];
          newTextNodes.push({ type: 'text', text: charInfo.char, marks: charInfo.marks });
        }
      }
    });

    const mergedContent = mergeTextNodes(newTextNodes);

    const tiptapResult = {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: mergedContent
      }]
    };

    res.json({
      code: 200,
      message: '高保真富文本对比成功',
      data: {
        tiptap: JSON.stringify(tiptapResult)
      }
    });
  } catch (error) {
    console.error('版本对比错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};


module.exports = {
  createVersion,
  getVersions,
  getVersionContent,
  rollbackVersion,
  deleteVersion,
  compareVersions
}; 