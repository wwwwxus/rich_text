# 富文本知识库系统

这是一个基于Node.js和MySQL的富文本知识库系统，支持文档管理、文本评论和版本控制功能。

## 功能特性

### 文档管理
- ✅ 获取文档内容
- ✅ 保存富文本内容
- ✅ 删除文档（仅拥有者）

### 文本评论
- ✅ 选中文本添加评论
- ✅ 获取文本评论
- ✅ 删除评论（仅发布者）
- ✅ 获取文档的所有文本评论

### 版本控制
- ✅ 自动版本管理（保存时自动创建版本）
- ✅ 查看版本列表
- ✅ 获取特定版本内容
- ✅ 版本回退功能
- ✅ 删除版本（仅拥有者）

## 技术栈

- **后端**: Node.js + Express
- **数据库**: MySQL + Sequelize ORM
- **认证**: JWT Token
- **其他**: bcryptjs, cors, dotenv

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
创建 `.env` 文件并配置以下变量：
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
JWT_SECRET=your_jwt_secret
PORT=3000
```

### 3. 数据库设置
```bash
# 确保MySQL服务运行
# 创建数据库
mysql -u root -p
CREATE DATABASE your_database;
```

### 4. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API 接口

### 文档管理接口

#### 获取文档内容
```
GET /api/documents/:documentId/:userId
```

#### 保存富文本
```
POST /api/documents/save
Content-Type: application/json

{
  "userId": 1,
  "documentId": 1,
  "newContent": "新的文档内容",
  "updateTime": "2024-01-01T00:00:00.000Z"
}
```

#### 删除文档
```
DELETE /api/documents/:documentId/:userId
```

### 文本评论接口

#### 添加文本评论
```
POST /api/text-comments/add
Content-Type: application/json

{
  "textNanoid": "unique_text_id",
  "textContent": "被选中的文本内容",
  "comment": "评论内容",
  "userId": 1,
  "documentId": 1
}
```

#### 获取文本评论
```
GET /api/text-comments/:textNanoid
```

#### 删除评论
```
DELETE /api/text-comments/:commentId
Content-Type: application/json

{
  "userId": 1
}
```

### 版本管理接口

#### 添加版本
```
POST /api/versions/add
Content-Type: application/json

{
  "documentId": 1,
  "versionNumber": 1,
  "content": "版本内容",
  "diff": "与上一版本的差别",
  "savedAt": "2024-01-01T00:00:00.000Z"
}
```

#### 查看版本列表
```
GET /api/versions/:documentId
```

#### 回退版本
```
POST /api/versions/:documentId/:versionNumber/rollback
Content-Type: application/json

{
  "userId": 1
}
```

## 数据库结构

### Documents 表
- `id`: 主键
- `title`: 文档标题
- `content`: 文档内容
- `ownerId`: 文档拥有者ID
- `knowledgeBaseId`: 所属知识库ID
- `folderId`: 所属文件夹ID
- `isActive`: 是否有效

### TextComments 表
- `id`: 主键
- `textNanoid`: 文本唯一标识
- `textContent`: 被选中的文本内容
- `comment`: 评论内容
- `userId`: 评论用户ID
- `documentId`: 文档ID
- `isActive`: 是否有效

### DocumentVersions 表
- `id`: 主键
- `documentId`: 文档ID
- `versionNumber`: 版本号
- `content`: 版本内容
- `diff`: 与上一版本的差别
- `savedAt`: 保存时间
- `isActive`: 是否有效

## 测试

运行API测试：
```bash
node test_api.js
```

## 权限说明

1. **文档访问权限**: 只有文档拥有者或协作者可以访问文档
2. **文档编辑权限**: 只有文档拥有者或协作者可以编辑文档
3. **文档删除权限**: 只有文档拥有者可以删除文档
4. **评论删除权限**: 只有评论发布者可以删除自己的评论
5. **版本管理权限**: 只有文档拥有者可以管理版本（回退、删除等）

## 开发说明

### 项目结构
```
src/
├── app.js                 # 主应用文件
├── config/
│   └── database.js        # 数据库配置
├── controllers/           # 控制器
│   ├── documentController.js
│   ├── textCommentController.js
│   └── versionController.js
├── models/               # 数据模型
│   ├── Document.js
│   ├── TextComment.js
│   └── DocumentVersion.js
└── routes/               # 路由
    ├── documentRoutes.js
    ├── textCommentRoutes.js
    └── versionRoutes.js
```

### 添加新功能

1. 在 `models/` 目录下创建数据模型
2. 在 `controllers/` 目录下创建控制器
3. 在 `routes/` 目录下创建路由
4. 在 `app.js` 中注册路由和模型关联

## 注意事项

1. 所有删除操作都是软删除（设置 `isActive = false`）
2. 版本号从0开始，每次保存自动递增
3. 文本评论使用 nanoid 作为唯一标识
4. 权限检查在控制器层实现
5. 错误处理统一返回格式

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
