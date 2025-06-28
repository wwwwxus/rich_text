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
      knowledgeBaseId: testKnowledgeBase.id
    };
  } catch (error) {
    console.error('获取测试数据失败:', error.message);
    process.exit(1);
  }
}

// 测试版本管理接口
async function testVersionAPIs(testData) {
  console.log('=== 测试版本管理接口 ===');
  
  try {
    // 1. 保存文档（自动创建版本）
    console.log('\n1. 保存文档（自动创建版本）');
    const saveResponse = await axios.post(`${BASE_URL}/documents/save`, {
      userId: testData.userId,
      documentId: testData.documentId,
      newContent: '这是第一个版本的内容 - ' + new Date().toLocaleString(),
      updateTime: new Date().toISOString()
    });
    
    console.log('? 保存文档成功:', saveResponse.data.message);
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
    
    console.log('? 保存文档成功:', saveResponse2.data.message);
    console.log('   版本号:', saveResponse2.data.data.versionNumber);
    console.log('   差异:', saveResponse2.data.data.diff);
    
    // 3. 查看版本列表
    console.log('\n3. 查看版本列表');
    const versionsResponse = await axios.get(`${BASE_URL}/versions/${testData.documentId}`);
    console.log('? 获取版本列表成功:', versionsResponse.data.message);
    console.log('   版本数量:', versionsResponse.data.data.length);
    
    // 显示版本列表
    if (versionsResponse.data.data.length > 0) {
      console.log('\n   版本列表:');
      versionsResponse.data.data.forEach((version, index) => {
        console.log(`   ${index + 1}. 版本 ${version.versionNumber} - ${version.diff} (${new Date(version.savedAt).toLocaleString()})`);
      });
    }
    
    // 4. 获取特定版本内容
    console.log('\n4. 获取特定版本内容');
    const versionNumber = versionsResponse.data.data[0]?.versionNumber || 1;
    const versionContentResponse = await axios.get(`${BASE_URL}/versions/${testData.documentId}/${versionNumber}`);
    console.log('? 获取版本内容成功:', versionContentResponse.data.message);
    console.log('   版本号:', versionContentResponse.data.data.versionNumber);
    console.log('   内容长度:', versionContentResponse.data.data.content.length);
    
    // 5. 回退版本（如果有多个版本）
    if (versionsResponse.data.data.length > 1) {
      console.log('\n5. 回退版本');
      const targetVersion = versionsResponse.data.data[1]?.versionNumber || 1;
      const rollbackResponse = await axios.post(`${BASE_URL}/versions/${testData.documentId}/${targetVersion}/rollback`, {
        userId: testData.userId
      });
      console.log('? 回退版本成功:', rollbackResponse.data.message);
      console.log('   回退到版本:', rollbackResponse.data.data.rollbackToVersion);
      console.log('   新版本号:', rollbackResponse.data.data.newVersionNumber);
    }
    
  } catch (error) {
    console.error('? 版本管理接口测试失败:', error.response?.data?.message || error.message);
  }
}

// 运行测试
async function runAllTests() {
  console.log('? 开始版本管理API测试...\n');
  
  try {
    // 获取测试数据
    const testData = await getTestData();
    console.log('? 测试数据:', testData);
    console.log('');
    
    // 运行测试
    await testVersionAPIs(testData);
    
    console.log('\n? === 版本管理API测试完成 ===');
    
  } catch (error) {
    console.error('? 测试运行失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testVersionAPIs
}; 