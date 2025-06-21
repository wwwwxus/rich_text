const { Op } = require('sequelize');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// 注册新用户
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const userExists = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 创建新用户
    const user = await User.create({
      username,
      email,
      password
    });

    // 生成 token
    const token = generateToken(user.id);

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      token
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 验证密码
    const isMatch = await user.validatePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 生成 token
    const token = generateToken(user.id);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      token
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 获取当前用户信息
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 根据邮箱搜索用户（以便添加协作）
const searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: '邮箱参数不能为空'
      });
    }
    
    const user = await User.findOne({
      where: { 
        email: email,
        isActive: true
      },
      attributes: ['id', 'username', 'email']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索用户失败'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  searchUserByEmail
}; 