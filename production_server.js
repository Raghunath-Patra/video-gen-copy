// production_server.js - Fixed production-ready video generator service
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

// Import your existing modules
const EnhancedContentGenerator = require('./scripts/content_generator');
const VisualPreviewGenerator = require('./scripts/visual_preview_tool');
const FixedOptimizedVideoGenerator = require('./scripts/optimized_video_generator');
const Monitoring = require('./utils/monitoring');

const app = express();
const PORT = process.env.PORT || 3000;

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for video streaming
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Monitoring middleware
app.use(Monitoring.requestMiddleware());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware to extract user info
const extractUserInfo = (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const userEmail = req.headers['x-user-email'];
    const authToken = req.headers['authorization'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    req.user = {
      id: userId,
      email: userEmail,
      token: authToken
    };
    
    next();
  } catch (error) {
    console.error('❌ Error extracting user info:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid user authentication'
    });
  }
};

// Database helper functions
class DatabaseService {
  static async createProject(userId, title, inputContent) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          title,
          input_content: inputContent,
          status: 'input_only',
          user_id: userId
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Database error creating project:', error);
      throw error;
    }
  }
  
  static async updateProjectStatus(projectId, status, userId) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Database error updating project status:', error);
      throw error;
    }
  }
  
  static async saveProjectScript(projectId, userId, lessonSteps, speakers, visualFunctions) {
    try {
      // Save speakers
      for (const [key, speaker] of Object.entries(speakers)) {
        await supabase
          .from('speakers')
          .upsert([{
            project_id: projectId,
            speaker_key: key,
            voice: speaker.voice,
            model: speaker.model,
            name: speaker.name,
            color: speaker.color,
            gender: speaker.gender
          }], { onConflict: 'project_id,speaker_key' });
      }
      
      // Save visual functions
      for (const [name, func] of Object.entries(visualFunctions)) {
        await supabase
          .from('visual_functions')
          .upsert([{
            project_id: projectId,
            function_name: name,
            function_code: func.toString()
          }], { onConflict: 'project_id,function_name' });
      }
      
      // Delete existing lesson steps
      await supabase
        .from('lesson_steps')
        .delete()
        .eq('project_id', projectId);
      
      // Save lesson steps
      const stepInserts = lessonSteps.map((step, i) => ({
        project_id: projectId,
        step_order: i + 1,
        speaker: step.speaker,
        title: step.title,
        content: step.content,
        content2: step.content2,
        narration: step.narration,
        visual_duration: step.visualDuration || 4.0,
        is_complex: step.isComplex || false,
        visual_type: step.visual?.type,
        visual_params: step.visual?.params || null
      }));
      
      await supabase
        .from('lesson_steps')
        .insert(stepInserts);
      
      // Update project status
      await this.updateProjectStatus(projectId, 'script_ready', userId);
      
      return true;
    } catch (error) {
      console.error('❌ Database error saving project script:', error);
      throw error;
    }
  }
  
  static async getProject(projectId, userId) {
    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();
      
      if (projectError) throw projectError;
      if (!project) return null;
      
      // Get related data
      const [speakers, visualFunctions, lessonSteps, videos] = await Promise.all([
        supabase.from('speakers').select('*').eq('project_id', projectId),
        supabase.from('visual_functions').select('*').eq('project_id', projectId),
        supabase.from('lesson_steps').select('*').eq('project_id', projectId).order('step_order'),
        supabase.from('videos').select('*').eq('project_id', projectId)
      ]);
      
      return {
        project,
        speakers: speakers.data || [],
        visualFunctions: visualFunctions.data || [],
        lessonSteps: lessonSteps.data || [],
        videos: videos.data || []
      };
    } catch (error) {
      console.error('❌ Database error getting project:', error);
      throw error;
    }
  }
  
  static async getUserProjects(userId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          videos (id, file_path, duration),
          lesson_steps (id)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      return data.map(project => ({
        ...project,
        hasVideo: project.videos && project.videos.length > 0,
        lessonStepsCount: project.lesson_steps ? project.lesson_steps.length : 0,
        videoFiles: project.videos || []
      }));
    } catch (error) {
      console.error('❌ Database error getting user projects:', error);
      throw error;
    }
  }
  
  static async saveVideo(projectId, userId, filePath, duration) {
    try {
      const { data, error } = await supabase
        .from('videos')
        .insert([{
          project_id: projectId,
          file_path: filePath,
          duration
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      await this.updateProjectStatus(projectId, 'completed', userId);
      
      return data;
    } catch (error) {
      console.error('❌ Database error saving video:', error);
      throw error;
    }
  }
  
  static async deleteProject(projectId, userId) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Database error deleting project:', error);
      throw error;
    }
  }
}

