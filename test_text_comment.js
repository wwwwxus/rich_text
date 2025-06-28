const axios = require('axios');

const BASE_URL = 'http://localhost:3300/api';

async function testTextCommentAPI() {
  console.log('? 测试文本评论接口...\n');

  try {
    // 1. 测试获取指定文本的评论
    console.log('1. 测试获取指定文本的评论');
    const textNanoid = 'test_text_1751100642745';
    
    const response1 = await axios.get(`${BASE_URL}/text-comments/${textNanoid}`);
    
    console.log('? 获取指定文本评论成功');
    console.log('状态码:', response1.status);
    console.log('响应数据:', JSON.stringify(response1.data, null, 2));
    
    // 2. 测试获取文档的所有评论
    console.log('\n2. 测试获取文档的所有评论');
    const documentId = 2; // 使用测试数据中的文档ID
    
    const response2 = await axios.get(`${BASE_URL}/text-comments/document/${documentId}`);
    
    console.log('? 获取文档评论成功');
    console.log('状态码:', response2.status);
    console.log('响应数据:', JSON.stringify(response2.data, null, 2));
    
  } catch (error) {
    console.log('? 请求失败');
    console.log('状态码:', error.response?.status);
    console.log('错误信息:', error.response?.data);
    console.log('完整错误:', error.message);
  }
}

testTextCommentAPI(); 