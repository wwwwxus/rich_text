const { Op } = require("sequelize");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Collaboration = require("../models/Collaboration");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// 注册新用户
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查邮箱是否已存在
    const emailExists = await User.findOne({ where: { email } });

    if (emailExists) {
      return res.status(200).json({
        code: 400,
        message: "该邮箱已被注册",
        data: null,
      });
    }

    // 创建新用户
    const user = await User.create({
      username,
      email,
      password,
    });

    // 生成 token
    const token = generateToken(user.id);

    res.status(200).json({
      code: 200,
      message: "注册成功",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    res.status(200).json({
      code: 400,
      message: error.message,
      data: null,
    });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(200).json({
        code: 401,
        message: "用户不存在",
        data: null,
      });
    }

    // 验证密码
    const isMatch = await user.validatePassword(password);

    if (!isMatch) {
      return res.status(200).json({
        code: 401,
        message: "密码不正确",
        data: null,
      });
    }

    // 生成 token
    const token = generateToken(user.id);

    res.json({
      code: 200,
      message: "登录成功",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    res.status(200).json({
      code: 400,
      message: error.message,
      data: null,
    });
  }
};

// 获取当前用户信息
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    res.json({
      code: 200,
      message: "获取成功",
      data: user,
    });
  } catch (error) {
    res.status(200).json({
      code: 400,
      message: error.message,
      data: null,
    });
  }
};

// 根据邮箱搜索用户（以便添加协作）
const searchUserByEmail = async (req, res) => {
  try {
    const { email, knowledgeBaseId } = req.query;
    if (!email || !knowledgeBaseId) {
      return res.status(200).json({
        code: 400,
        message: "邮箱和知识库ID参数不能为空",
        data: null,
      });
    }

    // 获取知识库ownerId
    const knowledgeBase = await require("../models/KnowledgeBase").findOne({
      where: { id: knowledgeBaseId },
      attributes: ["ownerId"],
    });
    if (!knowledgeBase) {
      return res.status(200).json({
        code: 404,
        message: "知识库不存在",
        data: null,
      });
    }
    const ownerId = knowledgeBase.ownerId;

    // 获取协作者userId列表
    const collaborations = await Collaboration.findAll({
      where: { knowledgeBaseId },
      attributes: ["userId"],
    });
    const collaboratorIds = collaborations.map((c) => c.userId);

    // 查询不是owner且不是协作者的用户
    const users = await User.findAll({
      where: {
        email: { [Op.like]: `%${email}%` },
        isActive: true,
        id: {
          [Op.notIn]: [ownerId, ...collaboratorIds, req.user.id], // 排除owner、协作者、自己
        },
      },
      attributes: ["id", "username"],
      limit: 3,
    });

    res.json({
      code: 200,
      message: "操作成功",
      data: users,
    });
  } catch (error) {
    console.error("搜索用户失败:", error);
    res.status(200).json({
      code: 500,
      message: "搜索用户失败",
      data: null,
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  searchUserByEmail,
};
