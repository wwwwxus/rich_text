const express = require('express');
const router = express.Router();
const versionController = require('../controllers/versionController');

// 查看版本列表
// GET /api/versions/:documentId
router.get('/:documentId', versionController.getVersions);

// 获取特定版本内容
// GET /api/versions/:documentId/:versionNumber
router.get('/:documentId/:versionNumber', versionController.getVersionContent);

// 回退版本
// POST /api/versions/:documentId/:versionNumber/rollback
const auth = require('../middleware/auth');
router.post('/:documentId/:versionNumber/rollback', auth, versionController.rollbackVersion);

// 删除版本
// DELETE /api/versions/:documentId/:versionNumber
router.delete('/:documentId/:versionNumber', auth, versionController.deleteVersion);
module.exports = router; 