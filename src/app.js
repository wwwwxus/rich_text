const express = require("express");
const cors = require("cors");
const http = require("http");
const sequelize = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const knowledgeBaseRoutes = require("./routes/knowledgeBaseRoutes");
const folderRoutes = require("./routes/folderRoutes");
const documentRoutes = require("./routes/documentRoutes");
const textCommentRoutes = require("./routes/textCommentRoutes");
const versionRoutes = require("./routes/versionRoutes");
const { createWebSocketServer } = require("./webSocketServer");
require("dotenv").config();

// 导入模型
const User = require("./models/User");
const KnowledgeBase = require("./models/KnowledgeBase");
const Collaboration = require("./models/Collaboration");
const Folder = require("./models/Folder");
const Document = require("./models/Document");
const RecentAccess = require("./models/RecentAccess");
const TextComment = require("./models/TextComment");
const DocumentVersion = require("./models/DocumentVersion");

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 设置模型关联关系
const setupAssociations = () => {
  // 用户与知识库的关系（拥有）
  User.hasMany(KnowledgeBase, {
    foreignKey: "ownerId",
    as: "ownedKnowledgeBases",
  });
  KnowledgeBase.belongsTo(User, { foreignKey: "ownerId", as: "owner" });

  // 用户与知识库的协作关系
  User.belongsToMany(KnowledgeBase, {
    through: Collaboration,
    foreignKey: "userId",
    otherKey: "knowledgeBaseId",
    as: "collaboratedKnowledgeBases",
  });
  KnowledgeBase.belongsToMany(User, {
    through: Collaboration,
    foreignKey: "knowledgeBaseId",
    otherKey: "userId",
    as: "collaborators",
  });

  // 知识库与文件夹的关系
  KnowledgeBase.hasMany(Folder, { foreignKey: "knowledgeBaseId" });
  Folder.belongsTo(KnowledgeBase, { foreignKey: "knowledgeBaseId" });

  // 文件夹的层级关系
  Folder.hasMany(Folder, { foreignKey: "parentFolderId", as: "subFolders" });
  Folder.belongsTo(Folder, {
    foreignKey: "parentFolderId",
    as: "parentFolder",
  });

  // 知识库与文档的关系
  KnowledgeBase.hasMany(Document, { foreignKey: "knowledgeBaseId" });
  Document.belongsTo(KnowledgeBase, { foreignKey: "knowledgeBaseId" });

  // 文件夹与文档的关系
  Folder.hasMany(Document, { foreignKey: "folderId" });
  Document.belongsTo(Folder, { foreignKey: "folderId" });

  // 用户与文档的关系（拥有）
  // User.hasMany(Document, { foreignKey: "ownerId", as: "ownedDocuments" });
  // Document.belongsTo(User, { foreignKey: "ownerId", as: "owner" });

  // 用户与最近访问的关系
  User.hasMany(RecentAccess, { foreignKey: "userId" });
  RecentAccess.belongsTo(User, { foreignKey: "userId" });

  KnowledgeBase.hasMany(RecentAccess, { foreignKey: "knowledgeBaseId" });
  RecentAccess.belongsTo(KnowledgeBase, { foreignKey: "knowledgeBaseId" });

  // 文档与文本评论的关系
  Document.hasMany(TextComment, { foreignKey: "documentId" });
  TextComment.belongsTo(Document, { foreignKey: "documentId" });

  // 用户与文本评论的关系
  User.hasMany(TextComment, { foreignKey: "userId" });
  TextComment.belongsTo(User, { foreignKey: "userId" });

  // 文档与版本的关系
  Document.hasMany(DocumentVersion, { foreignKey: "documentId" });
  DocumentVersion.belongsTo(Document, { foreignKey: "documentId" });
};

// 路由
app.use("/api/users", userRoutes);
app.use("/api/knowledgeBase", knowledgeBaseRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/text-comments", textCommentRoutes);
app.use("/api/versions", versionRoutes);

// 创建HTTP服务器
const server = http.createServer(app);

// 数据库连接和服务器启动
const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    // 设置模型关联关系
    setupAssociations();

    // 同步数据库模型
    await sequelize.sync();
    console.log("Database synchronized.");

    // 启动WebSocket服务器
    const { wss, cleanup } = createWebSocketServer(server);

    // 启动HTTP服务器
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // 处理进程退出事件
    process.on("SIGINT", () => {
      console.log("正在关闭服务器...");
      cleanup();
      server.close(() => {
        console.log("HTTP服务器已关闭");
        process.exit(0);
      });
    });

    process.on("SIGTERM", () => {
      console.log("正在关闭服务器...");
      cleanup();
      server.close(() => {
        console.log("HTTP服务器已关闭");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

start();
