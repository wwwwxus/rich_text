# API 测试指南

## 准备工作

### 1. 启动服务器
```bash
npm start
```

### 2. 初始化测试数据
```bash
node init_test_data.js init
```

### 3. 运行完整测试
```bash
node test_api.js
```

## 测试步骤详解

### 第一步：检查服务器状态
确保服务器正在运行在 `http://localhost:3000`

### 第二步：准备测试数据
运行初始化脚本创建测试数据：
- 测试用户 (ID: 1)
- 测试知识库 (ID: 1) 
- 测试文档 (ID: 1)

### 第三步：运行测试
测试脚本会自动：
1. 获取测试数据ID
2. 测试所有接口
3. 显示详细的测试结果

## 手动测试单个接口

### 1. 文档管理接口测试

#### 获取文档内容
```bash
curl -X GET "http://localhost:3000/api/documents/1/1"
```

#### 保存富文本
```bash
curl -X POST "http://localhost:3000/api/documents/save" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "documentId": 1,
    "newContent": "这是更新的内容",
    "updateTime": "2024-01-01T00:00:00.000Z"
  }'
```

#### 删除文档
```bash
curl -X DELETE "http://localhost:3000/api/documents/1/1"
```

### 2. 文本评论接口测试

#### 添加文本评论
```bash
curl -X POST "http://localhost:3000/api/text-comments/add" \
  -H "Content-Type: application/json" \
  -d '{
    "textNanoid": "test_text_123",
    "textContent": "被选中的文本",
    "comment": "这是一个评论",
    "userId": 1,
    "documentId": 1
  }'
```

#### 获取文本评论
```bash
curl -X GET "http://localhost:3000/api/text-comments/test_text_123"
```

#### 删除评论
```bash
curl -X DELETE "http://localhost:3000/api/text-comments/1" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'
```

### 3. 版本管理接口测试

#### 添加版本
```bash
curl -X POST "http://localhost:3000/api/versions/add" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": 1,
    "versionNumber": 1,
    "content": "版本内容",
    "diff": "与上一版本的差别",
    "savedAt": "2024-01-01T00:00:00.000Z"
  }'
```

#### 查看版本列表
```bash
curl -X GET "http://localhost:3000/api/versions/1"
```

#### 回退版本
```bash
curl -X POST "http://localhost:3000/api/versions/1/0/rollback" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'
```

## 测试数据管理

### 查看现有测试数据
```bash
node init_test_data.js show
```

### 清理测试数据
```bash
node init_test_data.js clean
```

### 重新初始化测试数据
```bash
node init_test_data.js init
```

## 常见问题解决

### 1. 服务器连接失败
**错误**: `ECONNREFUSED`
**解决**: 确保服务器正在运行 `npm start`

### 2. 测试数据不存在
**错误**: `测试用户不存在`
**解决**: 运行 `node init_test_data.js init`

### 3. 数据库连接失败
**错误**: `Unable to connect to the database`
**解决**: 
- 检查 `.env` 文件配置
- 确保MySQL服务运行
- 检查数据库是否存在

### 4. 权限错误
**错误**: `code: 403`
**解决**: 确保使用正确的用户ID进行测试

### 5. 资源不存在
**错误**: `code: 404`
**解决**: 检查文档ID、用户ID是否正确

## 测试结果解读

### 成功响应示例
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 具体数据
  }
}
```

### 错误响应示例
```json
{
  "code": 400,
  "message": "错误描述"
}
```

## 测试覆盖率

### 已测试的接口
- ? 文档管理 (3个接口)
- ? 文本评论 (4个接口)  
- ? 版本管理 (5个接口)

### 测试场景
- ? 正常操作流程
- ? 权限验证
- ? 错误处理
- ? 数据验证

## 性能测试

### 批量测试
可以修改测试脚本进行批量测试：

```javascript
// 批量创建评论
for (let i = 0; i < 10; i++) {
  await axios.post('/api/text-comments/add', {
    textNanoid: `batch_test_${i}`,
    textContent: `批量测试文本 ${i}`,
    comment: `批量测试评论 ${i}`,
    userId: 1,
    documentId: 1
  });
}
```

## 自动化测试

### 使用 Jest 进行单元测试
```bash
npm install --save-dev jest
```

### 测试脚本示例
```javascript
describe('Document API', () => {
  test('should get document content', async () => {
    const response = await axios.get('/api/documents/1/1');
    expect(response.data.code).toBe(200);
  });
});
```

## 持续集成

### GitHub Actions 配置
```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm start &
      - run: node init_test_data.js init
      - run: node test_api.js
```

## 总结

通过以上测试流程，可以全面验证API接口的功能正确性、性能表现和错误处理能力。建议在开发过程中定期运行测试，确保代码质量。 