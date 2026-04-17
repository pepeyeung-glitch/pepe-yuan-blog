require('dotenv').config();
const bcrypt = require('bcryptjs');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

module.exports = {
  port: process.env.PORT || 3000,
  session: {
    secret: process.env.SESSION_SECRET || 'changeme-in-production',
  },
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    passwordHash: process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync(ADMIN_PASSWORD, 10),
  },
  ai: {
    apiUrl: process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
  },
};
