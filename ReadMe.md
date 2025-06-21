# 知识库管理系统

一个基于 Node.js + Express + MySQL 的知识库管理系统，支持用户认证、知识库管理、文件夹管理和协作功能。

## 功能特性

### 用户管理

- 用户注册和登录
- JWT Token 认证
- 个人信息管理
- 用户搜索（用于协作邀请）

### 知识库管理

- 创建、编辑、删除知识库
- 知识库权限管理
- 协作邀请功能
- 最近访问记录

### 文件夹管理

- 创建、编辑、删除文件夹
- 层级文件夹结构
- 文件夹内容浏览

### 权限控制

- 基于角色的权限系统
- 知识库所有者拥有全部权限
- 协作者拥有读取权限
- 所有操作都需要认证

## 技术栈

- **后端**: Node.js + Express
- **数据库**: MySQL
- **ORM**: Sequelize
- **认证**: JWT (jsonwebtoken)
- **密码加密**: bcryptjs
- **跨域**: CORS

## 安装和运行

### 1. 克隆项目

```bash
git clone <repository-url>
cd rich_text
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env` 文件并配置以下变量：

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=rich_text_db
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

### 4. 初始化数据库

```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE rich_text_db;
USE rich_text_db;

# 运行SQL脚本
mysql -u root -p rich_text_db < database.sql
```

### 5. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务器将在 `http://127.0.0.1:3300` 启动。

## API 文档

详细的 API 文档请参考 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 数据库结构

### 主要表结构

1. **Users** - 用户表
2. **KnowledgeBases** - 知识库表
3. **Collaborations** - 协作关系表
4. **Folders** - 文件夹表
5. **Documents** - 文档表
6. **RecentAccess** - 最近访问记录表

### 关系说明

- 用户可以拥有多个知识库
- 知识库可以有多个协作者
- 知识库包含多个文件夹和文档
- 文件夹支持层级结构
- 文档可以属于文件夹或直接属于知识库

## 项目结构

```
src/
├── app.js                 # 主应用文件
├── config/
│   └── database.js        # 数据库配置
├── controllers/
│   ├── userController.js      # 用户控制器
│   ├── knowledgeBaseController.js  # 知识库控制器
│   └── folderController.js    # 文件夹控制器
├── middleware/
│   └── auth.js           # 认证中间件
├── models/
│   ├── User.js           # 用户模型
│   ├── KnowledgeBase.js  # 知识库模型
│   ├── Collaboration.js  # 协作关系模型
│   ├── Folder.js         # 文件夹模型
│   ├── Document.js       # 文档模型
│   └── RecentAccess.js   # 最近访问模型
└── routes/
    ├── userRoutes.js         # 用户路由
    ├── knowledgeBaseRoutes.js # 知识库路由
    └── folderRoutes.js       # 文件夹路由
```

## 测试账号

系统预置了测试账号：

- 邮箱: `admin@example.com` / 密码: `password`
- 邮箱: `test@example.com` / 密码: `password`

## 开发说明

### 添加新功能

1. 在 `models/` 目录下创建数据模型
2. 在 `controllers/` 目录下创建控制器
3. 在 `routes/` 目录下创建路由
4. 在 `app.js` 中注册路由和模型关联

### 数据库迁移

使用 Sequelize 的 `sync()` 方法自动同步数据库结构，或手动执行 SQL 脚本。

## 许可证

MIT License
