const express = require('express');
const router = express.Router();
const { register, login, getProfile, searchUserByEmail } = require('../controllers/userController');
const auth = require('../middleware/auth');

// 公开路由
router.post('/register', register);
router.post('/login', login);

// 需要认证的路由
router.get('/profile', auth, getProfile);
router.get('/search', auth, searchUserByEmail);

module.exports = router; 