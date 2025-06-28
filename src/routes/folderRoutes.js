const express = require("express");
const router = express.Router();
const folderController = require("../controllers/folderController");
const auth = require("../middleware/auth");

// 所有路由都需要认证
router.use(auth);

// 根据文件夹id获取第一层文档和文件夹id
router.get("/:folderId/content", folderController.getFolderContent);

// 创建文件夹
router.post("/", folderController.createFolder);

// 删除文件夹
router.delete("/:id", folderController.deleteFolder);

// 编辑文件夹名称
router.put("/:id", folderController.updateFolderName);

// AI 文档摘要接口
router.post("/summary", folderController.generateSummary);

module.exports = router;
