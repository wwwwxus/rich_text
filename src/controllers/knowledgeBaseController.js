const KnowledgeBase = require("../models/KnowledgeBase");
const Collaboration = require("../models/Collaboration");
const Folder = require("../models/Folder");
const Document = require("../models/Document");
const RecentAccess = require("../models/RecentAccess");
const User = require("../models/User");
const { Op } = require("sequelize");

// 获取可访问的知识库信息
const getAccessibleKnowledgeBases = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户拥有的知识库
    const ownedKBs = await KnowledgeBase.findAll({
      where: { ownerId: userId, isActive: true },
      attributes: ["id", "name", "description"],
    });

    // 获取用户协作的知识库及权限
    const collaboratedKBs = await Collaboration.findAll({
      where: { userId: userId },
      attributes: ["knowledgeBaseId", "permission"],
    });

    // 获取协作的知识库详情
    const collaboratedKBIds = collaboratedKBs.map(
      (collab) => collab.knowledgeBaseId
    );
    const collaboratedKBDetails = await KnowledgeBase.findAll({
      where: {
        id: { [Op.in]: collaboratedKBIds },
        isActive: true,
      },
      attributes: ["id", "name", "description"],
    });

    // 合并结果，带上权限
    const accessibleList = [
      ...ownedKBs.map((kb) => ({
        id: kb.id,
        name: kb.name,
        description: kb.description,
        permission: "owner",
      })),
      ...collaboratedKBDetails.map((kb) => {
        const collab = collaboratedKBs.find((c) => c.knowledgeBaseId === kb.id);
        return {
          id: kb.id,
          name: kb.name,
          description: kb.description,
          permission: collab ? collab.permission : "read",
        };
      }),
    ];

    res.json({
      success: true,
      data: accessibleList,
    });
  } catch (error) {
    console.error("获取可访问知识库失败:", error);
    res.status(500).json({
      success: false,
      message: "获取可访问知识库失败",
    });
  }
};

// 根据知识库id获取第一层内部文档和文件夹
const getKnowledgeBaseContent = async (req, res) => {
  try {
    const { knowledgeBaseId } = req.params;
    const userId = req.user.id;

    // 检查用户是否有权限访问该知识库
    const hasAccess = await checkKnowledgeBaseAccess(userId, knowledgeBaseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "没有权限访问该知识库",
      });
    }

    // 获取第一层文件夹（parentFolderId为null），返回id和name
    const folders = await Folder.findAll({
      where: {
        knowledgeBaseId: knowledgeBaseId,
        parentFolderId: null,
        isActive: true,
      },
      attributes: ["id", "name"],
    });

    // 获取第一层文档（folderId为null），返回id和name
    const documents = await Document.findAll({
      where: {
        knowledgeBaseId: knowledgeBaseId,
        folderId: null,
        isActive: true,
      },
      attributes: ["id", "title"],
    });

    // 更新最近访问记录
    await updateRecentAccess(userId, knowledgeBaseId);

    res.json({
      success: true,
      data: {
        documents: documents.map((doc) => ({ id: doc.id, title: doc.title })),
        folders: folders.map((folder) => ({
          id: folder.id,
          name: folder.name,
        })),
      },
    });
  } catch (error) {
    console.error("获取知识库内容失败:", error);
    res.status(500).json({
      success: false,
      message: "获取知识库内容失败",
    });
  }
};

// 创建知识库
const createKnowledgeBase = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "知识库名称不能为空",
      });
    }

    const knowledgeBase = await KnowledgeBase.create({
      name,
      description,
      ownerId: userId,
    });

    res.status(201).json({
      success: true,
      data: knowledgeBase,
      message: "知识库创建成功",
    });
  } catch (error) {
    console.error("创建知识库失败:", error);
    res.status(500).json({
      success: false,
      message: "创建知识库失败",
    });
  }
};

// 删除知识库
const deleteKnowledgeBase = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查是否为知识库所有者
    const knowledgeBase = await KnowledgeBase.findOne({
      where: { id: id, ownerId: userId, isActive: true },
    });

    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: "知识库不存在或无权限删除",
      });
    }

    // 软删除
    await knowledgeBase.update({ isActive: false });

    res.json({
      success: true,
      message: "知识库删除成功",
    });
  } catch (error) {
    console.error("删除知识库失败:", error);
    res.status(500).json({
      success: false,
      message: "删除知识库失败",
    });
  }
};

// 编辑知识库信息
const updateKnowledgeBase = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    // 检查是否为知识库所有者
    const knowledgeBase = await KnowledgeBase.findOne({
      where: { id: id, ownerId: userId, isActive: true },
    });

    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: "知识库不存在或无权限编辑",
      });
    }

    await knowledgeBase.update({
      name: name || knowledgeBase.name,
      description:
        description !== undefined ? description : knowledgeBase.description,
    });

    res.json({
      success: true,
      data: knowledgeBase,
      message: "知识库信息更新成功",
    });
  } catch (error) {
    console.error("更新知识库失败:", error);
    res.status(500).json({
      success: false,
      message: "更新知识库失败",
    });
  }
};

// 邀请协作
// const inviteCollaboration = async (req, res) => {
//   try {
//     const { email, knowledgeBaseId, permission } = req.body; // 新增 permission
//     const currentUserId = req.user.id;

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: "邮箱参数不能为空",
//       });
//     }

//     // 检查是否为知识库所有者
//     const knowledgeBase = await KnowledgeBase.findOne({
//       where: { id: knowledgeBaseId, ownerId: currentUserId, isActive: true },
//     });

//     if (!knowledgeBase) {
//       return res.status(404).json({
//         success: false,
//         message: "知识库不存在或无权限邀请",
//       });
//     }

