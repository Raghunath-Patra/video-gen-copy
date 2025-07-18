// tmp_cleaner.js - Complete /tmp cleaner script
const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');

class TmpCleaner {
  constructor() {
    this.tmpPaths = [
      '/tmp/uploads',
      '/tmp/temp', 
      '/tmp/output',
      '/tmp/*.js', // All JS files in /tmp
      '/tmp/*.wav' // The audio files in /tmp
    ];
    
    this.stats = {
      totalDeleted: 0,
      totalSizeFreed: 0,
      lastCleanup: null,
      errors: []
    };
  }

  // Clear everything in /tmp directories
  async clearAll() {
    console.log('🧹 Starting complete /tmp cleanup...');
    
    const results = {
      deleted: [],
      errors: [],
      totalSize: 0
    };

    try {
      // Just clear everything in /tmp directory
      const tmpDir = '/tmp';
      
      if (!existsSync(tmpDir)) {
        console.log('⚠️ /tmp directory not found');
        return results;
      }

      const entries = await fs.readdir(tmpDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(tmpDir, entry.name);
        
        try {
          const stats = await fs.stat(fullPath);
          const size = stats.size || 0;
          
          if (entry.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true });
            results.deleted.push({ path: fullPath, type: 'directory', size });
          } else {
            await fs.unlink(fullPath);
            results.deleted.push({ path: fullPath, type: 'file', size });
          }
          
          results.totalSize += size;
          
        } catch (error) {
          results.errors.push({ path: fullPath, error: error.message });
        }
      }
      
    } catch (error) {
      results.errors.push({ path: '/tmp', error: error.message });
    }

    // Update stats
    this.stats.totalDeleted += results.deleted.length;
    this.stats.totalSizeFreed += results.totalSize;
    this.stats.lastCleanup = new Date().toISOString();
    this.stats.errors = results.errors;

    console.log(`✅ Cleanup complete: ${results.deleted.length} items deleted, ${this.formatSize(results.totalSize)} freed`);
    
    if (results.errors.length > 0) {
      console.warn(`⚠️ ${results.errors.length} errors occurred during cleanup`);
    }

    return results;
  }

  // Clear all contents of a directory but keep the directory itself
  async clearDirectory(dirPath) {
    const results = { deleted: [], errors: [], totalSize: 0 };

    try {
      if (!existsSync(dirPath)) {
        return results;
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          const stats = await fs.stat(fullPath);
          const size = stats.size || 0;
          
          if (entry.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true });
            results.deleted.push({ path: fullPath, type: 'directory', size });
          } else {
            await fs.unlink(fullPath);
            results.deleted.push({ path: fullPath, type: 'file', size });
          }
          
          results.totalSize += size;
          
        } catch (error) {
          results.errors.push({ path: fullPath, error: error.message });
        }
      }
      
    } catch (error) {
      results.errors.push({ path: dirPath, error: error.message });
    }

    return results;
  }

  // Clear all JS files in /tmp
  async clearTempScriptFiles() {
    const results = { deleted: [], errors: [], totalSize: 0 };

    try {
      const tmpDir = '/tmp';
      if (!existsSync(tmpDir)) {
        return results;
      }

      const entries = await fs.readdir(tmpDir);
      
      for (const entry of entries) {
        // Match all *.js files
        if (entry.endsWith('.js')) {
          const fullPath = path.join(tmpDir, entry);
          
          try {
            const stats = await fs.stat(fullPath);
            const size = stats.size || 0;
            
            await fs.unlink(fullPath);
            results.deleted.push({ path: fullPath, type: 'file', size });
            results.totalSize += size;
            
          } catch (error) {
            results.errors.push({ path: fullPath, error: error.message });
          }
        }
      }
      
    } catch (error) {
      results.errors.push({ path: '/tmp', error: error.message });
    }

    return results;
  }

  // Get current /tmp usage
  async getTmpUsage() {
    const usage = {};
    
    for (const tmpPath of ['/tmp/uploads', '/tmp/temp', '/tmp/output']) {
      try {
        if (existsSync(tmpPath)) {
          const stats = await this.calculateDirectorySize(tmpPath);
          usage[path.basename(tmpPath)] = {
            exists: true,
            size: stats.size,
            files: stats.files,
            directories: stats.directories,
            formatted: this.formatSize(stats.size)
          };
        } else {
          usage[path.basename(tmpPath)] = { exists: false, size: 0, files: 0, directories: 0 };
        }
      } catch (error) {
        usage[path.basename(tmpPath)] = { error: error.message };
      }
    }

    // Count all JS files
    try {
      const jsFiles = await this.countTempScriptFiles();
      usage.js_files = jsFiles;
    } catch (error) {
      usage.js_files = { error: error.message };
    }

    return usage;
  }

  // Count all JS files in /tmp
  async countTempScriptFiles() {
    let count = 0;
    let totalSize = 0;

    try {
      const tmpDir = '/tmp';
      if (existsSync(tmpDir)) {
        const entries = await fs.readdir(tmpDir);
        
        for (const entry of entries) {
          // Count all *.js files
          if (entry.endsWith('.js')) {
            const fullPath = path.join(tmpDir, entry);
            try {
              const stats = await fs.stat(fullPath);
              count++;
              totalSize += stats.size || 0;
            } catch (error) {
              // Skip files that can't be read
            }
          }
        }
      }
    } catch (error) {
      // Skip if can't read directory
    }

    return {
      count,
      totalSize,
      formatted: this.formatSize(totalSize)
    };
  }

  // Calculate directory size recursively
  async calculateDirectorySize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;
    let dirCount = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          if (entry.isDirectory()) {
            dirCount++;
            const subStats = await this.calculateDirectorySize(fullPath);
            totalSize += subStats.size;
            fileCount += subStats.files;
            dirCount += subStats.directories;
          } else {
            fileCount++;
            const stats = await fs.stat(fullPath);
            totalSize += stats.size || 0;
          }
        } catch (error) {
          // Skip files/dirs that can't be read
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }

    return { size: totalSize, files: fileCount, directories: dirCount };
  }

  // Format bytes to human readable
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Get cleanup statistics
  getStats() {
    return {
      ...this.stats,
      tmpPaths: this.tmpPaths
    };
  }

  // Force cleanup with retries
  async forceCleanup(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const results = await this.clearAll();
        return results;
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(`⚠️ Cleanup attempt ${i + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

// Standalone script functionality
async function runCleanup() {
  const cleaner = new TmpCleaner();
  
  try {
    console.log('🚀 Starting /tmp cleanup...');
    
    // Show current usage
    const usage = await cleaner.getTmpUsage();
    console.log('\n📊 Current /tmp usage:');
    Object.entries(usage).forEach(([key, value]) => {
      if (value.exists) {
        console.log(`   ${key}: ${value.formatted} (${value.files} files, ${value.directories} dirs)`);
      } else if (value.count !== undefined) {
        console.log(`   ${key}: ${value.count} files (${value.formatted})`);
      } else {
        console.log(`   ${key}: Not found`);
      }
    });
    
    // Perform cleanup
    const results = await cleaner.clearAll();
    
    console.log('\n✅ Cleanup Results:');
    console.log(`   Files deleted: ${results.deleted.length}`);
    console.log(`   Space freed: ${cleaner.formatSize(results.totalSize)}`);
    console.log(`   Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => {
        console.log(`   ${error.path}: ${error.error}`);
      });
    }
    
    console.log(`\n📈 Total Stats:`);
    const stats = cleaner.getStats();
    console.log(`   Total items deleted: ${stats.totalDeleted}`);
    console.log(`   Total space freed: ${cleaner.formatSize(stats.totalSizeFreed)}`);
    console.log(`   Last cleanup: ${stats.lastCleanup}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Express middleware for automatic cleanup
function createCleanupMiddleware() {
  const cleaner = new TmpCleaner();
  
  return {
    // Cleanup after successful operations
    cleanupAfterSuccess: async (req, res, next) => {
      res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            await cleaner.clearAll();
            console.log('✅ Auto-cleanup completed after successful operation');
          } catch (error) {
            console.error('❌ Auto-cleanup failed:', error);
          }
        }
      });
      next();
    },
    
    // Cleanup after any operation (success or failure)
    cleanupAfterAll: async (req, res, next) => {
      res.on('finish', async () => {
        try {
          await cleaner.clearAll();
          console.log('✅ Auto-cleanup completed');
        } catch (error) {
          console.error('❌ Auto-cleanup failed:', error);
        }
      });
      next();
    },
    
    // Manual cleanup endpoint
    cleanupEndpoint: async (req, res) => {
      try {
        const results = await cleaner.clearAll();
        res.json({
          success: true,
          message: 'Cleanup completed',
          results: {
            deleted: results.deleted.length,
            errors: results.errors.length,
            sizeFreed: cleaner.formatSize(results.totalSize)
          },
          stats: cleaner.getStats()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    },
    
    // Usage stats endpoint
    statsEndpoint: async (req, res) => {
      try {
        const usage = await cleaner.getTmpUsage();
        const stats = cleaner.getStats();
        
        res.json({
          success: true,
          usage,
          stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  };
}

// Export for use in other files
module.exports = { TmpCleaner, createCleanupMiddleware };

// Run as standalone script
if (require.main === module) {
  runCleanup();
}