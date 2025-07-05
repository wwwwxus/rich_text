const DocumentVersion = require('../models/DocumentVersion');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const checkKnowledgeBaseAccess = require('./knowledgeBaseController').checkKnowledgeBaseAccess;
const JsDiff = require('diff');
const { Op } = require('sequelize');

const BASELINE_INTERVAL = 5 // 每5个版本存一次全文

// 自动创建版本（内部函数，供文档保存时调用）
const createVersion = async (documentId, content) => {
  try {
    if (!content) {
      throw new Error('创建版本失败：内容不能为空')
    }

    // 使用 Sequelize 的 max 函数，直接获取数据库中最大的版本号
    // 确保无论版本是否被软删除,解决唯一键冲突问题
    const maxVersionNumber = await DocumentVersion.max('versionNumber', {
      where: { documentId }
    });

    const newVersionNumber = (maxVersionNumber || 0) + 1;

    // 获取上一个版本的内容用于 diff 计算
    const previousVersion = await Document.findOne({
      where: {
        id:documentId,
        isActive: true
      }
    });

    // 计算与上一版本的差异
    // 若内容与上一版本完全相同，不创建新版本
    if (previousVersion && previousVersion.content === content) {
      return previousVersion // 返回上一版本，避免重复
    }
    // 判断是否为基线版本（每 BASELINE_INTERVAL 个版本存一次全文）
    const isFull = newVersionNumber % BASELINE_INTERVAL === 1

    //  计算与上一版本的差异（仅非基线版本需要）
    let diff = null
    if (previousVersion && !isFull) {
    const prevContentStr = typeof previousVersion.content === 'string'
      ? previousVersion.content
      : JSON.stringify(previousVersion.content, null, 0)

    const contentStr = typeof content === 'string'
      ? content
      : JSON.stringify(content, null, 0)

    diff = JsDiff.createPatch('doc', prevContentStr, contentStr)
  }


    // 确定要保存的内容（基线版本存全文，增量版本存 null）
    const contentToSave = isFull ? content : null

    // 创建新版本
    const newVersion = await DocumentVersion.create({
      documentId,
      versionNumber: newVersionNumber,
      content: contentToSave,
      diff,
      isFull,
      savedAt: new Date()
    })

    return newVersion;
  } catch (error) {
    console.error('创建版本错误:', error);
    throw error;
  }
}


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
        content: version.content || await restoreVersionContent(documentId, versionNumber),
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
    const { documentId, versionNumber } = req.params
    const userId = req.user.id

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

    // 获取完整内容（无论基线还是增量）
    const restoredContent = targetVersion.content
      ? targetVersion.content
      : await restoreVersionContent(documentId, versionNumber)

    // 更新文档内容
    await document.update({
      content: restoredContent,
      updatedAt: new Date()
    });

    // 创建新的版本记录（回退操作）
    const newVersion = await createVersion(documentId, restoredContent, userId)

    res.json({
      code: 200,
      message: '版本回退成功',
      data: {
        documentId,
        rollbackToVersion: parseInt(versionNumber),
        newVersionNumber: newVersion.versionNumber,
        content: restoredContent,
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

    // 软删除版本，为了统计历史版本数
    await version.update({ isActive: false })

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


// 对比两个版本
const compareVersions = async (req, res) => {
  try {
    const { documentId, versionNumber1, versionNumber2 } = req.params

    // 获取完整内容（无论基线还是增量）
    const version1 = await DocumentVersion.findOne({
      where: { documentId, versionNumber: versionNumber1, isActive: true }
    })
    const version2 = await DocumentVersion.findOne({
      where: { documentId, versionNumber: versionNumber2, isActive: true }
    })

    if (!version1 || !version2) {
      return res.status(404).json({ code: 404, message: '一个或两个版本不存在' })
    }

    // 获取完整内容
    const content1 = version1.content
      ? version1.content
      : await restoreVersionContent(documentId, versionNumber1)
    const content2 = version2.content
      ? version2.content
      : await restoreVersionContent(documentId, versionNumber2)

    let json1, json2
    try {
      json1 = JSON.parse(content1)
    } catch (e) {
      json1 = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content1 }] }] }
    }
    try {
      json2 = JSON.parse(content2)
    } catch (e) {
      json2 = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content2 }] }] }
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
};

