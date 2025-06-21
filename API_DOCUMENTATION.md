
## 基础信息

- 基础 URL: `http://localhost:3000/api`
- 认证方式: JWT Token (除登录注册外，所有接口都需要在请求头中携带 `Authorization: Bearer <token>`)

## 用户相关接口

### 1. 用户注册

- **URL**: `POST /users/register`
- **描述**: 注册新用户
- **请求体**:

```json
{
  "username": "用户名",
  "email": "邮箱",
  "password": "密码"
}
```

- **响应**:

```json
{
  "id": 1,
  "username": "用户名",
  "email": "邮箱",
  "token": "JWT_TOKEN"
}
```

### 2. 用户登录

- **URL**: `POST /users/login`
- **描述**: 用户登录
- **请求体**:

```json
{
  "email": "邮箱",
  "password": "密码"
}
```

- **响应**:

```json
{
  "id": 1,
  "username": "用户名",
  "email": "邮箱",
  "token": "JWT_TOKEN"
}
```

### 3. 获取个人信息

- **URL**: `GET /users/profile`
- **描述**: 获取当前登录用户信息
- **请求头**: `Authorization: Bearer <token>`
- **响应**:

```json
{
  "id": 1,
  "username": "用户名",
  "email": "邮箱",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. 根据邮箱搜索用户

- **URL**: `GET /users/search?email=邮箱`
- **描述**: 根据邮箱搜索用户（以便添加协作）
- **请求头**: `Authorization: Bearer <token>`
- **响应**:

```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "用户名",
    "email": "邮箱"
  }
}
```

## 知识库相关接口

### 1. 获取可访问的知识库信息

- **URL**: `GET /knowledge-bases/accessible`
- **描述**: 获取用户可访问的知识库 ID 数组
- **请求头**: `Authorization: Bearer <token>`
- **响应**:

```json
{
  "success": true,
  "data": [
  { "id": 1, "name": "xxx", "description": "xxx", "permission": "owner" },
  { "id": 2, "name": "yyy", "description": "yyy", "permission": "read" }
]
}
```

### 2. 根据知识库 id 获取第一层内部文档和文件夹

- **URL**: `GET /knowledge-bases/:knowledgeBaseId/content`
- **描述**: 获取知识库第一层的文档和文件夹
- **请求头**: `Authorization: Bearer <token>`
- **响应**:

```json
{
  "success": true,
  "data": {
    "documents": [
      { "id": 1, "name": "文档A" },
      { "id": 2, "name": "文档B" }
    ],
    "folders": [
      { "id": 10, "name": "文件夹X" },
      { "id": 11, "name": "文件夹Y" }
    ]
  }
}
```

### 3. 创建知识库

- **URL**: `POST /knowledge-bases`
- **描述**: 创建新的知识库
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:

```json
{
  "name": "知识库名称",
  "description": "知识库简介"
}
```

- **响应**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "知识库名称",
    "description": "知识库简介",
    "ownerId": 1,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "知识库创建成功"
}
```

### 4. 删除知识库

- **URL**: `DELETE /knowledge-bases/:id`
- **描述**: 删除指定的知识库（仅所有者可删除）
- **请求头**: `Authorization: Bearer <token>`
- **响应**:

```json
{
  "success": true,
  "message": "知识库删除成功"
}
```

### 5. 编辑知识库信息

- **URL**: `PUT /knowledge-bases/:id`
- **描述**: 编辑知识库信息（仅所有者可编辑）
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:

```json
{
  "name": "新知识库名称",
  "description": "新知识库简介"
}
```

- **响应**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "新知识库名称",
    "description": "新知识库简介",
    "ownerId": 1,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "知识库信息更新成功"
}
```

### 6. 邀请协作

- **URL**: `POST /knowledge-bases/invite`
- **描述**: 邀请用户协作（仅所有者可邀请）
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:

```json
{
  "userId": 2,
  "knowledgeBaseId": 1,
  "permission": "write",(可选默认为read)
}
```

- **响应**:

```json
{
  "success": true,
  "message": "邀请协作成功"
}
```

### 7.获取最近访问的知识库
- **URL**: `GET /knowledgeBase/recent`
- **描述**: 获取最近访问的知识库
- **请求头**: `Authorization: Bearer <token>`
- **请求体参数param**:

|参数名|位置|类型|必填|说明|
|--|--|--|--|--|
limit|query|number|否|返回的数量，默认 5|


- **响应**:

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "知识库A" },
    { "id": 2, "name": "知识库B" }
  ]
}
```

## 文件夹相关接口

### 1. 根据文件夹 id 获取第一层文档和文件夹 id

- **URL**: `GET /folders/:folderId/content`
- **描述**: 获取指定文件夹的第一层内容
- **请求头**: `Authorization: Bearer <token>`
- **响应**:

```json
{
  "success": true,
  "data": {
    "folders": [
      { "id": 1, "name": "子文件夹A" },
      { "id": 2, "name": "子文件夹B" }
    ],
    "documents": [
      { "id": 10, "name": "文档X" },
      { "id": 11, "name": "文档Y" }
    ]
  }
}
```

### 2. 创建文件夹

- **URL**: `POST /folders`
- **描述**: 创建新文件夹
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:

```json
{
  "knowledgeBaseId": 1,
  "name": "文件夹名称",
  "parentFolderId":null,(可选)
}
```

- **响应**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "文件夹名称",
    "knowledgeBaseId": 1,
    "parentFolderId": null,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "文件夹创建成功"
}
```

### 3. 删除文件夹

- **URL**: `DELETE /folders/:id`
- **描述**: 删除指定的文件夹
- **请求头**: `Authorization: Bearer <token>`
- **响应**:

```json
{
  "success": true,
  "message": "文件夹删除成功"
}
```

### 4. 编辑文件夹名称

- **URL**: `PUT /folders/:id`
- **描述**: 编辑文件夹名称
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:

```json
{
  "name": "新文件夹名称"
}
```

- **响应**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "新文件夹名称",
    "knowledgeBaseId": 1,
    "parentFolderId": null,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "文件夹名称更新成功"
}
```

## 错误响应格式

所有接口在发生错误时都会返回以下格式：

```json
{
  "success": false,
  "message": "错误描述信息"
}
```

常见 HTTP 状态码：

- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 无权限
- `404`: 资源不存在
- `500`: 服务器内部错误

## 权限说明

1. **知识库权限**：

   - 所有者：拥有所有权限（创建、编辑、删除、邀请协作）
   - 协作者：拥有读取权限

2. **文件夹权限**：

   - 继承知识库的权限
   - 有知识库访问权限的用户可以操作文件夹

3. **认证要求**：
   - 除登录注册外，所有接口都需要 JWT Token 认证
   - Token 通过请求头 `Authorization: Bearer <token>` 传递
