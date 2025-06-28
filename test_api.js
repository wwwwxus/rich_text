const axios = require('axios');
const sequelize = require('./src/config/database');
const User = require('./src/models/User');
const KnowledgeBase = require('./src/models/KnowledgeBase');
const Document = require('./src/models/Document');

const BASE_URL = 'http://localhost:3300/api';

// 获取测试数据
async function getTestData() {
  try {
    // 查找测试用户
    const testUser = await User.findOne({ 
      where: { email: 'test@example.com' } 
    });
    
    if (!testUser) {
      throw new Error('测试用户不存在，请先运行: node init_test_data.js init');
    }

    // 查找测试知识库
    const testKnowledgeBase = await KnowledgeBase.findOne({ 
      where: { ownerId: testUser.id } 
    });
    
    if (!testKnowledgeBase) {
      throw new Error('测试知识库不存在，请先运行: node init_test_data.js init');
    }

    // 查找测试文档
    const testDocument = await Document.findOne({ 
      where: { knowledgeBaseId: testKnowledgeBase.id } 
    });
    
    if (!testDocument) {
      throw new Error('测试文档不存在，请先运行: node init_test_data.js init');
    }

    return {
      userId: testUser.id,
      documentId: testDocument.id,
      knowledgeBaseId: testKnowledgeBase.id,
      textNanoid: 'test_text_' + Date.now(),
      commentId: 1,
      versionNumber: 1
    };
  } catch (error) {
    console.error('获取测试数据失败:', error.message);
    process.exit(1);
  }
}

// 测试文档管理接口
async function testDocumentAPIs(testData) {
  console.log('=== 测试文档管理接口 ===');
  
  try {
    // 1. 获取文档内容
    console.log('\n1. 获取文档内容');
    const getDocResponse = await axios.get(`${BASE_URL}/documents/${testData.documentId}/${testData.userId}`);
    console.log('✅ 获取文档内容成功:', getDocResponse.data.message);
    console.log('   文档标题:', getDocResponse.data.data.title);
    
    // 2. 保存富文本
    console.log('\n2. 保存富文本');
    const saveDocResponse = await axios.post(`${BASE_URL}/documents/save`, {
      userId: testData.userId,
      documentId: testData.documentId,
      newContent: '这是更新后的文档内容 - ' + new Date().toLocaleString(),
      updateTime: new Date().toISOString()
    });
    console.log('✅ 保存文档成功:', saveDocResponse.data.message);
    console.log('   版本号:', saveDocResponse.data.data.versionNumber);
    
  } catch (error) {
    console.error('❌ 文档管理接口测试失败:', error.response?.data?.message || error.message);
  }
}

