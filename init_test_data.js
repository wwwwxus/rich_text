const sequelize = require('./src/config/database');
const User = require('./src/models/User');
const KnowledgeBase = require('./src/models/KnowledgeBase');
const Folder = require('./src/models/Folder');
const Document = require('./src/models/Document');

// 初始化测试数据
async function initTestData() {
  try {
    console.log('? 开始初始化测试数据...\n');

    // 1. 创建测试用户
    console.log('1. 创建测试用户...');
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('? 测试用户创建成功:', testUser.username);

    // 2. 创建测试知识库
    console.log('\n2. 创建测试知识库...');
    const testKnowledgeBase = await KnowledgeBase.create({
      name: '测试知识库',
      description: '这是一个用于测试的知识库',
      ownerId: testUser.id
    });
    console.log('? 测试知识库创建成功:', testKnowledgeBase.name);

    // 3. 创建测试文件夹
    console.log('\n3. 创建测试文件夹...');
    const testFolder = await Folder.create({
      name: '测试文件夹',
      knowledgeBaseId: testKnowledgeBase.id,
      parentFolderId: null
    });
    console.log('? 测试文件夹创建成功:', testFolder.name);

    // 4. 创建测试文档
    console.log('\n4. 创建测试文档...');
    const testDocument = await Document.create({
      title: '测试文档',
      content: '这是一个测试文档的内容。\n\n你可以在这里编辑和添加内容。',
      ownerId: testUser.id,
      knowledgeBaseId: testKnowledgeBase.id,
      folderId: testFolder.id,
      isActive: true
    });
    console.log('? 测试文档创建成功:', testDocument.title);

    console.log('\n? 测试数据汇总:');
    console.log(`   用户ID: ${testUser.id}`);
    console.log(`   知识库ID: ${testKnowledgeBase.id}`);
    console.log(`   文件夹ID: ${testFolder.id}`);
    console.log(`   文档ID: ${testDocument.id}`);

    console.log('\n? 测试数据初始化完成！');
    console.log('\n现在可以运行以下命令测试API:');
    console.log('   node test_document_api.js');

  } catch (error) {
    console.error('? 初始化测试数据失败:', error.message);
    
    // 如果是重复数据错误，提供清理建议
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('\n? 提示: 测试数据可能已存在，可以运行以下命令清理:');
      console.log('   node init_test_data.js clean');
    }
  } finally {
    await sequelize.close();
  }
}

// 清理测试数据
async function cleanTestData() {
  try {
    console.log('? 开始清理测试数据...\n');

    // 删除测试文档
    const deletedDocs = await Document.destroy({
      where: {
        title: '测试文档'
      }
    });
    console.log(`? 删除测试文档: ${deletedDocs} 个`);

    // 删除测试文件夹
    const deletedFolders = await Folder.destroy({
      where: {
        name: '测试文件夹'
      }
    });
    console.log(`? 删除测试文件夹: ${deletedFolders} 个`);

    // 删除测试知识库
    const deletedKBs = await KnowledgeBase.destroy({
      where: {
        name: '测试知识库'
      }
    });
    console.log(`? 删除测试知识库: ${deletedKBs} 个`);

    // 删除测试用户
    const deletedUsers = await User.destroy({
      where: {
        email: 'test@example.com'
      }
    });
    console.log(`? 删除测试用户: ${deletedUsers} 个`);

    console.log('\n? 测试数据清理完成！');

  } catch (error) {
    console.error('? 清理测试数据失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

// 主函数
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      await initTestData();
      break;
    case 'clean':
      await cleanTestData();
      break;
    default:
      console.log('? 使用方法:');
      console.log('   node init_test_data.js init   - 初始化测试数据');
      console.log('   node init_test_data.js clean  - 清理测试数据');
      console.log('\n? 建议先运行 init 命令初始化测试数据');
      break;
  }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  initTestData,
  cleanTestData
}; 