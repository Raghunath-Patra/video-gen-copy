// scripts/database-utils.js - Database utilities for production
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class DatabaseUtils {
  // Test database connection
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }
  
  // Check if required tables exist
  static async checkTables() {
    const requiredTables = [
      'projects',
      'speakers', 
      'visual_functions',
      'lesson_steps',
      'audio_files',
      'videos'
    ];
    
    try {
      for (const table of requiredTables) {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ Table '${table}' not found or accessible:`, error.message);
          return false;
        } else {
          console.log(`✅ Table '${table}' is accessible`);
        }
      }
      
      console.log('✅ All required tables are present');
      return true;
    } catch (error) {
      console.error('❌ Error checking tables:', error.message);
      return false;
    }
  }
  
  // Clean up old temporary files and orphaned records
  static async cleanup(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      console.log(`🧹 Cleaning up records older than ${daysOld} days...`);
      
      // Clean up projects without videos older than cutoff
      const { data: oldProjects, error: projectError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          created_at,
          videos (id)
        `)
        .lt('created_at', cutoffDate.toISOString())
        .is('videos.id', null);
      
      if (projectError) throw projectError;
      
      if (oldProjects && oldProjects.length > 0) {
        console.log(`Found ${oldProjects.length} old projects to clean up`);
        
        for (const project of oldProjects) {
          const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', project.id);
          
          if (deleteError) {
            console.error(`Failed to delete project ${project.id}:`, deleteError.message);
          } else {
            console.log(`Deleted old project: ${project.title}`);
          }
        }
      } else {
        console.log('No old projects found for cleanup');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error during cleanup:', error.message);
      return false;
    }
  }
  
  // Get database statistics
  static async getStats() {
    try {
      const stats = {};
      
      // Count projects by status
      const { data: projectStats, error: projectError } = await supabase
        .from('projects')
        .select('status')
        .then(({ data, error }) => {
          if (error) throw error;
          
          const statusCounts = data.reduce((acc, project) => {
            acc[project.status] = (acc[project.status] || 0) + 1;
            return acc;
          }, {});
          
          return { data: statusCounts, error: null };
        });
      
      if (projectError) throw projectError;
      stats.projects = projectStats;
      
      // Count total videos
      const { count: videoCount, error: videoError } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });
      
      if (videoError) throw videoError;
      stats.totalVideos = videoCount;
      
      // Count active users (users with projects in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activeUsers, error: userError } = await supabase
        .from('projects')
        .select('user_id')
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .then(({ data, error }) => {
          if (error) throw error;
          const uniqueUsers = new Set(data.map(p => p.user_id));
          return { data: uniqueUsers.size, error: null };
        });
      
      if (userError) throw userError;
      stats.activeUsers = activeUsers;
      
      console.log('📊 Database Statistics:');
      console.log(`   Projects: ${JSON.stringify(stats.projects, null, 2)}`);
      console.log(`   Total Videos: ${stats.totalVideos}`);
      console.log(`   Active Users (30 days): ${stats.activeUsers}`);
      
      return stats;
    } catch (error) {
      console.error('❌ Error getting database stats:', error.message);
      return null;
    }
  }
  
  // Migrate data (if needed for updates)
  static async migrate() {
    try {
      console.log('🔄 Running database migrations...');
      
      // Add any necessary data migrations here
      // For example, updating existing records, adding computed fields, etc.
      
      console.log('✅ Database migrations completed');
      return true;
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      return false;
    }
  }
  
  // Health check for monitoring
  static async healthCheck() {
    try {
      const connectionOk = await this.testConnection();
      const tablesOk = await this.checkTables();
      
      if (connectionOk && tablesOk) {
        return {
          status: 'healthy',
          database: 'connected',
          tables: 'accessible',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          status: 'unhealthy',
          database: connectionOk ? 'connected' : 'failed',
          tables: tablesOk ? 'accessible' : 'failed',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// CLI Commands
if (require.main === module) {
  const command = process.argv[2];
  
  async function runCommand() {
    switch (command) {
      case 'test':
        await DatabaseUtils.testConnection();
        break;
      case 'check':
        await DatabaseUtils.checkTables();
        break;
      case 'cleanup':
        const days = parseInt(process.argv[3]) || 7;
        await DatabaseUtils.cleanup(days);
        break;
      case 'stats':
        await DatabaseUtils.getStats();
        break;
      case 'migrate':
        await DatabaseUtils.migrate();
        break;
      case 'health':
        const health = await DatabaseUtils.healthCheck();
        console.log(JSON.stringify(health, null, 2));
        break;
      default:
        console.log(`
Database Utilities Usage:

  node database-utils.js test       - Test database connection
  node database-utils.js check      - Check if tables exist
  node database-utils.js cleanup [days] - Clean up old records (default: 7 days)
  node database-utils.js stats      - Show database statistics
  node database-utils.js migrate    - Run database migrations
  node database-utils.js health     - Get health check status
        `);
    }
    
    process.exit(0);
  }
  
  runCommand().catch(error => {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  });
}

module.exports = DatabaseUtils;