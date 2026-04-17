const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase client for storage
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'blog-images';

// Use memory storage - files are uploaded to Supabase Storage, not local disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持图片文件 (JPG, PNG, WebP, GIF)'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter,
});

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
async function uploadToSupabase(file) {
  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new Error(`存储上传失败: ${error.message}`);

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL or filename.
 */
async function deleteFromSupabase(urlOrFilename) {
  if (!urlOrFilename) return;

  let filename = urlOrFilename;

  // Extract filename from full public URL
  const bucketPublicPrefix = `/storage/v1/object/public/${BUCKET}/`;
  const idx = urlOrFilename.indexOf(bucketPublicPrefix);
  if (idx !== -1) {
    filename = urlOrFilename.substring(idx + bucketPublicPrefix.length);
  } else if (urlOrFilename.startsWith('/uploads/')) {
    // Legacy local path - skip deletion from storage
    return;
  }

  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([filename]);
  if (error) console.warn(`删除 Storage 文件失败: ${error.message}`);
}

module.exports = upload;
module.exports.uploadToSupabase = uploadToSupabase;
module.exports.deleteFromSupabase = deleteFromSupabase;