// 测试文本评论接口
async function testTextCommentAPIs(testData) {
  console.log('\n=== 测试文本评论接口 ===');
  
  try {
    // 1. 添加文本评论
    console.log('\n1. 添加文本评论');
    const addCommentResponse = await axios.post(`${BASE_URL}/text-comments/add`, {
      textNanoid: testData.textNanoid,
      textContent: '这是被选中的文本内容',
      comment: '这是一个测试评论 - ' + new Date().toLocaleString(),
      userId: testData.userId,
      documentId: testData.documentId
    });
    console.log('✅ 添加评论成功:', addCommentResponse.data.message);
    console.log('   评论ID:', addCommentResponse.data.data.id);
    
    // 2. 获取文本评论
    console.log('\n2. 获取文本评论');
    const getCommentsResponse = await axios.get(`${BASE_URL}/text-comments/${testData.textNanoid}`);
    console.log('✅ 获取评论成功:', getCommentsResponse.data.message);
    console.log('   评论数量:', getCommentsResponse.data.data.length);
    
    // 3. 获取文档的所有文本评论
    console.log('\n3. 获取文档的所有文本评论');
    const getDocCommentsResponse = await axios.get(`${BASE_URL}/text-comments/document/${testData.documentId}`);
    console.log('✅ 获取文档评论成功:', getDocCommentsResponse.data.message);
    console.log('   文档评论数量:', getDocCommentsResponse.data.data.length);
    
    // 4. 删除评论（如果有评论的话）
    if (getCommentsResponse.data.data && getCommentsResponse.data.data.length > 0) {
      console.log('\n4. 删除评论');
      const deleteCommentResponse = await axios.delete(`${BASE_URL}/text-comments/${getCommentsResponse.data.data[0].id}`, {
        data: { userId: testData.userId }
      });
      console.log('✅ 删除评论成功:', deleteCommentResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ 文本评论接口测试失败:', error.response?.data?.message || error.message);
  }
}

// 测试版本管理接口
async function testVersionAPIs(testData) {
  console.log('\n=== 测试版本管理接口 ===');
  
  try {
    // 1. 保存文档（自动创建版本）
    console.log('\n1. 保存文档（自动创建版本）');
    const saveResponse = await axios.post(`${BASE_URL}/documents/save`, {
      userId: testData.userId,
      documentId: testData.documentId,
      newContent: '这是第一个版本的内容 - ' + new Date().toLocaleString(),
      updateTime: new Date().toISOString()
    });
    console.log('✅ 保存文档成功:', saveResponse.data.message);
    console.log('   版本号:', saveResponse.data.data.versionNumber);
    console.log('   差异:', saveResponse.data.data.diff);
    
    // 2. 再次保存文档（创建第二个版本）
    console.log('\n2. 再次保存文档（创建第二个版本）');
    const saveResponse2 = await axios.post(`${BASE_URL}/documents/save`, {
      userId: testData.userId,
      documentId: testData.documentId,
      newContent: '这是第二个版本的内容，内容增加了 - ' + new Date().toLocaleString(),
      updateTime: new Date().toISOString()
    });
    console.log('✅ 保存文档成功:', saveResponse2.data.message);
    console.log('   版本号:', saveResponse2.data.data.versionNumber);
    console.log('   差异:', saveResponse2.data.data.diff);
    
    // 3. 查看版本列表
    console.log('\n3. 查看版本列表');
    const getVersionsResponse = await axios.get(`${BASE_URL}/versions/${testData.documentId}`);
    console.log('✅ 获取版本列表成功:', getVersionsResponse.data.message);
    console.log('   版本数量:', getVersionsResponse.data.data.length);
    
    // 4. 获取特定版本内容
    console.log('\n4. 获取特定版本内容');
    const versionNumber = getVersionsResponse.data.data[0]?.versionNumber || 1;
    const getVersionContentResponse = await axios.get(`${BASE_URL}/versions/${testData.documentId}/${versionNumber}`);
    console.log('✅ 获取版本内容成功:', getVersionContentResponse.data.message);
    console.log('   版本内容长度:', getVersionContentResponse.data.data.content.length);
    
    // 5. 回退版本（如果有多个版本）
    if (getVersionsResponse.data.data.length > 1) {
      console.log('\n5. 回退版本');
      const targetVersion = getVersionsResponse.data.data[1]?.versionNumber || 1;
      const rollbackResponse = await axios.post(`${BASE_URL}/versions/${testData.documentId}/${targetVersion}/rollback`, {
        userId: testData.userId
      });
      console.log('✅ 回退版本成功:', rollbackResponse.data.message);
      console.log('   新版本号:', rollbackResponse.data.data.newVersionNumber);
    }
    
  } catch (error) {
    console.error('❌ 版本管理接口测试失败:', error.response?.data?.message || error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始API测试...\n');
  
  try {
    // 获取测试数据
    const testData = await getTestData();
    console.log('📋 测试数据:', testData);
    console.log('');
    
    // 运行测试
    await testDocumentAPIs(testData);
    await testTextCommentAPIs(testData);
    await testVersionAPIs(testData);
    
    console.log('\n🎉 === 所有测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试运行失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testDocumentAPIs,
  testTextCommentAPIs,
  testVersionAPIs,
  runAllTests
}; 