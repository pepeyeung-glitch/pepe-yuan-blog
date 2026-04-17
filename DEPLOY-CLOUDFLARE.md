# 部署到 Cloudflare Workers + Supabase 指南

## 概述
- **后端 API**: Cloudflare Workers（Node.js 兼容运行时，国内 CDN 覆盖好）
- **数据库和存储**: Supabase（免费 PostgreSQL + 对象存储）
- **前端静态文件**: Cloudflare Pages（国内访问速度快）

## 前置条件
1. Supabase 账号（https://supabase.com）
2. Cloudflare 账号（https://dash.cloudflare.com）
3. Node.js 16+

## 第一步：创建 Supabase 项目

1. 登录 Supabase (https://supabase.com)
2. 点击 "New Project"
3. 填写项目信息：
   - Project name: `pepe-yuan-blog`
   - Database password: 设置一个强密码（请保存好）
   - Region: 选择离你最近的区域（建议 `East Asia (Tokyo)` 或 `South East Asia (Singapore)`）
4. 等待项目创建完成（约 1-2 分钟）

## 第二步：获取 Supabase 凭证

1. 进入 Supabase 项目 → Settings (设置图标) → API
2. 复制以下信息：
   - **Project URL**: 类似 `https://xxxxx.supabase.co`
   - **anon public**: 公开的 anon key
   - **service_role**: 管理员 key（保密，只在后端使用）

## 第三步：初始化数据库

1. 在 Supabase 项目中，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 执行数据库初始化 SQL（见下方）

### 数据库初始化 SQL

```sql
-- 创建 entries 表
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  story TEXT,
  image TEXT,
  date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  category TEXT DEFAULT 'travel',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 homepage_config 表
CREATE TABLE IF NOT EXISTS homepage_config (
  id SERIAL PRIMARY KEY,
  hero_image TEXT,
  title TEXT,
  subtitle TEXT,
  quote TEXT,
  cta_text TEXT,
  cta_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 about_config 表
CREATE TABLE IF NOT EXISTS about_config (
  id SERIAL PRIMARY KEY,
  heading TEXT,
  content_title TEXT,
  top_paragraphs TEXT[] DEFAULT '{}',
  bottom_paragraphs TEXT[] DEFAULT '{}',
  mid_image TEXT,
  hero_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 messages 表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 session 表（用于 express-session）
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);
CREATE INDEX IF NOT EXISTS idx_entries_tags ON entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);

-- 设置 RLS 策略（Row Level Security）
-- 注意：由于我们通过 service_role 访问，可以暂时禁用 RLS 以简化部署
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE about_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

## 第四步：创建存储 Bucket

1. 在 Supabase 项目中，点击左侧 "Storage"
2. 点击 "New bucket"
3. 填写：
   - Name: `blog-images`
   - Public bucket: ✅ 勾选（公开访问）
4. 点击 "Create"

## 第五步：配置环境变量

在项目根目录创建 `.env.production` 文件：

```env
# Supabase 配置
SUPABASE_URL=你的 Project URL
SUPABASE_SERVICE_ROLE_KEY=你的 service_role key

# Session 配置
SESSION_SECRET=随机生成的强密钥（可以用随机字符串）

# 管理员账号
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你的管理员密码
```

## 第六步：安装 Wrangler CLI

```bash
npm install -g wrangler
```

## 第七步：Cloudflare Workers 部署

```bash
# 登录 Cloudflare
wrangler login

# 部署 Worker
wrangler deploy --env production
```

## 第八步：Cloudflare Pages 部署（前端）

1. 登录 Cloudflare Dashboard → Pages
2. 点击 "Create a project" → "Upload assets"
3. 上传 `public/` 目录的内容
4. 配置自定义域名（可选）

## 故障排查

### 数据库连接失败
- 检查 SUPABASE_URL 是否正确
- 检查 service_role key 是否正确
- 确认数据库表已创建

### 文件上传失败
- 确认 `blog-images` bucket 已创建且为 public
- 检查 RLS 策略

### CORS 错误
- 在 Cloudflare Workers 配置中检查 CORS headers

## 部署后的域名

- 后端 API: `https://pepe-yuan-blog.<你的账号>.workers.dev`
- 前端: `https://pepe-yuan-blog.pages.dev`
