const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");
const auth = require("../middleware/auth");

// 所有路由都需要认证
router.use(auth);

// 创建文档
// POST /api/documents/create
router.post("/create", documentController.createDocument);

// 获取文档列表
// GET /api/documents/list/:knowledgeBaseId
// GET /api/documents/list/:knowledgeBaseId/:userId
// router.get(
//   "/list/:knowledgeBaseId/:userId?",
//   documentController.getDocumentList
// );

// 获取文档内容
// GET /api/documents/:documentId
router.get("/:documentId", documentController.getDocumentContent);

// 保存富文本
// POST /api/documents/save
router.post("/save", documentController.saveDocument);

// 删除文档
// DELETE /api/documents/:documentId
router.delete("/:documentId", documentController.deleteDocument);

module.exports = router;
