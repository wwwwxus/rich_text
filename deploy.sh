#!/bin/bash

# 部署脚本
set -e

echo "🚀 开始部署知识库管理系统..."

# 检查环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install --production

# 创建日志目录
mkdir -p logs

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在，请创建环境变量文件"
    echo "📝 示例配置："
    echo "DB_HOST=localhost"
    echo "DB_USER=your_username"
    echo "DB_PASSWORD=your_password"
    echo "DB_NAME=your_database"
    echo "JWT_SECRET=your_jwt_secret"
    echo "PORT=3000"
    exit 1
fi

# 停止旧进程
echo "🔄 停止旧进程..."
pm2 stop rich-text-knowledge-base 2>/dev/null || true

# 启动新进程
echo "🚀 启动应用..."
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup

echo "✅ 部署完成！"
echo "📊 查看状态: pm2 status"
echo "📋 查看日志: pm2 logs rich-text-knowledge-base"
echo "🔄 重启应用: pm2 restart rich-text-knowledge-base" 