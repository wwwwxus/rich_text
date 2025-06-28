const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

// 创建文档
// POST /api/documents/create
router.post('/create', documentController.createDocument);

// 获取文档列表
// GET /api/documents/list/:knowledgeBaseId
// GET /api/documents/list/:knowledgeBaseId/:userId
router.get('/list/:knowledgeBaseId/:userId?', documentController.getDocumentList);

// 获取文档内容
// GET /api/documents/:documentId/:userId
router.get('/:documentId/:userId', documentController.getDocumentContent);

// 保存富文本
// POST /api/documents/save
router.post('/save', documentController.saveDocument);

// 删除文档
// DELETE /api/documents/:documentId/:userId
router.delete('/:documentId/:userId', documentController.deleteDocument);

module.exports = router; 