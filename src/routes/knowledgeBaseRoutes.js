const express = require("express");
const router = express.Router();
const knowledgeBaseController = require("../controllers/knowledgeBaseController");
const auth = require("../middleware/auth");

// 所有路由都需要认证
router.use(auth);

// 获取可访问的知识库信息
router.get("/accessible", knowledgeBaseController.getAccessibleKnowledgeBases);

//判断用户是否可以访问该知识库
router.get(
  "/:knowledgeBaseId/auth",
  knowledgeBaseController.checkKnowledgeBaseAuth
);

// 获取最近访问的知识库
router.get("/recent", knowledgeBaseController.getRecentKnowledgeBases);

// 根据知识库id获取第一层内部文档和文件夹
router.get(
  "/:knowledgeBaseId/content",
  knowledgeBaseController.getKnowledgeBaseContent
);

// 获取知识库中所有文档ID（包括文件夹内的文档）
router.get(
  "/:knowledgeBaseId/documents/ids",
  knowledgeBaseController.getAllDocumentIds
);

// 创建知识库
router.post("/", knowledgeBaseController.createKnowledgeBase);

// 删除知识库
router.delete("/:id", knowledgeBaseController.deleteKnowledgeBase);

// 编辑知识库信息
router.put("/:id", knowledgeBaseController.updateKnowledgeBase);

// 邀请协作
router.post("/invite", knowledgeBaseController.inviteCollaboration);

//搜索文档文件夹
router.get(
  "/search/:knowledgeBaseId/:searchQuery",
  knowledgeBaseController.searchKnowledgeBaseContent
);

// 获取知识库所有用户权限信息
router.get(
  "/:knowledgeBaseId/permissions",
  knowledgeBaseController.getKnowledgeBasePermissions
);

// 删除知识库权限用户
router.delete(
  "/permissions/:knowledgeBaseId/:userId",
  knowledgeBaseController.removeKnowledgeBaseCollaborator
);

module.exports = router;
