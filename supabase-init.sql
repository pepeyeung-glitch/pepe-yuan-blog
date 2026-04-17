-- ============================================
-- Pepe & Yuan Blog - Supabase Database Setup
-- ============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

-- 1. Entries table (博客文章)
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  image TEXT,
  date DATE NOT NULL,
  location TEXT,
  category TEXT CHECK (category IN ('travel', 'wedding', 'daily')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Homepage config table (首页配置)
CREATE TABLE IF NOT EXISTS homepage_config (
  id SERIAL PRIMARY KEY,
  hero_image TEXT,
  title TEXT NOT NULL,
  subtitle TEXT,
  quote TEXT,
  cta_text TEXT,
  cta_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. About page config table (关于页面配置)
CREATE TABLE IF NOT EXISTS about_config (
  id SERIAL PRIMARY KEY,
  heading TEXT NOT NULL,
  paragraphs TEXT[],
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Messages table (留言)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries (date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_category ON entries (category);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 7. Create policies
-- Entries: public can read, authenticated can CRUD
CREATE POLICY "Entries are publicly readable" ON entries
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage entries" ON entries
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Homepage: public can read, authenticated can update
CREATE POLICY "Homepage config is publicly readable" ON homepage_config
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage homepage" ON homepage_config
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- About: public can read, authenticated can update
CREATE POLICY "About config is publicly readable" ON about_config
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage about" ON about_config
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Messages: public can insert, authenticated can read/delete
CREATE POLICY "Anyone can submit messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view messages" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete messages" ON messages
  FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homepage_updated_at BEFORE UPDATE ON homepage_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_about_updated_at BEFORE UPDATE ON about_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert default homepage config (if empty)
INSERT INTO homepage_config (hero_image, title, subtitle, quote, cta_text, cta_link)
SELECT '/uploads/cover.jpg', 'FROM AFRICA TO SHENZHEN', '从我们跨越大陆的相遇，到在深圳共同生活的每一天，这里记录着我们的爱情故事、珍贵瞬间与共同冒险', '爱，就是和你一起走', '浏览我们的旅程', '/timeline.html'
WHERE NOT EXISTS (SELECT 1 FROM homepage_config);

-- 10. Insert default about config (if empty)
INSERT INTO about_config (heading, paragraphs, image)
SELECT '我们的故事', ARRAY[
  '我们的故事开始于非洲大陆，那是我们生命交汇的起点。',
  '在内罗毕的初遇，让我们没有想到命运会将我们紧紧相连。',
  '从蒙巴萨的海风到桑给巴尔的日落，我们一起探索未知的世界。',
  '2025年，我们来到广州，开始了新的生活篇章。',
  '旅途中，我们一起去了泰国，留下了美好的回忆。',
  '2026年，我们定居在深圳，大梅沙的海滩成了我们的新家。',
  '我们还一起去了柬埔寨，在吴哥窟见证了日出的壮丽。',
  '这个网站是我们共同经历的记录，希望我们的故事能给你带来一点点温暖。'
], '/uploads/about.jpg'
WHERE NOT EXISTS (SELECT 1 FROM about_config);

-- ============================================
-- Supabase Storage Setup
-- ============================================
-- Run these commands in Supabase Dashboard > Storage
-- Or use the Supabase SQL editor with extensions:

-- Create storage buckets (run via Supabase Dashboard UI or API):
-- 1. Go to Storage > New Bucket
-- 2. Create bucket named "blog-images" (public)
-- 3. Create bucket named "uploads" (public)

-- Storage policies (run in SQL Editor):
-- CREATE POLICY "Images are publicly accessible"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'blog-images');

-- CREATE POLICY "Authenticated users can upload images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can update images"
-- ON storage.objects FOR UPDATE
-- USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can delete images"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

-- ============================================
-- Admin User Setup
-- ============================================
-- You need to create an admin user in Supabase Auth:
-- 1. Go to Authentication > Users
-- 2. Add user with email: admin@pepeyuan.blog
-- 3. Set password: your-admin-password
-- 4. Verify the user

-- ============================================
-- Done!
-- ============================================