// LCS算法，返回公共索引对
function lcs(a, b, eq) {
  const m = a.length, n = b.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (eq(a[i], b[j])) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  // 回溯LCS索引
  let i = 0, j = 0, res = [];
  while (i < m && j < n) {
    if (eq(a[i], b[j])) {
      res.push([i, j]);
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return res;
}

// 对 content 数组做 diff，支持插入/移动识别
function diffContentArray(arr1, arr2) {
  // 判断节点是否相等（可根据 type、attrs、text 等自定义）
  const eq = (n1, n2) => {
    if (!n1 || !n2) return false;
    if (n1.type !== n2.type) return false;
    if (n1.type === 'text' && n2.type === 'text') {
      return n1.text === n2.text;
    }
    return JSON.stringify(n1.attrs || {}) === JSON.stringify(n2.attrs || {});
  };

  const lcsPairs = lcs(arr1, arr2, eq);
  let i1 = 0, i2 = 0, lcsIdx = 0, result = [];
  while (i1 < arr1.length || i2 < arr2.length) {
    if (lcsIdx < lcsPairs.length && i1 === lcsPairs[lcsIdx][0] && i2 === lcsPairs[lcsIdx][1]) {
      // 公共部分递归diff
      const diffed = diffNodes(arr1[i1], arr2[i2]);
      if (Array.isArray(diffed)) {
        result.push(...diffed);
      } else if (diffed) {
        result.push(diffed);
      }
      i1++; i2++; lcsIdx++;
    } else {
      if (lcsIdx < lcsPairs.length && i1 < lcsPairs[lcsIdx][0]) {
        // arr1中多余，删除
        result.push({ ...arr1[i1], marks: [...(arr1[i1].marks || []), { type: 'remove' }] });
        i1++;
      } else if (lcsIdx < lcsPairs.length && i2 < lcsPairs[lcsIdx][1]) {
        // arr2中多余，新增
        result.push({ ...arr2[i2], marks: [...(arr2[i2].marks || []), { type: 'add' }] });
        i2++;
      } else {
        // 剩余部分
        if (i1 < arr1.length) {
          result.push({ ...arr1[i1], marks: [...(arr1[i1].marks || []), { type: 'remove' }] });
          i1++;
        }
        if (i2 < arr2.length) {
          result.push({ ...arr2[i2], marks: [...(arr2[i2].marks || []), { type: 'add' }] });
          i2++;
        }
      }
    }
  }

  return result;
}


function markAll(node, type) {
  if (!node) return null
  const newNode = { ...node }
  newNode.marks = [...(newNode.marks || []), { type }]
  if (Array.isArray(newNode.content)) {
    newNode.content = newNode.content.map(child => markAll(child, type))
  }
  return newNode
}

function diffNodes(node1, node2) {
  if (!node1 && !node2) return null
  if (!node1) return markAll(node2, 'add')
  if (!node2) return markAll(node1, 'remove')

  if (node1.type !== node2.type) {
    return [
      markAll(node1, 'remove'),
      markAll(node2, 'add')
    ]
  }

  if (node1.type === 'text' && node2.type === 'text') {
    const textEqual = (node1.text || '') === (node2.text || '')
    const marksEqual = JSON.stringify(node1.marks || []) === JSON.stringify(node2.marks || [])
    if (textEqual && !marksEqual) {
      // 样式不同，全部标记为删除和新增
      return [
        markAll(node1, 'remove'),
        markAll(node2, 'add')
      ]
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

  // 递归对比子节点，使用LCS优化,避免只有顺序变化却加上mark
  if (Array.isArray(node1.content) && Array.isArray(node2.content)) {
    return { ...node1, content: diffContentArray(node1.content, node2.content) }
  }

  // 结构相同但没有content，直接返回node2
  return node2
}


// 恢复版本内容
// 从基线版本开始，依次应用增量diff，直到目标版本

async function restoreVersionContent(documentId, versionNumber) {
  // 从数据库中查找 <= versionNumber 的最新基线版本（isFull = true）
  // 这样避免逐条回溯所有diff，可以从最近完整版本开始还原
  const baselineVersion = await DocumentVersion.findOne({
    where: {
      documentId,
      versionNumber: { [Op.lte]: versionNumber },
      isFull: true
    },
    order: [['versionNumber', 'DESC']]  // 按版本号降序，取最新
  })
  if (!baselineVersion) throw new Error('未找到基线版本')

  // 确保基线版本的内容是字符串格式
  // 如果存储时已经是 JSON 字符串就直接用，否则需要 JSON.stringify 转换
  let contentStr = typeof baselineVersion.content === 'string'
    ? baselineVersion.content
    : JSON.stringify(baselineVersion.content, null, 0)

  // 当前版本号从基线开始
  let currentVersion = baselineVersion.versionNumber

  // 依次向上应用增量diff，直到目标versionNumber
  while (currentVersion < versionNumber) {
    // 查询下一个版本号
    const nextVersion = await DocumentVersion.findOne({
      where: { documentId, versionNumber: currentVersion + 1 }
    })
    if (!nextVersion) throw new Error('版本链断裂') 
    // 如果中间缺少某个版本就会导致无法正确还原

    // 如果该版本只存储了diff，则基于当前内容应用patch
    if (nextVersion.diff) {
      contentStr = JsDiff.applyPatch(contentStr, nextVersion.diff)
    } else if (nextVersion.content) {
      // 否则该版本是一个完整快照，直接替换
      contentStr = typeof nextVersion.content === 'string'
        ? nextVersion.content
        : JSON.stringify(nextVersion.content, null, 0)
    }

    // 继续到下一个版本号
    currentVersion++
  }

  // 返回还原后的完整文档内容（此处保留字符串）
  return contentStr
}



module.exports = {
  createVersion,
  getVersions,
  getVersionContent,
  rollbackVersion,
  deleteVersion,
  compareVersions
}