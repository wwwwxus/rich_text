# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装项目依赖
RUN npm ci --only=production

# 复制项目源代码
COPY src/ ./src/

# 创建日志目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"] 