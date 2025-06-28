const express = require('express');
const router = express.Router();
const textCommentController = require('../controllers/textCommentController');

// 选中文本评论
// POST /api/text-comments/add
router.post('/add', textCommentController.addTextComment);

// 获取文档的所有文本评论（更具体的路由放在前面）
// GET /api/text-comments/document/:documentId
router.get('/document/:documentId', textCommentController.getDocumentTextComments);

// 获取文本评论
// GET /api/text-comments/:textNanoid
router.get('/:textNanoid', textCommentController.getTextComments);

// 删除评论
// DELETE /api/text-comments/:commentId
router.delete('/:commentId', textCommentController.deleteComment);

module.exports = router; 