const Folder = require("../models/Folder");
const Document = require("../models/Document");
const KnowledgeBase = require("../models/KnowledgeBase");
const Collaboration = require("../models/Collaboration");
const OpenAI = require("openai");

// 根据文件夹id获取第一层文档和文件夹id
const getFolderContent = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user.id;

    // 获取文件夹信息
    const folder = await Folder.findOne({
      where: { id: folderId, isActive: true },
    });

    if (!folder) {
      return res.status(200).json({
        code: 404,
        message: "文件夹不存在",
        data: null,
      });
    }
    console.log(folder);

    // 检查用户是否有权限访问该知识库
    const hasAccess = await checkKnowledgeBaseAccess(
      userId,
      folder.knowledgeBaseId
    );
    if (!hasAccess) {
      return res.status(200).json({
        code: 403,
        message: "没有权限访问该文件夹",
        data: null,
      });
    }

    // 获取第一层子文件夹
    const subFolders = await Folder.findAll({
      where: {
        parentFolderId: folderId,
        isActive: true,
      },
      attributes: ["id", "name"],
    });

    // 获取第一层文档
    const documents = await Document.findAll({
      where: {
        folderId: folderId,
        isActive: true,
      },
      attributes: ["id", "title"],
    });

    res.json({
      code: 200,
      message: "操作成功",
      data: {
        folders: subFolders.map((subFolder) => ({
          id: subFolder.id,
          name: subFolder.name,
        })),
        documents: documents.map((doc) => ({ id: doc.id, name: doc.title })),
      },
    });
  } catch (error) {
    console.error("获取文件夹内容失败:", error);
    res.status(200).json({
      code: 500,
      message: "获取文件夹内容失败",
      data: null,
    });
  }
};

// 创建文件夹
const createFolder = async (req, res) => {
  try {
    const { knowledgeBaseId, name, parentFolderId } = req.body; // 新增 parentFolderId
    const userId = req.user.id;

    if (!name || !knowledgeBaseId) {
      return res.status(200).json({
        code: 400,
        message: "文件夹名称和知识库ID不能为空",
        data: null,
      });
    }

    // 检查用户是否有权限在该知识库中创建文件夹
    const hasAccess = await checkKnowledgeBaseAccess(userId, knowledgeBaseId);
    if (!hasAccess) {
      return res.status(200).json({
        code: 403,
        message: "没有权限在该知识库中创建文件夹",
        data: null,
      });
    }

    // 如果有 parentFolderId，检查父文件夹是否存在且属于同一知识库
    if (parentFolderId) {
      const parentFolder = await Folder.findOne({
        where: { id: parentFolderId, isActive: true },
      });
      if (!parentFolder) {
        return res.status(200).json({
          code: 400,
          message: "父文件夹不存在",
          data: null,
        });
      }
      if (parentFolder.knowledgeBaseId !== knowledgeBaseId) {
        return res.status(200).json({
          code: 400,
          message: "父文件夹不属于当前知识库",
          data: null,
        });
      }
    }

    const folder = await Folder.create({
      name,
      knowledgeBaseId,
      parentFolderId: parentFolderId || null, // 支持根目录
    });

    res.status(200).json({
      code: 200,
      message: "文件夹创建成功",
      data: folder,
    });
  } catch (error) {
    console.error("创建文件夹失败:", error);
    res.status(200).json({
      code: 500,
      message: "创建文件夹失败",
      data: null,
    });
  }
};

// 删除文件夹
const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取文件夹信息
    const folder = await Folder.findOne({
      where: { id: id, isActive: true },
    });

    if (!folder) {
      return res.status(200).json({
        code: 404,
        message: "文件夹不存在",
        data: null,
      });
    }

    // 检查用户是否有权限删除该文件夹
    const hasAccess = await checkKnowledgeBaseAccess(
      userId,
      folder.knowledgeBaseId
    );
    if (!hasAccess) {
      return res.status(200).json({
        code: 403,
        message: "没有权限删除该文件夹",
        data: null,
      });
    }

    // 软删除文件夹
    await folder.update({ isActive: false });

    res.json({
      code: 200,
      message: "文件夹删除成功",
      data: null,
    });
  } catch (error) {
    console.error("删除文件夹失败:", error);
    res.status(200).json({
      code: 500,
      message: "删除文件夹失败",
      data: null,
    });
  }
};

// 编辑文件夹名称
const updateFolderName = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(200).json({
        code: 400,
        message: "文件夹名称不能为空",
        data: null,
      });
    }

    // 获取文件夹信息
    const folder = await Folder.findOne({
      where: { id: id, isActive: true },
    });

    if (!folder) {
      return res.status(200).json({
        code: 404,
        message: "文件夹不存在",
        data: null,
      });
    }

    // 检查用户是否有权限编辑该文件夹
    const hasAccess = await checkKnowledgeBaseAccess(
      userId,
      folder.knowledgeBaseId
    );
    if (!hasAccess) {
      return res.status(200).json({
        code: 403,
        message: "没有权限编辑该文件夹",
        data: null,
      });
    }

    await folder.update({ name });

    res.json({
      code: 200,
      message: "文件夹名称更新成功",
      data: folder,
    });
  } catch (error) {
    console.error("更新文件夹名称失败:", error);
    res.status(200).json({
      code: 500,
      message: "更新文件夹名称失败",
      data: null,
    });
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

// AI 文档摘要接口
const generateSummary = async (req, res) => {
  try {
    const { documentText } = req.body;
    if (!documentText) {
      return res.status(200).json({
        code: 400,
        message: "文档内容不能为空",
        data: null,
      });
    }
    const openai = new OpenAI({
      apiKey: process.env.VOLC_ENGINE_API_KEY, // 从环境变量获取
      baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    });
    const response = await openai.chat.completions.create({
      model: "ep-20250627232809-8d2lz",
      messages: [
        {
          role: "user",
          content: `请对以下文档进行摘要，控制在300字内：\n${documentText}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 50,
    });
    const summary = response.choices?.[0]?.message?.content || "";
    res.status(200).json({
      code: summary ? 200 : 500,
      message: summary ? "摘要生成成功" : "AI未返回摘要内容",
      data: summary ? { summary } : null,
    });
  } catch (error) {
    console.error("API调用失败：", error);
    res.status(200).json({
      code: 500,
      message: "摘要生成失败",
      data: null,
    });
  }
};

module.exports = {
  getFolderContent,
  createFolder,
  deleteFolder,
  updateFolderName,
  generateSummary,
};