//     // 检查被邀请用户是否存在
//     const invitedUser = await User.findOne({
//       where: {
//         email: email,
//         isActive: true,
//       },
//       attributes: ["id", "username", "email"],
//     });

//     if (!invitedUser) {
//       return res.status(404).json({
//         success: false,
//         message: "用户不存在",
//       });
//     }

//     // 检查是否已经存在协作关系
//     const existingCollaboration = await Collaboration.findOne({
//       where: { userId: invitedUser.id, knowledgeBaseId: knowledgeBaseId },
//     });

//     if (existingCollaboration) {
//       return res.status(400).json({
//         success: false,
//         message: "该用户已经是协作者",
//       });
//     }

//     // 创建协作关系，使用传入的权限，默认为'read'
//     await Collaboration.create({
//       userId: invitedUser.id,
//       knowledgeBaseId: knowledgeBaseId,
//       permission: permission || "read",
//     });

//     res.status(201).json({
//       success: true,
//       message: "邀请协作成功",
//     });
//   } catch (error) {
//     console.error("邀请协作失败:", error);
//     res.status(500).json({
//       success: false,
//       message: "邀请协作失败",
//     });
//   }
// };

const inviteCollaboration = async (req, res) => {
  try {
    const { userId, knowledgeBaseId, permission } = req.body; // 新增 permission
    const currentUserId = req.user.id;
    // 检查是否为知识库所有者
    const knowledgeBase = await KnowledgeBase.findOne({
      where: { id: knowledgeBaseId, ownerId: currentUserId, isActive: true },
    });

    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: "知识库不存在或无权限邀请",
      });
    }

    // 检查被邀请用户是否存在
    const invitedUser = await User.findOne({
      where: { id: userId, isActive: true },
    });

    if (!invitedUser) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
      });
    }

    // 检查是否已经存在协作关系
    const existingCollaboration = await Collaboration.findOne({
      where: { userId: userId, knowledgeBaseId: knowledgeBaseId },
    });

    if (existingCollaboration) {
      return res.status(400).json({
        success: false,
        message: "该用户已经是协作者",
      });
    }

    // 创建协作关系，使用传入的权限，默认为'read'
    await Collaboration.create({
      userId: userId,
      knowledgeBaseId: knowledgeBaseId,
      permission: permission || "read",
    });

    res.status(201).json({
      success: true,
      message: "邀请协作成功",
    });
  } catch (error) {
    console.error("邀请协作失败:", error);
    res.status(500).json({
      success: false,
      message: "邀请协作失败",
    });
  }
};

// 获取最近访问的知识库
const getRecentKnowledgeBases = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5; // 默认返回5条

    // 获取最近访问记录，按访问时间倒序排列
    const recentAccesses = await RecentAccess.findAll({
      where: { userId: userId },
      order: [["lastAccessedAt", "DESC"]],
      limit: limit,
      include: [
        {
          model: KnowledgeBase,
          where: { isActive: true },
          attributes: ["id", "name", "description"],
        },
      ],
    });

    // 处理数据，只返回有效的知识库信息
    const validRecentKBs = [];
    for (const access of recentAccesses) {
      if (access.KnowledgeBase) {
        // 检查用户是否仍有访问权限
        const hasAccess = await checkKnowledgeBaseAccess(
          userId,
          access.knowledgeBaseId
        );
        if (hasAccess) {
          // 获取权限信息
          let permission = "read";
          const owned = await KnowledgeBase.findOne({
            where: {
              id: access.knowledgeBaseId,
              ownerId: userId,
              isActive: true,
            },
          });

          if (owned) {
            permission = "owner";
          } else {
            const collab = await Collaboration.findOne({
              where: {
                userId: userId,
                knowledgeBaseId: access.knowledgeBaseId,
              },
            });
            if (collab) {
              permission = collab.permission;
            }
          }

          validRecentKBs.push({
            id: access.KnowledgeBase.id,
            name: access.KnowledgeBase.name,
            description: access.KnowledgeBase.description,
            permission: permission,
            lastAccessedAt: access.lastAccessedAt,
          });
        }
      }
    }

    res.json({
      success: true,
      data: validRecentKBs,
    });
  } catch (error) {
    console.error("获取最近访问知识库失败:", error);
    res.status(500).json({
      success: false,
      message: "获取最近访问知识库失败",
    });
  }
};

// 最近打开的知识库
const updateRecentAccess = async (userId, knowledgeBaseId) => {
  try {
    await RecentAccess.upsert({
      userId: userId,
      knowledgeBaseId: knowledgeBaseId,
      lastAccessedAt: new Date(),
    });
  } catch (error) {
    console.error("更新最近访问记录失败:", error);
  }
};

// 检查用户是否有权限访问知识库
const checkKnowledgeBaseAccess = async (userId, knowledgeBaseId) => {
  try {
    // 检查是否为所有者
    const owned = await KnowledgeBase.findOne({
      where: { id: knowledgeBaseId, ownerId: userId, isActive: true },
    });

    if (owned) return true;

    // 检查是否为协作者
    const collaborated = await Collaboration.findOne({
      where: { userId: userId, knowledgeBaseId: knowledgeBaseId },
    });

    if (collaborated) {
      // 检查知识库是否仍然存在且活跃
      const knowledgeBase = await KnowledgeBase.findOne({
        where: { id: knowledgeBaseId, isActive: true },
      });
      return !!knowledgeBase;
    }

    return false;
  } catch (error) {
    console.error("检查知识库访问权限失败:", error);
    return false;
  }
};

module.exports = {
  getAccessibleKnowledgeBases,
  getKnowledgeBaseContent,
  createKnowledgeBase,
  deleteKnowledgeBase,
  updateKnowledgeBase,
  inviteCollaboration,
  getRecentKnowledgeBases,
};