// Convert database records back to script format
function convertDatabaseToScript(projectData) {
  const { speakers, visualFunctions, lessonSteps } = projectData;
  
  const speakersObj = {};
  speakers.forEach(speaker => {
    speakersObj[speaker.speaker_key] = {
      voice: speaker.voice,
      model: speaker.model,
      name: speaker.name,
      color: speaker.color,
      gender: speaker.gender
    };
  });
  
  const visualFunctionsObj = {};
  visualFunctions.forEach(vf => {
    try {
      visualFunctionsObj[vf.function_name] = eval(`(${vf.function_code})`);
    } catch (error) {
      console.error(`Error reconstructing function ${vf.function_name}:`, error);
    }
  });
  
  const lessonStepsArray = lessonSteps.map(step => ({
    speaker: step.speaker,
    title: step.title,
    content: step.content,
    content2: step.content2,
    narration: step.narration,
    visualDuration: step.visual_duration,
    isComplex: step.is_complex,
    visual: step.visual_type ? {
      type: step.visual_type,
      params: step.visual_params || []
    } : null
  }));
  
  return {
    LESSON_CONTENT: {
      lessonSteps: lessonStepsArray,
      speakers: speakersObj
    },
    visualFunctions: visualFunctionsObj
  };
}

// Create temporary script file
async function createTempScriptFile(projectData) {
  const scriptContent = convertDatabaseToScript(projectData);
  const scriptCode = `
const LESSON_CONTENT = ${JSON.stringify(scriptContent.LESSON_CONTENT, null, 2)};

${Object.entries(scriptContent.visualFunctions).map(([name, func]) => 
  `function ${name}${func.toString().substring(8)}`
).join('\n\n')}

module.exports = {
  LESSON_CONTENT,
  visualFunctions: {
    ${Object.keys(scriptContent.visualFunctions).join(',\n    ')}
  }
};`;
  
  const tempScriptPath = `/tmp/temp_script_${Date.now()}.js`;
  await fs.writeFile(tempScriptPath, scriptCode, 'utf8');
  return tempScriptPath;
}

// Ensure required directories exist
async function initializeDirectories() {
  const dirs = ['/tmp/uploads', '/tmp/temp', '/tmp/output'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  const healthStatus = Monitoring.getHealthStatus();
  
  res.status(healthStatus.status === 'healthy' ? 200 : 503).json({
    success: healthStatus.status === 'healthy',
    status: healthStatus.status,
    service: 'Video Generator Service',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: process.env.SUPABASE_URL ? 'configured' : 'not configured',
    issues: healthStatus.issues,
    metrics: healthStatus.metrics
  });
});

// Get user projects
app.get('/api/projects', extractUserInfo, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const projects = await DatabaseService.getUserProjects(
      req.user.id, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      projects,
      total: projects.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('❌ Error listing projects:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list projects'
    });
  }
});

// Create project and generate script
app.post('/api/generate-script', extractUserInfo, async (req, res) => {
  try {
    const { content, title } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    console.log('🚀 Starting script generation for user:', req.user.id);
    Monitoring.info('Script generation started', {
      userId: req.user.id,
      contentLength: content.length,
      title: title || 'Untitled Project'
    });
    
    // Create project in database
    const project = await DatabaseService.createProject(
      req.user.id,
      title || 'Untitled Project',
      content
    );
    
    // Generate script
    const contentGenerator = new EnhancedContentGenerator();
    const jsContent = await contentGenerator.generateDynamicContent(content);
    const parsedContent = contentGenerator.parseGeneratedContent(jsContent);
    
    // Save to database
    await DatabaseService.saveProjectScript(
      project.id,
      req.user.id,
      parsedContent.lessonSteps,
      parsedContent.speakers,
      parsedContent.visualFunctions
    );
    
    console.log(`✅ Script generated for project: ${project.id}`);
    Monitoring.trackScriptGeneration(project.id, req.user.id, parsedContent.lessonSteps.length);
    
    res.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        status: 'script_ready',
        lessonSteps: parsedContent.lessonSteps,
        speakers: parsedContent.speakers,
        visualFunctions: Object.keys(parsedContent.visualFunctions || {})
      },
      message: 'Script generated successfully'
    });
  } catch (error) {
    console.error('❌ Error generating script:', error);
    Monitoring.error('Script generation failed', error, {
      userId: req.user.id,
      contentLength: req.body.content?.length || 0
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate script'
    });
  }
});

