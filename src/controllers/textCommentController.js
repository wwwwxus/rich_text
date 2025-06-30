const TextComment = require('../models/TextComment');
const User = require('../models/User');
const Document = require('../models/Document');

// 删除评论
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { textNanoid } = req.body; // 需要前端传递 textNanoid
    const userId = req.user.id; // 从 token 获取

    const comment = await TextComment.findOne({
      where: {
        id: commentId,
        isActive: true
      }
    });

    if (!comment) {
      return res.status(404).json({ 
        code: 404,
        message: '评论不存在' 
      });
    }

    // 只有评论发布者才能删除
    if (comment.userId !== parseInt(userId)) {
      return res.status(403).json({ 
        code: 403,
        message: '只能删除自己发布的评论' 
      });
    }

    // 软删除评论
    await comment.update({ isActive: false });

    // 查询剩余评论条数
    const remainCount = await TextComment.count({
      where: {
        textNanoid: textNanoid || comment.textNanoid,
        isActive: true
      }
    });

    res.json({
      code: 200,
      message: '评论删除成功',
      remainCount // 剩余评论条数
    });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器内部错误' 
    });
  }
};

// 选中文本评论
const addTextComment = async (req, res) => {
  try {
    const { textNanoid, comment, documentId } = req.body;
    const userId = req.user.id; // 从 token 获取

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

    // 验证用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        code: 404,
        message: '用户不存在' 
      });
    }

    // 创建文本评论
    const newComment = await TextComment.create({
      textNanoid,
      comment,
      userId,
      documentId
    });

    res.json({
      code: 200,
      message: '文本评论添加成功',
      data: {
        id: newComment.id,
        textNanoid: newComment.textNanoid,
        comment: newComment.comment,
        userId: newComment.userId,
        documentId: newComment.documentId,
        createdAt: newComment.createdAt
      }
    });
  } catch (error) {
    console.error('添加文本评论错误:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器内部错误' 
    });
  }
};

// 获取文本评论
const getTextComments = async (req, res) => {
  try {
    const { textNanoid } = req.params;

    const comments = await TextComment.findAll({
      where: {
        textNanoid,
        isActive: true
      },
      include: [
        {
          model: User,
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      comment: comment.comment,
      userId: comment.userId,
      username: comment.User?.username,
      createdAt: comment.createdAt
    }));

    res.json({
      code: 200,
      message: '获取文本评论成功',
      data: formattedComments
    });
  } catch (error) {
    console.error('获取文本评论错误:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器内部错误' 
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
        isActive: true
      },
      include: [
        {
          model: User,
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      textNanoid: comment.textNanoid,
      comment: comment.comment,
      userId: comment.userId,
      username: comment.User?.username,
      createdAt: comment.createdAt
    }));

    res.json({
      code: 200,
      message: '获取文档文本评论成功',
      data: formattedComments
    });
  } catch (error) {
    console.error('获取文档文本评论错误:', error);
    res.status(500).json({ 
      code: 500,
      message: '服务器内部错误' 
    });
  }
};

module.exports = {
  deleteComment,
  addTextComment,
  getTextComments,
  getDocumentTextComments
};