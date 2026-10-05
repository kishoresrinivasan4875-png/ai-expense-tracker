const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || '',
  sessionSecret: process.env.SESSION_SECRET || '',
  aiApiKey: process.env.AI_API_KEY || ''
};
