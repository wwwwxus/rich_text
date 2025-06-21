const express = require('express');
const router = express.Router();
const knowledgeBaseController = require('../controllers/knowledgeBaseController');
const auth = require('../middleware/auth');

// 所有路由都需要认证
router.use(auth);

// 获取可访问的知识库信息
router.get('/accessible', knowledgeBaseController.getAccessibleKnowledgeBases);

// 根据知识库id获取第一层内部文档和文件夹
router.get('/:knowledgeBaseId/content', knowledgeBaseController.getKnowledgeBaseContent);

// 创建知识库
router.post('/', knowledgeBaseController.createKnowledgeBase);

// 删除知识库
router.delete('/:id', knowledgeBaseController.deleteKnowledgeBase);

// 编辑知识库信息
router.put('/:id', knowledgeBaseController.updateKnowledgeBase);

// 邀请协作
router.post('/invite', knowledgeBaseController.inviteCollaboration);

module.exports = router; 