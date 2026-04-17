# 部署方案：Cloudflare Pages（纯前端）+ Supabase（后端 + 存储）

## 方案说明

由于 Cloudflare Pages 更适合静态站点，而我们的博客有 Node.js 后端，
最佳方案是将项目改造为：前端纯静态 + Supabase 直接提供 API。

这样前端部署在 Cloudflare Pages（国内可访问），后端由 Supabase 提供。

## 架构

```
用户浏览器 → Cloudflare Pages（前端 HTML/CSS/JS）
                ↓
            Supabase（数据库 + 文件存储 + Auth）
```

## 优点
- 国内访问稳定快速
- 完全免费
- 后台功能完整可用
- 无需服务器维护

## 你需要做的事情

### 1. 创建 Supabase 项目
1. 访问 https://supabase.com/dashboard
2. 注册/登录
3. 点击 "New Project"
4. 等待数据库初始化（约2分钟）

### 2. 运行 SQL 脚本
1. 打开项目，点击左侧 "SQL Editor"
2. 打开文件 `supabase-init.sql`，复制全部内容
3. 粘贴到 SQL Editor，点击 "Run"

### 3. 创建 Storage Bucket
1. 点击左侧 "Storage"
2. 点击 "New Bucket"
3. 名称：`blog-images`，勾选 "Public bucket"
4. 创建

### 4. 设置 Storage 策略
1. 在 Storage > blog-images > Policies
2. 添加以下策略：
   - SELECT: public
   - INSERT/UPDATE/DELETE: authenticated users only

### 5. 创建管理员账号
1. 点击左侧 "Authentication" > "Users"
2. 点击 "Add user"
3. Email: `admin@pepeyuan.blog`
4. Password: 你的管理员密码
5. 点击 "Verify email"

### 6. 获取密钥
在 Settings > API 页面，复制：
- Project URL（如 `https://xxxxx.supabase.co`）
- anon public key
- service_role key

### 7. 部署前端到 Cloudflare Pages
1. 访问 https://pages.cloudflare.com
2. 连接你的 GitHub 仓库
3. 构建设置：
   - Build command: 留空（纯静态）
   - Output directory: `.`（根目录）

## 环境变量

部署后需要在 Cloudflare Pages 设置环境变量：
- SUPABASE_URL=你的项目URL
- SUPABASE_ANON_KEY=你的anon密钥
