// index.js - Main entry point for the video generator service
require('dotenv').config();

const environment = process.env.NODE_ENV || 'development';

console.log(`🚀 Starting Video Generator Service in ${environment} mode...`);

// Route to appropriate server based on environment and configuration
if (process.env.USE_LEGACY_SERVER === 'true') {
  // Use the original server.js for backward compatibility
  console.log('📡 Using legacy server (server.js)');
  require('./server.js');
} else {
  // Use the production-ready server (default)
  console.log('🏭 Using production server (production_server.js)');
  require('./production_server.js');
}