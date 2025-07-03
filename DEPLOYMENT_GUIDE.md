# 🚀 知识库管理系统部署指南

## 目录

- [服务器环境准备](#服务器环境准备)
- [方式一：传统部署](#方式一传统部署)
- [方式二：Docker 容器部署](#方式二docker容器部署)
- [SSL 证书配置](#ssl证书配置)
- [监控和维护](#监控和维护)
- [性能优化](#性能优化)
- [故障排查](#故障排查)

## 服务器环境准备

### 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Amazon Linux 2
- **内存**: 最少 2GB，推荐 4GB+
- **存储**: 最少 20GB，推荐 50GB+
- **网络**: 公网 IP，开放 80、443、3000 端口

### 安装基础环境

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl wget git nginx mysql-server

# CentOS/RHEL
sudo yum update
sudo yum install -y curl wget git nginx mysql-server

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

## 方式一：传统部署

### 1. 上传项目文件

```bash
# 在服务器上创建项目目录
sudo mkdir -p /var/www/rich-text-kb
sudo chown $USER:$USER /var/www/rich-text-kb
cd /var/www/rich-text-kb

# 上传项目文件（选择一种方式）
# 方式1: 使用Git
git clone https://your-repo-url.git .

# 方式2: 使用SCP上传
# 在本地执行：scp -r ./rich_text/* user@server:/var/www/rich-text-kb/
```

### 2. 安装 PM2 进程管理器

```bash
sudo npm install -g pm2
```

### 3. 配置数据库

```bash
# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 配置MySQL安全设置
sudo mysql_secure_installation

# 创建数据库和用户
sudo mysql -u root -p
```

```sql
-- 在MySQL命令行中执行
CREATE DATABASE rich_text_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rich_text_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON rich_text_db.* TO 'rich_text_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

-- 导入数据库结构
mysql -u rich_text_user -p rich_text_db < database.sql
```

### 4. 配置环境变量

```bash
# 创建生产环境配置
cat > .env << EOF
DB_HOST=localhost
DB_USER=rich_text_user
DB_PASSWORD=your_secure_password
DB_NAME=rich_text_db
JWT_SECRET=$(openssl rand -base64 32)
PORT=3000
NODE_ENV=production
EOF
```

### 5. 部署应用

```bash
# 使用部署脚本
chmod +x deploy.sh
./deploy.sh

# 或手动部署
npm install --production
mkdir -p logs
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 6. 配置 Nginx 反向代理

```bash
# 创建Nginx配置
sudo cat > /etc/nginx/sites-available/rich-text-kb << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 50M;
    }

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/rich-text-kb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 方式二：Docker 容器部署

### 1. 安装 Docker 和 Docker Compose

```bash
# Ubuntu
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# 重新登录以使用户组生效
```

### 2. 准备项目文件

```bash
# 上传项目到服务器
mkdir -p /opt/rich-text-kb
cd /opt/rich-text-kb
# 上传所有项目文件包括 docker-compose.yml
```

### 3. 配置 Docker Compose

```bash
# 编辑 docker-compose.yml 中的密码和域名
# 修改以下变量：
# - DB_PASSWORD
# - MYSQL_PASSWORD
# - MYSQL_ROOT_PASSWORD
# - JWT_SECRET
# - server_name in nginx.conf
```

### 4. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

## SSL 证书配置

### 使用 Let's Encrypt 免费证书

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书（传统部署）
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 对于Docker部署，需要先获取证书
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
mkdir -p ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*

# 重启服务
docker-compose restart nginx
```

### 自动续期

```bash
# 添加自动续期任务
sudo crontab -e

# 添加以下行（每天检查证书是否需要续期）
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

## 监控和维护

### 1. 日志管理

```bash
# PM2日志（传统部署）
pm2 logs rich-text-knowledge-base

# Docker日志
docker-compose logs -f app

# 系统日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. 性能监控

```bash
# 安装监控工具
sudo npm install -g pm2-logrotate

# 配置日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 3. 数据库备份

```bash
# 创建备份脚本
cat > backup-db.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p \$BACKUP_DIR

# 备份数据库
mysqldump -u rich_text_user -p'your_secure_password' rich_text_db > \$BACKUP_DIR/rich_text_db_\$DATE.sql

# 保留最近30天的备份
find \$BACKUP_DIR -name "rich_text_db_*.sql" -mtime +30 -delete

echo "数据库备份完成: rich_text_db_\$DATE.sql"
EOF

chmod +x backup-db.sh

# 添加定时任务（每天凌晨2点备份）
crontab -e
# 添加：0 2 * * * /path/to/backup-db.sh
```

## 性能优化

### 1. MySQL 优化

```bash
# 编辑MySQL配置
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# 添加优化配置
[mysqld]
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
max_connections = 200
query_cache_type = 1
query_cache_size = 64M
```

### 2. Nginx 优化

```bash
# 编辑Nginx配置
sudo nano /etc/nginx/nginx.conf

# 添加性能优化配置
worker_processes auto;
worker_connections 2048;

http {
    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # 缓存配置
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
```

### 3. 应用层优化

```bash
# 增加PM2实例数（多核CPU）
pm2 scale rich-text-knowledge-base 2

# 启用集群模式
# 修改 ecosystem.config.js
instances: 'max',  # 或具体数字
exec_mode: 'cluster'
```

## 故障排查

### 1. 常见问题

```bash
# 检查服务状态
pm2 status                    # PM2进程状态
systemctl status nginx       # Nginx状态
systemctl status mysql       # MySQL状态
docker-compose ps            # Docker服务状态

# 检查端口占用
netstat -tlnp | grep :3000
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

### 2. 重启服务

```bash
# 传统部署
pm2 restart rich-text-knowledge-base
sudo systemctl restart nginx
sudo systemctl restart mysql

# Docker部署
docker-compose restart
docker-compose restart app
docker-compose restart nginx
docker-compose restart mysql
```

### 3. 查看详细日志

```bash
# 应用日志
pm2 logs rich-text-knowledge-base --lines 100
docker-compose logs app --tail=100

# 系统日志
sudo journalctl -u nginx -n 50
sudo journalctl -u mysql -n 50
```

## 安全建议

1. **防火墙配置**

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # 不直接暴露应用端口
```

2. **定期更新系统**

```bash
sudo apt update && sudo apt upgrade -y
```

3. **数据库安全**

- 使用强密码
- 限制数据库访问权限
- 定期备份数据

4. **应用安全**

- 使用 HTTPS
- 定期更新依赖包
- 监控异常日志

## 部署完成检查清单

- [ ] 服务器环境准备完成
- [ ] 数据库创建并导入结构
- [ ] 环境变量配置正确
- [ ] 应用成功启动
- [ ] Nginx 反向代理配置
- [ ] SSL 证书配置
- [ ] 防火墙设置
- [ ] 日志轮转配置
- [ ] 数据库备份脚本
- [ ] 监控告警设置

部署完成后，您的知识库管理系统将在 `https://your-domain.com` 上运行！
