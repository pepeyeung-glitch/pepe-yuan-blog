// Supabase Storage service for file uploads
const { supabaseAdmin } = require('../config/supabase');
const path = require('path');

const BUCKET_NAME = 'blog-images';

async function uploadFile(file, customPath = null) {
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
  const filePath = customPath || `uploads/${fileName}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: publicUrl
  };
}

async function deleteFile(filePath) {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) throw error;
  return true;
}

function getPublicUrl(filePath) {
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);
  
  return publicUrl;
}

module.exports = {
  uploadFile,
  deleteFile,
  getPublicUrl,
  BUCKET_NAME,
};
