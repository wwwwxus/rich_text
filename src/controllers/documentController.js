const Document = require("../models/Document");
const TextComment = require("../models/TextComment");
const DocumentVersion = require("../models/DocumentVersion");
const User = require("../models/User");
const { createVersion } = require("./versionController");
const { Op } = require("sequelize");
const checkKnowledgeBaseAccess =
  require("./knowledgeBaseController").checkKnowledgeBaseAccess;

// 获取文档内容
const getDocumentContent = async (req, res) => {
  try {
    const userId = req.user.id; // 假设用户ID从请求中获取
    // 从请求参数中获取文档ID
    const { documentId } = req.params;

    const document = await Document.findOne({
      where: {
        id: documentId,
        isActive: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        code: 404,
        message: '文档不存在'
      });
    }

    // 检查用户是否有权限访问（拥有者或协作者）
    const hasAccess = await checkKnowledgeBaseAccess(
      userId,
      document.knowledgeBaseId
    );
    if (!hasAccess) {
      return res.status(403).json({
        code: 403,
        message: '没有权限访问此文档'
      });
    }

    res.json({
      code: 200,
      message: "获取文档内容成功",
      data: {
        id: document.id,
        title: document.title,
        content: document.content,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error('获取文档内容错误:', error, error.message, error.stack);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 保存富文本
const saveDocument = async (req, res) => {
  try {
    const userId = req.user.id; // 假设用户ID从请求中获取
    // 从请求体中获取文档ID和新内容
    const { documentId, newContent } = req.body;

    const document = await Document.findOne({
      where: {
        id: documentId,
        isActive: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        code: 404,
        message: '文档不存在'
      });
    }

    // 检查用户是否有权限编辑
    const hasAccess = await checkKnowledgeBaseAccess(
      userId,
      document.knowledgeBaseId
    );
    if (!hasAccess) {
      return res.status(403).json({
        code: 403,
        message: "没有权限访问此文档",
      });
    }

    // 更新文档内容
    await document.update({
      content: newContent,
      updatedAt: new Date(),
    });

    // 自动创建新版本
    const newVersion = await createVersion(documentId, newContent);

    res.json({
      code: 200,
      message: "文档保存成功",
      data: {
        documentId,
        versionNumber: newVersion.versionNumber,
        diff: newVersion.diff,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error("保存文档错误:", error);
    res.status(500).json({
      code: 500,
      message: "服务器内部错误",
    });
  }
};

// 删除文档
const deleteDocument = async (req, res) => {
  try {
    const userId = req.user.id; // 假设用户ID从请求中获取
    // 从请求参数中获取文档ID
    const { documentId } = req.params;

    const document = await Document.findOne({
      where: {
        id: documentId,
        isActive: true,
      },
    });

    console.log(document);

    if (!document) {
      return res.status(404).json({
        code: 404,
        message: "文档不存在",
      });
    }

    // 只有拥有者才能删除
    const hasAccess = await checkKnowledgeBaseAccess(
      userId,
      document.knowledgeBaseId
    );
    if (!hasAccess) {
      return res.status(403).json({
        code: 403,
        message: "没有权限删除此文档",
      });
    }
    console.log(111);
    console.log(document);

    // 软删除文档
    await document.update({ isActive: false });

    // 同时删除相关的文本评论和版本记录
    await TextComment.update({ isActive: false }, { where: { documentId } });

    await DocumentVersion.update(
      { isActive: false },
      { where: { documentId } }
    );

    res.json({
      code: 200,
      message: "文档删除成功",
    });
  } catch (error) {
    console.error("删除文档错误:", error);
    res.status(500).json({
      code: 500,
      message: "服务器内部错误",
    });
  }
};

// 创建文档
const createDocument = async (req, res) => {
  try {
    const { title, knowledgeBaseId, folderId } = req.body;

    // 验证必填参数
    if (!title || !knowledgeBaseId) {
      return res.status(400).json({
        code: 400,
        message: "标题和知识库ID为必填参数",
      });
    }

    //判断是否有权限创建文档
    const userId = req.user.id; // 假设用户ID从请求中获取

    const hasAccess = await checkKnowledgeBaseAccess(userId, knowledgeBaseId);
    if (!hasAccess) {
      return res.status(403).json({
        code: 403,
        message: "没有权限创建文档",
      });
    }

    // 创建文档
    const document = await Document.create({
      title,
      content: "",
      knowledgeBaseId,
      folderId: folderId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 创建初始版本记录
    await DocumentVersion.create({
      documentId: document.id,
      versionNumber: 1,
      content: "",
      diff: "初始版本",
      savedAt: new Date(),
    });

    res.status(200).json({
      code: 200,
      message: "文档创建成功",
      data: {
        id: document.id,
        title: document.title,
        content: document.content,
        knowledgeBaseId: document.knowledgeBaseId,
        folderId: document.folderId,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error("创建文档错误:", error);
    res.status(500).json({
      code: 500,
      message: "服务器内部错误",
    });
  }
};

// 获取文档列表
// const getDocumentList = async (req, res) => {
//   try {
//     const { knowledgeBaseId, userId } = req.params;

//     // 构建查询条件
//     const whereCondition = {
//       knowledgeBaseId: parseInt(knowledgeBaseId),
//       isActive: true,
//     };

//     // 如果指定了用户ID，只返回该用户有权限的文档
//     if (userId) {
//       whereCondition.ownerId = parseInt(userId);
//     }

//     const documents = await Document.findAll({
//       where: whereCondition,
//       include: [
//         {
//           model: User,
//           as: "owner",
//           attributes: ["id", "username"],
//         },
//       ],
//       order: [["updatedAt", "DESC"]],
//     });

module.exports = {
  getDocumentContent,
  deleteDocument,
  createDocument,
  // getDocumentList,
};
