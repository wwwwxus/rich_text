# 富文本知识库 API 文档

## 概述

这是一个富文本文档知识库系统的 API 接口文档，支持文档管理、文本评论和版本控制功能。

## 基础信息

- **基础 URL**: `http://localhost:3300/api`
- **响应格式**: 所有接口统一返回 `{ code, message, data }` 格式
- **认证方式**: 部分接口需要用户认证

## 1. 用户管理接口

### 1.1 用户注册

- **URL**: `POST /api/users/register`
- **描述**: 注册新用户
- **请求体**:

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

- **返回**:

```json
{
  "code": 200,
  "message": "用户注册成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 1.2 用户登录

- **URL**: `POST /api/users/login`
- **描述**: 用户登录
- **请求体**:

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

- **返回**:

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com"
    }
  }
}
```

## 2. 知识库管理接口

### 2.1 创建知识库

- **URL**: `POST /api/knowledgeBase/create`
- **描述**: 创建新的知识库
- **请求体**:

```json
{
  "name": "我的知识库",
  "description": "这是一个测试知识库",
  "ownerId": 1
}
```

- **返回**:

```json
{
  "code": 200,
  "message": "知识库创建成功",
  "data": {
    "id": 1,
    "name": "我的知识库",
    "description": "这是一个测试知识库",
    "ownerId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2.2 获取用户的知识库列表

- **URL**: `GET /api/knowledgeBase/user/:userId`
- **描述**: 获取指定用户的知识库列表
- **返回**:

```json
{
  "code": 200,
  "message": "获取知识库列表成功",
  "data": [
    {
      "id": 1,
      "name": "我的知识库",
      "description": "这是一个测试知识库",
      "ownerId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 3. 文档管理接口

### 3.1 创建文档

- **URL**: `POST /api/documents/create`
- **描述**: 创建新的文档
- **请求体**:

```json
{
  "title": "文档标题",
  "knowledgeBaseId": 1,
  "parentId": 1,
  "idType":0|1//选中的类型，0为文档，1为文件夹，当选中的是文档的时候则创建在文档的父级文件夹下，如果选中的是文件夹直接创建在该文件夹下
}
```

- **参数说明**:
  - `title` (必填): 文档标题
  - `knowledgeBaseId` (必填): 所属知识库 ID
  - `parentId` (可选): 所属文件夹 ID，默认为 null 根文件夹
- **返回**:

```json
{
  "code": 200,
  "message": "文档创建成功",
  "data": {
    "id": 1,
    "title": "文档标题",
    "content": "",
    "knowledgeBaseId": 1,
    "folderId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3.2 获取文档列表

- **URL**: `GET /api/documents/list/:knowledgeBaseId`
- **URL**: `GET /api/documents/list/:knowledgeBaseId`
- **描述**: 获取指定知识库的文档列表
- **参数**:
  - `knowledgeBaseId` (路径参数): 知识库 ID
  - `userId` (可选路径参数): 用户 ID，如果提供则只返回该用户拥有的文档
- **返回**:

```json
{
  "code": 200,
  "message": "获取文档列表成功",
  "data": [
    {
      "id": 1,
      "title": "文档标题",
      "ownerId": 1,
      "ownerName": "用户名",
      "knowledgeBaseId": 1,
      "folderId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3.3 获取文档内容

- **URL**: `GET /api/documents/:documentId`
- **描述**: 获取指定文档的内容
- **返回**:

```json
{
  "code": 200,
  "message": "获取文档成功",
  "data": {
    "id": 1,
    "title": "测试文档",
    "content": "文档内容...",
    "knowledgeBaseId": 1,
    "folderId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3.4 保存富文本

- **URL**: `POST /api/documents/save`
- **描述**: 保存文档的富文本内容（自动创建新版本）
- **请求体**:

```json
{
  "documentId": 1,
  "newContent": "更新后的文档内容",
  "updateTime": "2024-01-01T00:00:00.000Z"
}
```

- **返回**:

```json
{
  "code": 200,
  "message": "文档保存成功",
  "data": {
    "documentId": 1,
    "versionNumber": 2,
    "diff": "内容增加 50 个字符",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3.5 删除文档

- **URL**: `DELETE /api/documents/:documentId`
- **描述**: 删除指定文档（软删除）
- **参数**:
  - `documentId` (路径参数): 文档 ID
- **返回**:

```json
{
  "code": 200,
  "message": "文档删除成功",
  "data": null
}
```

### 3.6 修改文档名称

- **URL**: `PUT /api/documents/:documentId`
- **描述**: 修改指定文档名称
- **参数**:
  - `documentId` (路径参数): 文档 ID
- **请求体**:

```json
{
  "title":"文档名称"
}
```

- **返回**:

```json
{
  "code": 200,
  "message": "文档名称更新成功",
  "data": {
    "id": "id",
    "title": "标题",
    "updatedAt": "2025-06-10",
  },
}
```

## 4. 文本评论接口

### 4.1 选中文本评论/回复

- **URL**: `POST /api/text-comments/add`
- **描述**: 为选中的文本添加评论或回复
- **权限**: 仅知识库协作者或拥有者可评论/回复
- **请求体**:

```json
{
  "textNanoid": "unique_text_id",
  "comment": "评论内容",
  "documentId": 1,
  "parentId": 2 // 可选，回复时填写父评论ID，顶级评论为null或不传
}
```

- **返回**:

```json
{
  "code": 200,
  "message": "文本评论添加成功",
  "data": {
    "id": 1,
    "textNanoid": "unique_text_id",
    "comment": "评论内容",
    "userId": 1,
    "documentId": 1,
    "parentId": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4.2 获取文本评论（嵌套结构）

- **URL**: `GET /api/text-comments/:textNanoid`
- **描述**: 获取指定文本片段的所有评论及回复，返回树状嵌套结构
- **参数**:
  - `textNanoid` (路径参数): 文本的唯一标识
- **返回**:

```json
{
  "code": 200,
  "message": "获取文本评论成功",
  "data": [
    {
      "id": 1,
      "comment": "父评论内容",
      "userId": 1,
      "username": "用户名",
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "children": [
        {
          "id": 2,
          "comment": "回复内容",
          "userId": 2,
          "username": "协作者",
          "parentId": 1,
          "createdAt": "2024-01-01T00:00:00.000Z",
          "children": []
        }
      ]
    }
  ]
}
```

> 每条评论包含 children 字段，递归嵌套所有回复。

### 4.3 获取文档的所有文本评论（嵌套结构）

- **URL**: `GET /api/text-comments/document/:documentId`
- **描述**: 获取指定文档的所有文本评论及回复，返回树状嵌套结构
- **参数**:
  - `documentId` (路径参数): 文档 ID
- **返回**:

```json
{
  "code": 200,
  "message": "获取文档文本评论成功",
  "data": [
    {
      "id": 1,
      "textNanoid": "unique_text_id",
      "comment": "父评论内容",
      "userId": 1,
      "username": "用户名",
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "children": [
        {
          "id": 2,
          "textNanoid": "unique_text_id",
          "comment": "回复内容",
          "userId": 2,
          "username": "协作者",
          "parentId": 1,
          "createdAt": "2024-01-01T00:00:00.000Z",
          "children": []
        }
      ]
    }
  ]
}
```

> 每条评论包含 children 字段，递归嵌套所有回复。

### 4.4 删除文本评论

- **URL**: `DELETE /api/text-comments/:commentId`
- **描述**: 删除指定的文本评论（只有发布者可以删除）
- **参数**:
  - `commentId` (路径参数): 评论 ID
- **请求体**:

```json
{
  "userId": 1
}
```

- **返回**:

```json
{
  "code": 200,
  "message": "评论删除成功",
  "data": {
    "deletedCommentId": 1
  }
}
```

// ... existing code ...
### 4.5 获取父评论（分页）

- **URL**: `GET /api/text-comments/parents/:textNanoid`
- **描述**: 获取指定文本片段的所有父评论（parentId为null），支持分页
- **参数**:
  - `textNanoid` (路径参数): 文本的唯一标识
  - `page` (查询参数，可选): 页码，默认1
  - `pageSize` (查询参数，可选): 每页数量，默认10
- **返回**:

```json
{
  "code": 200,
  "message": "获取父评论成功",
  "data": [
    {
      "id": 1,
      "comment": "父评论内容",
      "userId": 1,
      "username": "用户名",
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "childCount": "子评论总数"
    }
  ],
  "total": 20,
  "page": 1,
  "pageSize": 10
}
```

// ... existing code ...
### 4.6 获取子评论（分页）

- **URL**: `GET /api/text-comments/children/:parentId`
- **描述**: 获取指定父评论下的子评论，支持分页。每条子评论包含 fatherUsername 字段，表示其父评论的用户名。
- **参数**:
  - `parentId` (路径参数): 父评论ID
  - `page` (查询参数，可选): 页码，默认1
  - `pageSize` (查询参数，可选): 每页数量，默认5
- **返回**:

```json
{
  "code": 200,
  "message": "获取子评论成功",
  "data": [
    {
      "id": 2,
      "comment": "子评论内容",
      "userId": 2,
      "username": "协作者",
      "parentId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "fatherUsername": "父评论用户名"
    }
  ],
  "total": 8,
  "page": 1,
  "pageSize": 5
}
```


## 5. 版本管理接口

### 版本管理说明

版本管理采用**自动版本控制**机制：

- 每次保存文档时，系统自动创建新版本
- 版本号自动递增，无需用户指定
- 系统自动计算与上一版本的差异
- 用户无需手动管理版本号

### 5.1 查看版本列表

- **URL**: `GET /api/versions/:documentId`
- **描述**: 获取指定文档的所有版本列表
- **参数**:
  - `documentId` (路径参数): 文档 ID
- **返回**:

```json
{
  "code": 200,
  "message": "获取版本列表成功",
  "data": [
    {
      "id": 1,
      "versionNumber": 3,
      "diff": "内容增加 50 个字符",
      "savedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "versionNumber": 2,
      "diff": "内容被修改",
      "savedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 3,
      "versionNumber": 1,
      "diff": "初始版本",
      "savedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 5.2 获取特定版本内容

- **URL**: `GET /api/versions/:documentId/:versionNumber`
- **描述**: 获取指定文档的特定版本内容
- **参数**:
  - `documentId` (路径参数): 文档 ID
  - `versionNumber` (路径参数): 版本号
- **返回**:

```json
{
  "code": 200,
  "message": "获取版本内容成功",
  "data": {
    "id": 1,
    "documentId": 1,
    "versionNumber": 2,
    "content": "版本内容",
    "diff": "与上一版本的差别",
    "savedAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5.3 回退版本

- **URL**: `POST /api/versions/:documentId/:versionNumber/rollback`
- **描述**: 将文档回退到指定版本
- **参数**:
  - `documentId` (路径参数): 文档 ID
  - `versionNumber` (路径参数): 目标版本号
- **请求体**:

```json
{
  "userId": 1
}
```

- **返回**:

```json
{
  "code": 200,
  "message": "版本回退成功",
  "data": {
    "documentId": 1,
    "rollbackToVersion": 2,
    "newVersionNumber": 4,
    "content": "回退后的内容",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5.4 删除版本

- **URL**: `DELETE /api/versions/:documentId/:versionNumber`
- **描述**: 删除指定文档的特定版本（只有拥有者可以删除）
- **参数**:
  - `documentId` (路径参数): 文档 ID
  - `versionNumber` (路径参数): 版本号
- **请求体**:

```json
{
  "userId": 1
}
```

- **返回**:

```json
{
  "code": 200,
  "message": "版本删除成功",
  "data": {
    "deletedVersionNumber": 2
  }
}
```

### 版本差异说明

系统会自动计算版本间的差异，常见的差异描述包括：

- `初始版本`: 文档的第一个版本
- `内容无变化`: 保存时内容没有变化
- `内容增加 X 个字符`: 内容长度增加
- `内容减少 X 个字符`: 内容长度减少
- `内容被修改`: 内容被修改但长度相同
- `回退到版本 X`: 通过回退操作创建的版本

## 6. 文件夹管理接口

### 6.1 创建文件夹

- **URL**: `POST /api/folders/create`
- **描述**: 创建新文件夹
- **请求体**:

```json
{
  "name": "测试文件夹",
  "knowledgeBaseId": 1,
  "parentId": null,
  "idType":0|1//当选中的是文档的时候则创建在文档的父级文件夹下，如果选中的是文件夹直接创建在该文件夹下
}
```

- **返回**:

```json
{
  "code": 200,
  "message": "文件夹创建成功",
  "data": {
    "id": 1,
    "name": "测试文件夹",
    "knowledgeBaseId": 1,
    "parentFolderId": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6.2 获取文件夹列表

- **URL**: `GET /api/folders/:knowledgeBaseId`
- **描述**: 获取指定知识库的文件夹列表
- **返回**:

```json
{
  "code": 200,
  "message": "获取文件夹列表成功",
  "data": [
    {
      "id": 1,
      "name": "测试文件夹",
      "knowledgeBaseId": 1,
      "parentFolderId": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 错误响应格式

所有接口在发生错误时都会返回以下格式：

```json
{
  "code": 400,
  "message": "错误描述信息",
  "data": null
}
```

## 常见错误码

- `400`: 请求参数错误
- `401`: 未授权访问
- `404`: 资源不存在
- `500`: 服务器内部错误

## 测试

测试
可以使用提供的 test_api.js 文件来测试所有接口功能。
总结
我已经清理了 API 文档中的重复内容，现在的文档结构清晰，没有重复的接口说明：
? 已清理的内容
删除了重复的文档管理接口 - 只保留最新最完整的版本
统一了接口编号 - 按照功能模块重新编号
保留了所有必要的接口 - 包括你要求添加的创建文档和获取文档列表接口
更新了版本管理接口 - 反映新的自动版本管理机制
?? 当前文档结构
用户管理接口 (1.x)
知识库管理接口 (2.x)
文档管理接口 (3.x) - 包含创建、列表、获取、保存、删除
文本评论接口 (4.x) - 包含添加、获取、删除评论
版本管理接口 (5.x) - 自动版本管理
文件夹管理接口 (6.x)
