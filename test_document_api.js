const axios = require('axios');
const sequelize = require('./src/config/database');
const User = require('./src/models/User');
const KnowledgeBase = require('./src/models/KnowledgeBase');

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

    return {
      userId: testUser.id,
      knowledgeBaseId: testKnowledgeBase.id
    };
  } catch (error) {
    console.error('获取测试数据失败:', error.message);
    process.exit(1);
  }
}

// 测试创建文档接口
async function testCreateDocument(testData) {
  console.log('=== 测试创建文档接口 ===');
  
  try {
    // 1. 创建文档（基本参数）
    console.log('\n1. 创建文档（基本参数）');
    const createResponse = await axios.post(`${BASE_URL}/documents/create`, {
      title: '测试文档 - ' + new Date().toLocaleString(),
      content: '这是一个测试文档的内容',
      ownerId: testData.userId,
      knowledgeBaseId: testData.knowledgeBaseId
    });
    
    console.log('? 创建文档成功:', createResponse.data.message);
    console.log('   文档ID:', createResponse.data.data.id);
    console.log('   文档标题:', createResponse.data.data.title);
    
    const documentId = createResponse.data.data.id;
    
    // 2. 创建文档（包含文件夹ID）
    console.log('\n2. 创建文档（包含文件夹ID）');
    const createWithFolderResponse = await axios.post(`${BASE_URL}/documents/create`, {
      title: '测试文档（带文件夹） - ' + new Date().toLocaleString(),
      content: '这是一个包含文件夹的测试文档',
      ownerId: testData.userId,
      knowledgeBaseId: testData.knowledgeBaseId,
      folderId: 1 // 假设文件夹ID为1
    });
    
    console.log('? 创建文档（带文件夹）成功:', createWithFolderResponse.data.message);
    console.log('   文档ID:', createWithFolderResponse.data.data.id);
    console.log('   文件夹ID:', createWithFolderResponse.data.data.folderId);
    
    // 3. 测试参数验证（缺少必填参数）
    console.log('\n3. 测试参数验证（缺少必填参数）');
    try {
      await axios.post(`${BASE_URL}/documents/create`, {
        title: '测试文档',
        // 缺少 ownerId 和 knowledgeBaseId
      });
    } catch (error) {
      console.log('? 参数验证正确:', error.response.data.message);
    }
    
    // 4. 测试参数验证（用户不存在）
    console.log('\n4. 测试参数验证（用户不存在）');
    try {
      await axios.post(`${BASE_URL}/documents/create`, {
        title: '测试文档',
        content: '测试内容',
        ownerId: 99999, // 不存在的用户ID
        knowledgeBaseId: testData.knowledgeBaseId
      });
    } catch (error) {
      console.log('? 用户验证正确:', error.response.data.message);
    }
    
    return documentId;
    
  } catch (error) {
    console.error('? 创建文档接口测试失败:', error.response?.data?.message || error.message);
    return null;
  }
}

// 测试获取文档列表接口
async function testGetDocumentList(testData) {
  console.log('\n=== 测试获取文档列表接口 ===');
  
  try {
    // 1. 获取知识库的所有文档
    console.log('\n1. 获取知识库的所有文档');
    const getAllResponse = await axios.get(`${BASE_URL}/documents/list/${testData.knowledgeBaseId}`);
    console.log('? 获取文档列表成功:', getAllResponse.data.message);
    console.log('   文档数量:', getAllResponse.data.data.length);
    
    // 2. 获取指定用户的文档
    console.log('\n2. 获取指定用户的文档');
    const getUserDocsResponse = await axios.get(`${BASE_URL}/documents/list/${testData.knowledgeBaseId}/${testData.userId}`);
    console.log('? 获取用户文档成功:', getUserDocsResponse.data.message);
    console.log('   用户文档数量:', getUserDocsResponse.data.data.length);
    
    // 显示文档列表
    if (getAllResponse.data.data.length > 0) {
      console.log('\n   文档列表:');
      getAllResponse.data.data.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title} (ID: ${doc.id}, 拥有者: ${doc.ownerName})`);
      });
    }
    
  } catch (error) {
    console.error('? 获取文档列表接口测试失败:', error.response?.data?.message || error.message);
  }
}

// 测试获取文档内容接口
async function testGetDocumentContent(testData, documentId) {
  console.log('\n=== 测试获取文档内容接口 ===');
  
  if (!documentId) {
    console.log('? 没有可用的文档ID，跳过测试');
    return;
  }
  
  try {
    // 获取文档内容
    console.log('\n1. 获取文档内容');
    const getContentResponse = await axios.get(`${BASE_URL}/documents/${documentId}/${testData.userId}`);
    console.log('? 获取文档内容成功:', getContentResponse.data.message);
    console.log('   文档标题:', getContentResponse.data.data.title);
    console.log('   文档内容长度:', getContentResponse.data.data.content.length);
    
  } catch (error) {
    console.error('? 获取文档内容接口测试失败:', error.response?.data?.message || error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('? 开始文档API测试...\n');
  
  try {
    // 获取测试数据
    const testData = await getTestData();
    console.log('? 测试数据:', testData);
    console.log('');
    
    // 运行测试
    const documentId = await testCreateDocument(testData);
    await testGetDocumentList(testData);
    await testGetDocumentContent(testData, documentId);
    
    console.log('\n? === 所有文档API测试完成 ===');
    
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
  testCreateDocument,
  testGetDocumentList,
  testGetDocumentContent
}; 