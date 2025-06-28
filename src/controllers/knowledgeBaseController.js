const KnowledgeBase = require("../models/KnowledgeBase");
const Collaboration = require("../models/Collaboration");
const Folder = require("../models/Folder");
const Document = require("../models/Document");
const RecentAccess = require("../models/RecentAccess");
const User = require("../models/User");
const { Op, fn, col } = require("sequelize");

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
      code: 200,
      message: "操作成功",
      data: accessibleList,
    });
  } catch (error) {
    console.error("获取可访问知识库失败:", error);
    res.status(200).json({
      code: 500,
      message: "获取可访问知识库失败",
      data: null,
    });
  }
};

// 根据知识库id获取知识库信息(名字id和协作人），第一层内部文档和文件夹
const getKnowledgeBaseContent = async (req, res) => {
  try {
    const { knowledgeBaseId } = req.params;
    const userId = req.user.id;

    // 检查用户是否有权限访问该知识库
    const hasAccess = await checkKnowledgeBaseAccess(userId, knowledgeBaseId);
    if (!hasAccess) {
      return res.status(403).json({
        code: 403,
        message: "没有权限访问该知识库",
        data: null,
      });
    }
    //知识库信息
    const knowledgeBase = await KnowledgeBase.findOne({
      where: { id: knowledgeBaseId, isActive: true },
      attributes: ["id", "name", "description"],
    });

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
        knowledgeBaseId,
        folderId: null,
        isActive: true,
      },
      attributes: ["id", "title"],
    });

    //获取协作人
    const collaborators = await Collaboration.findAll({
      where: {
        knowledgeBaseId,
      },
      attributes: ["userId"],
    });

    // 更新最近访问记录
    await updateRecentAccess(userId, knowledgeBaseId);

    res.json({
      code: 200,
      message: "操作成功",
      data: {
        documents: documents.map((doc) => ({ id: doc.id, title: doc.title })),
        folders: folders.map((folder) => ({
          id: folder.id,
          name: folder.name,
        })),
        knowledgeBaseInfo: {
          id: knowledgeBase.id,
          name: knowledgeBase.name,
          desc: knowledgeBase.description,
          collaborators: collaborators.map((ele) => ele.userId),
        },
      },
    });
  } catch (error) {
    console.error("获取知识库内容失败:", error);
    res.status(200).json({
      code: 500,
      message: "获取知识库内容失败",
      data: null,
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
        code: 400,
        message: "知识库名称不能为空",
        data: null,
      });
    }

    const knowledgeBase = await KnowledgeBase.create({
      name,
      description,
      ownerId: userId,
    });

    res.status(200).json({
      code: 200,
      message: "知识库创建成功",
      data: knowledgeBase,
    });
  } catch (error) {
    console.error("创建知识库失败:", error);
    res.status(200).json({
      code: 500,
      message: "创建知识库失败",
      data: null,
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
      return res.status(200).json({
        code: 404,
        message: "知识库不存在或无权限删除",
        data: null,
      });
    }

    // 软删除
    await knowledgeBase.update({ isActive: false });

    res.json({
      code: 200,
      message: "知识库删除成功",
      data: null,
    });
  } catch (error) {
    console.error("删除知识库失败:", error);
    res.status(200).json({
      code: 500,
      message: "删除知识库失败",
      data: null,
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
      return res.status(200).json({
        code: 404,
        message: "知识库不存在或无权限编辑",
        data: null,
      });
    }

    await knowledgeBase.update({
      name: name || knowledgeBase.name,
      description:
        description !== undefined ? description : knowledgeBase.description,
    });

    res.json({
      code: 200,
      message: "知识库信息更新成功",
      data: knowledgeBase,
    });
  } catch (error) {
    console.error("更新知识库失败:", error);
    res.status(200).json({
      code: 500,
      message: "更新知识库失败",
      data: null,
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
      return res.status(200).json({
        code: 404,
        message: "用户不存在",
      });
    }

    // 检查是否已经存在协作关系
    const existingCollaboration = await Collaboration.findOne({
      where: { userId: userId, knowledgeBaseId: knowledgeBaseId },
    });

    if (existingCollaboration || invitedUser.id === knowledgeBase.ownerId) {
      return res.status(200).json({
        code: 400,
        message: "该用户已经是协作者",
      });
    }

    // 创建协作关系，使用传入的权限，默认为'read'
    await Collaboration.create({
      userId: userId,
      knowledgeBaseId: knowledgeBaseId,
      permission: permission || "read",
    });

    res.status(200).json({
      code: 200,
      message: "邀请协作成功",
    });
  } catch (error) {
    console.error("邀请协作失败:", error);
    res.status(500).json({
      code: 500,
      message: "邀请协作失败",
    });
  }
};

// 获取最近访问的知识库列表
const getRecentKnowledgeBases = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = 5;

    // 步骤1: 获取唯一的、按最新访问时间排序的知识库ID
    const recentAccesses = await RecentAccess.findAll({
      where: { userId },
      attributes: [
        "knowledgeBaseId",
        [fn("MAX", col("lastAccessedAt")), "maxLastAccessedAt"],
      ],
      group: ["knowledgeBaseId"],
      order: [[col("maxLastAccessedAt"), "DESC"]],
      limit: limit,
    });

    const recentKBIds = recentAccesses.map((access) => access.knowledgeBaseId);

    if (recentKBIds.length === 0) {
      return res.json({
        code: 200,
        message: "操作成功",
        data: [],
      });
    }

    // 步骤2: 根据ID获取知识库详情
    const knowledgeBases = await KnowledgeBase.findAll({
      where: {
        id: { [Op.in]: recentKBIds },
        isActive: true,
      },
      attributes: ["id", "name", "description"],
    });

    // 将知识库详情映射到其ID，方便查找
    const kbMap = new Map(knowledgeBases.map((kb) => [kb.id, kb]));

    // 组合数据，附加访问时间
    const result = recentAccesses
      .map((access) => {
        const knowledgeBase = kbMap.get(access.knowledgeBaseId);
        if (knowledgeBase) {
          return {
            id: knowledgeBase.id,
            name: knowledgeBase.name,
            description: knowledgeBase.description,
            // 使用 .get() 来获取聚合查询的别名(alias)字段
            lastAccessedAt: access.get("maxLastAccessedAt"),
          };
        }
        return null;
      })
      .filter((kb) => kb); // 过滤掉无效结果

    res.json({
      code: 200,
      message: "操作成功",
      data: result,
    });
  } catch (error) {
    console.error("获取最近访问失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取最近访问失败",
      data: null,
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