// Generate video from project
app.post('/api/generate-video', extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    console.log(`⚡ Starting video generation for project: ${projectId}`);
    
    // Get project data from database
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    
    if (!projectData || !projectData.project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    if (projectData.project.status !== 'script_ready' && projectData.project.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Project script not ready for video generation'
      });
    }
    
    // Create temporary script file
    const tempScriptPath = await createTempScriptFile(projectData);
    
    try {
      // Generate video
      const videoOutputDir = `/tmp/output/${projectId}`;
      const videoName = `video_${Date.now()}`;
      
      const generatorOptions = {
        outputDir: videoOutputDir,
        videoName: videoName
      };
      
      const generator = new FixedOptimizedVideoGenerator(tempScriptPath, generatorOptions);
      const videoPath = await generator.generate();
      
      console.log(`✅ Video generation complete: ${videoPath}`);
      
      // Get video duration (simplified - you might want to use ffprobe)
      const videoDuration = 30; // Default duration
      
      // Save video info to database
      await DatabaseService.saveVideo(
        projectId,
        req.user.id,
        videoPath,
        videoDuration
      );
      
      Monitoring.trackVideoGeneration(projectId, req.user.id, videoDuration);
      
      res.json({
        success: true,
        message: 'Video generated successfully!',
        projectId: projectId,
        videoPath: videoPath,
        duration: videoDuration
      });
      
    } finally {
      // Clean up temporary script file
      try {
        await fs.unlink(tempScriptPath);
      } catch (error) {
        console.warn('Warning: Could not delete temp script file:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in video generation:', error);
    Monitoring.error('Video generation failed', error, {
      userId: req.user.id,
      projectId: req.body.projectId
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Video generation failed'
    });
  }
});

// Serve video files
app.get('/api/video/:projectId', extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`🎬 Video request for project: ${projectId} by user: ${req.user.id}`);
    
    // Get project and verify ownership
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    
    if (!projectData || !projectData.videos || projectData.videos.length === 0) {
      return res.status(404).json({
        error: 'Video not found',
        projectId: projectId
      });
    }
    
    const video = projectData.videos[0];
    const videoPath = video.file_path;
    
    if (!videoPath || !existsSync(videoPath)) {
      console.log(`❌ Video file not found at: ${videoPath}`);
      return res.status(404).json({
        error: 'Video file not found',
        projectId: projectId,
        expectedPath: videoPath
      });
    }
    
    console.log(`✅ Video found, serving: ${videoPath}`);
    
    // Get file stats
    const stat = require('fs').statSync(videoPath);
    const fileSize = stat.size;
    
    // Handle range requests for video seeking/streaming
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const file = require('fs').createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=31536000'
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000'
      };
      res.writeHead(200, head);
      require('fs').createReadStream(videoPath).pipe(res);
    }
    
  } catch (error) {
    console.error('❌ Error in video endpoint:', error);
    res.status(500).json({
      error: 'Video serving error',
      details: error.message
    });
  }
});

// Delete project
app.delete('/api/project/:projectId', extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get project data to clean up files
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    
    if (projectData && projectData.videos) {
      // Clean up video files
      for (const video of projectData.videos) {
        if (video.file_path && existsSync(video.file_path)) {
          try {
            await fs.unlink(video.file_path);
          } catch (error) {
            console.warn('Warning: Could not delete video file:', error.message);
          }
        }
      }
    }
    
    // Delete from database
    await DatabaseService.deleteProject(projectId, req.user.id);
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete project'
    });
  }
});

// Error handling middleware
app.use(Monitoring.errorMiddleware());

app.use((error, req, res, next) => {
  Monitoring.error('Unhandled application error', error, {
    method: req.method,
    url: req.url,
    userId: req.user?.id
  });
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
async function startServer() {
  try {
    await initializeDirectories();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Production Video Generator Service Started!');
      console.log(`📡 Server running on: http://0.0.0.0:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Database: ${process.env.SUPABASE_URL ? 'Connected' : 'Not configured'}`);
      console.log(`🔑 Auth: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Missing'}`);
      console.log(`🎬 Video generation service ready for production!`);
      
      // Environment check
      console.log('\n📋 Environment Check:');
      console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
      console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
      console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);
      console.log(`   SMALLEST_API_KEY: ${process.env.SMALLEST_API_KEY ? '✅ Set' : '❌ Missing'}`);
      console.log(`   ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS || 'Using defaults'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

startServer();