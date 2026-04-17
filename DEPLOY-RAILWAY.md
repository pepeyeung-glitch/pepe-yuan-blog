# Pepe & Yuan Blog - Railway 部署指南

## 部署步骤（5分钟完成）

### 第1步：推送到 GitHub

```bash
cd /Users/pepeyeung/Documents/AI/qoder/pepe-yuan-blog
git init
git add .
git commit -m "Initial commit for Railway deployment"
# 在 GitHub 创建仓库后：
git remote add origin https://github.com/你的用户名/pepe-yuan-blog.git
git push -u origin main
```

### 第2步：在 Railway 创建项目

1. 访问 https://railway.app
2. 用 GitHub 账号登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择你的 `pepe-yuan-blog` 仓库
6. 点击 Deploy

### 第3步：添加 PostgreSQL 数据库

1. 在项目页面，点击 "New"
2. 选择 "Database" → "Add PostgreSQL"
3. 等待数据库创建完成（约30秒）
4. Railway 会自动注入 `DATABASE_URL` 环境变量

### 第4步：初始化数据库

1. 点击 PostgreSQL 卡片进入数据库页面
2. 点击 "Settings" → "Copy" 复制 `DATABASE_URL`
3. 在终端运行：
```bash
# 替换为你自己的 DATABASE_URL
export DATABASE_URL="postgresql://..."
psql $DATABASE_URL -f migrate-data.sql
```

或者使用 Railway 的 Data 页面直接粘贴 `migrate-data.sql` 的内容执行。

### 第5步：设置环境变量

在 Railway 项目设置 → Variables 中添加：

| 变量名 | 值 |
|--------|-----|
| `SESSION_SECRET` | 任意随机字符串（如 `my-secret-key-123`） |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | 你的管理员密码 |
| `JWT_SECRET` | 任意随机字符串 |

### 第6步：部署完成

Railway 会自动重新部署，访问分配的域名即可查看网站。

## 绑定自定义域名

1. 在 Railway 项目页面点击 "Settings"
2. 找到 "Domains" 部分
3. 点击 "Add Custom Domain"
4. 输入你的域名（如 `blog.pepeyuan.com`）
5. 按照提示在你的域名注册商处添加 DNS 记录

## 免费额度

Railway 免费计划：
- 每月 500 小时运行时间（足够 24/7 运行一个项目）
- 5GB 磁盘空间
- PostgreSQL 数据库 5GB

## 本地开发

```bash
# 不使用数据库（文件存储模式）
npm start

# 使用 PostgreSQL（生产模式）
DATABASE_URL=postgresql://... npm start
```
