const TextComment = require("../models/TextComment");
const User = require("../models/User");
const Document = require("../models/Document");
const Collaboration = require("../models/Collaboration");
const KnowledgeBase = require("../models/KnowledgeBase");

// 删除评论
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id; // 从 token 获取

    const comment = await TextComment.findOne({
      where: {
        id: commentId,
        isActive: true,
      },
    });

    if (!comment) {
      return res.status(404).json({
        code: 404,
        message: "评论不存在",
      });
    }

    // 只有评论发布者才能删除
    if (comment.userId !== parseInt(userId)) {
      return res.status(403).json({
        code: 403,
        message: "只能删除自己发布的评论",
      });
    }

    // 软删除评论
    await comment.update({ isActive: false });

    res.json({
      code: 200,
      message: '评论删除成功',
    });
  } catch (error) {
    console.error("删除评论错误:", error);
    res.status(500).json({
      code: 500,
      message: "服务器内部错误",
    });
  }
};

// 选中文本评论
const addTextComment = async (req, res) => {
  try {
    const { textNanoid, comment, documentId, parentId } = req.body;
    const userId = req.user.id; // 从 token 获取
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
    // 校验用户是否为知识库协作者或拥有者
    const knowledgeBaseId = document.knowledgeBaseId;
    const knowledgeBase = await KnowledgeBase.findOne({ where: { id: knowledgeBaseId } });
    const isOwner = knowledgeBase && knowledgeBase.ownerId === userId;
    const isCollaborator = await Collaboration.findOne({
      where: {
        userId,
        knowledgeBaseId,
      },
    });
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        code: 403,
        message: "只有知识库协作者或拥有者可以评论",
      });
    }
    // 验证用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "用户不存在",
      });
    }
    // 创建文本评论
    const newComment = await TextComment.create({
      textNanoid,
      comment,
      userId,
      documentId,
      parentId: parentId || null,
    });
    res.json({
      code: 200,
      message: "文本评论添加成功",
      data: {
        id: newComment.id,
        textNanoid: newComment.textNanoid,
        comment: newComment.comment,
        userId: newComment.userId,
        documentId: newComment.documentId,
        parentId: newComment.parentId,
        createdAt: newComment.createdAt,
      },
    });
  } catch (error) {
    console.error("添加文本评论错误:", error);
    res.status(500).json({
      code: 500,
      message: "服务器内部错误",
    });
  }
};

function buildCommentTree(comments) {
  const map = {};
  const roots = [];
  comments.forEach(comment => {
    map[comment.id] = { ...comment, children: [] };
  });
  comments.forEach(comment => {
    if (comment.parentId) {
      if (map[comment.parentId]) {
        map[comment.parentId].children.push(map[comment.id]);
      }
    } else {
      roots.push(map[comment.id]);
    }
  });
  return roots;
}

// 获取文本评论
const getTextComments = async (req, res) => {
  try {
    const { textNanoid } = req.params;
    const comments = await TextComment.findAll({
      where: {
        textNanoid,
        isActive: true,
      },
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      comment: comment.comment,
      userId: comment.userId,
      username: comment.User?.username,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
    }));
    const tree = buildCommentTree(formattedComments);
    res.json({
      code: 200,
      message: "获取文本评论成功",
      data: tree,
    });
  } catch (error) {
    console.error("获取文本评论错误:", error);
    res.status(500).json({
      code: 500,
      message: "服务器内部错误",
    });
  }
};

// 获取文档的所有文本评论
const getDocumentTextComments = async (req, res) => {
  try {
    const { documentId } = req.params;
    const comments = await TextComment.findAll({
      where: {
        documentId,
        isActive: true,
      },
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      textNanoid: comment.textNanoid,
      comment: comment.comment,
      userId: comment.userId,
      username: comment.User?.username,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
    }));
    const tree = buildCommentTree(formattedComments);
    res.json({
      code: 200,
      message: "获取文档文本评论成功",
      data: tree,
    });
  } catch (error) {
    console.error("获取文档文本评论错误:", error);
    res.status(500).json({
      code: 500,
      message: "服务器内部错误",
    });
  }
};

module.exports = {
  deleteComment,
  addTextComment,
  getTextComments,
  getDocumentTextComments
};