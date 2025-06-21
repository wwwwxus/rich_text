const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3300/api';
let authToken = '';

// 测试用户注册
async function testRegister() {
  try {
    const response = await axios.post(`${BASE_URL}/users/register`, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ 用户注册成功:', response.data);
    return response.data.token;
  } catch (error) {
    console.log('❌ 用户注册失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试用户登录
async function testLogin() {
  try {
    const response = await axios.post(`${BASE_URL}/users/login`, {
      email: 'admin@example.com',
      password: 'password'
    });
    console.log('✅ 用户登录成功:', response.data);
    return response.data.token;
  } catch (error) {
    console.log('❌ 用户登录失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试创建知识库
async function testCreateKnowledgeBase(token) {
  try {
    const response = await axios.post(`${BASE_URL}/knowledge-bases`, {
      name: '测试知识库',
      description: '这是一个测试知识库'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 创建知识库成功:', response.data);
    return response.data.data.id;
  } catch (error) {
    console.log('❌ 创建知识库失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试获取可访问的知识库
async function testGetAccessibleKnowledgeBases(token) {
  try {
    const response = await axios.get(`${BASE_URL}/knowledge-bases/accessible`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 获取可访问知识库成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.log('❌ 获取可访问知识库失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试创建文件夹
async function testCreateFolder(token, knowledgeBaseId) {
  try {
    const response = await axios.post(`${BASE_URL}/folders`, {
      knowledgeBaseId: knowledgeBaseId,
      name: '测试文件夹'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 创建文件夹成功:', response.data);
    return response.data.data.id;
  } catch (error) {
    console.log('❌ 创建文件夹失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试搜索用户
async function testSearchUser(token) {
  try {
    const response = await axios.get(`${BASE_URL}/users/search?email=test@example.com`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 搜索用户成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.log('❌ 搜索用户失败:', error.response?.data || error.message);
    return null;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始API测试...\n');
  // 1. 测试登录
  console.log('1. 测试用户登录');
  authToken = await testLogin();
  if (!authToken) {
    console.log('❌ 登录失败，无法继续测试');
    return;
  }
  console.log('');

  // 2. 测试搜索用户
  console.log('2. 测试搜索用户');
  await testSearchUser(authToken);
  console.log('');

  // 3. 测试创建知识库
  console.log('3. 测试创建知识库');
  const knowledgeBaseId = await testCreateKnowledgeBase(authToken);
  console.log('');

  // 4. 测试获取可访问的知识库
  console.log('4. 测试获取可访问的知识库');
  await testGetAccessibleKnowledgeBases(authToken);
  console.log('');

  // 5. 测试创建文件夹
  if (knowledgeBaseId) {
    console.log('5. 测试创建文件夹');
    await testCreateFolder(authToken, knowledgeBaseId);
    console.log('');
  }

  console.log('✅ API测试完成！');
}

// 运行测试
runTests().catch(console.error); 