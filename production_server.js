// production_server.js - Production-ready video generator service for Railway + Supabase
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
const fetch = require('node-fetch'); // Add this dependency

// Import your existing modules
const EnhancedContentGenerator = require('./content_generator');
const VisualPreviewGenerator = require('./visual_preview_tool');
const FixedOptimizedVideoGenerator = require('./optimized_video_generator');
// Add this with your other imports
const { TmpCleaner, createCleanupMiddleware } = require('./tmp_cleaner');

// Simple monitoring module
const monitoring = {
  requestMiddleware: () => (req, res, next) => {
    req.startTime = Date.now();
    next();
  },
  getHealthStatus: () => ({
    status: 'healthy',
    metrics: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    },
    issues: []
  }),
  getMetricsForExport: () => ({
    uptime_seconds: process.uptime(),
    memory_usage_mb: process.memoryUsage().heapUsed / 1024 / 1024
  }),
  errorMiddleware: () => (err, req, res, next) => {
    console.error('Error:', err);
    next(err);
  },
  info: (msg, data) => console.log(`INFO: ${msg}`, data || ''),
  error: (msg, err, data) => console.error(`ERROR: ${msg}`, err, data || ''),
  trackScriptGeneration: (projectId, userId, steps) => 
    console.log(`Script generated: ${projectId} for ${userId} with ${steps} steps`),
  trackVideoGeneration: (projectId, userId, duration) => 
    console.log(`Video generated: ${projectId} for ${userId}, duration: ${duration}s`)
};

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const tmpCleaner = new TmpCleaner();
const cleanupMiddleware = createCleanupMiddleware();

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
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
app.use(monitoring.requestMiddleware());

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
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Service authentication middleware
const authenticateService = (req, res, next) => {
  try {
    const serviceKey = req.headers['x-service-key'];
    const expectedKey = process.env.SERVICE_API_KEY;
    
    if (!expectedKey) {
      return res.status(500).json({
        success: false,
        error: 'Service not properly configured'
      });
    }
    
    if (!serviceKey || serviceKey !== expectedKey) {
      return res.status(403).json({
        success: false,
        error: 'Service authentication required'
      });
    }
    
    next();
  } catch (error) {
    console.error('❌ Error in service authentication:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// User info extraction middleware
const extractUserInfo = (req, res, next) => {
  try {
    let userId = req.headers['x-user-id'];
    let userEmail = req.headers['x-user-email'];
    let userRole = req.headers['x-user-role'];
    
    if (!userId && req.headers['x-user-context']) {
      try {
        const userContext = JSON.parse(req.headers['x-user-context']);
        userId = userContext.user_id;
        userEmail = userContext.user_email;
        userRole = userContext.user_role;
      } catch (parseError) {
        console.error('❌ Error parsing user context:', parseError);
      }
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    req.user = {
      id: userId,
      email: userEmail || 'unknown@example.com',
      role: userRole || 'student'
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

// Storage Service Class
class StorageService {
  static async uploadFile(bucketName, fileName, localPath, userId) {
    try {
      const fileBuffer = await fs.readFile(localPath);
      const fullPath = `${userId}/${fileName}`;
      
      console.log(`📤 Uploading to ${bucketName}/${fullPath}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fullPath, fileBuffer, {
          upsert: true,
          contentType: bucketName === 'video-files' ? 'video/mp4' : 'audio/mpeg'
        });
      
      if (error) throw error;
      
      console.log('✅ Upload successful:', data.path);
      return data.path;
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  }
  
  static async downloadFile(bucketName, filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Download error:', error);
      throw error;
    }
  }
  
  static async getSignedUrl(bucketName, filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);
      
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('❌ Signed URL error:', error);
      throw error;
    }
  }
  
  static async deleteFile(bucketName, filePath) {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);
      
      if (error) throw error;
      console.log('✅ File deleted successfully');
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }
  }
}

// Database Service Class
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
        .update({ status })
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
      // Delete existing data for this project
      await Promise.all([
        supabase.from('speakers').delete().eq('project_id', projectId),
        supabase.from('visual_functions').delete().eq('project_id', projectId),
        supabase.from('lesson_steps').delete().eq('project_id', projectId)
      ]);
      
      // Save speakers
      if (Object.keys(speakers).length > 0) {
        const speakerData = Object.entries(speakers).map(([key, speaker]) => ({
          project_id: projectId,
          speaker_key: key,
          voice: speaker.voice,
          model: speaker.model,
          name: speaker.name,
          color: speaker.color,
          gender: speaker.gender
        }));
        
        const { error: speakerError } = await supabase
          .from('speakers')
          .insert(speakerData);
        
        if (speakerError) throw speakerError;
      }
      
      // Save visual functions
      if (Object.keys(visualFunctions).length > 0) {
        const visualData = Object.entries(visualFunctions).map(([name, func]) => ({
          project_id: projectId,
          function_name: name,
          function_code: func.toString()
        }));
        
        const { error: visualError } = await supabase
          .from('visual_functions')
          .insert(visualData);
        
        if (visualError) throw visualError;
      }
      
      // Save lesson steps
      if (lessonSteps.length > 0) {
        const stepData = lessonSteps.map((step, index) => ({
          project_id: projectId,
          step_order: index + 1,
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
        
        const { error: stepError } = await supabase
          .from('lesson_steps')
          .insert(stepData);
        
        if (stepError) throw stepError;
      }
      
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
      const [speakersResult, visualResult, stepsResult, audioResult, videoResult] = await Promise.all([
        supabase.from('speakers').select('*').eq('project_id', projectId),
        supabase.from('visual_functions').select('*').eq('project_id', projectId),
        supabase.from('lesson_steps').select('*').eq('project_id', projectId).order('step_order'),
        supabase.from('audio_files').select('*, lesson_steps!inner(project_id)').eq('lesson_steps.project_id', projectId),
        supabase.from('videos').select('*').eq('project_id', projectId)
      ]);
      
      return {
        project,
        speakers: speakersResult.data || [],
        visualFunctions: visualResult.data || [],
        lessonSteps: stepsResult.data || [],
        audioFiles: audioResult.data || [],
        videos: videoResult.data || []
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
          videos (id, storage_path, duration),
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
  
  static async saveVideo(projectId, userId, storagePath, bucketName, duration) {
    try {
      const { data, error } = await supabase
        .from('videos')
        .insert([{
          project_id: projectId,
          storage_path: storagePath,
          bucket_name: bucketName,
          duration
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update project status
      await this.updateProjectStatus(projectId, 'completed', userId);
      
      return data;
    } catch (error) {
      console.error('❌ Database error saving video:', error);
      throw error;
    }
  }
  
  static async saveAudioFile(lessonStepId, storagePath, bucketName, duration) {
    try {
      const { data, error } = await supabase
        .from('audio_files')
        .insert([{
          lesson_step_id: lessonStepId,
          storage_path: storagePath,
          bucket_name: bucketName,
          duration
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Database error saving audio file:', error);
      throw error;
    }
  }
  
  static async deleteProject(projectId, userId) {
    try {
      // Get project data for cleanup
      const projectData = await this.getProject(projectId, userId);
      
      if (projectData) {
        // Delete files from storage
        const deleteTasks = [];
        
        projectData.videos.forEach(video => {
          if (video.storage_path) {
            deleteTasks.push(StorageService.deleteFile(video.bucket_name, video.storage_path));
          }
        });
        
        projectData.audioFiles.forEach(audio => {
          if (audio.storage_path) {
            deleteTasks.push(StorageService.deleteFile(audio.bucket_name, audio.storage_path));
          }
        });
        
        // Execute all deletions
        await Promise.allSettled(deleteTasks);
      }
      
      // Delete project from database (cascade will handle related records)
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

// Utility functions
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

async function createTempScriptFile(projectData) {
  const scriptContent = convertDatabaseToScript(projectData);
  const scriptCode = `
// Generated script from database
const LESSON_CONTENT = ${JSON.stringify(scriptContent.LESSON_CONTENT, null, 2)};

${Object.entries(scriptContent.visualFunctions).map(([name, func]) => 
  `const ${name} = ${func.toString()};`
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

// Calculate video duration (simplified - you might want to implement this properly)
function calculateVideoDuration(videoPath) {
  // This is a placeholder - implement actual video duration calculation
  // You could use ffprobe or similar tool
  return 30; // Default 30 seconds
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  const healthStatus = monitoring.getHealthStatus();
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'Video Generator Service',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: healthStatus.metrics.uptime,
    database: 'connected',
    storage: 'connected'
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = monitoring.getMetricsForExport();
  let output = '';
  Object.entries(metrics).forEach(([key, value]) => {
    output += `# TYPE ${key} gauge\n${key} ${value}\n`;
  });
  res.set('Content-Type', 'text/plain').send(output);
});

// Get user projects
app.get('/api/projects', authenticateService, extractUserInfo, async (req, res) => {
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

// Get specific project
app.get('/api/project/:projectId', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    
    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      project: projectData
    });
  } catch (error) {
    console.error('❌ Error getting project:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get project'
    });
  }
});

// Generate script
app.post('/api/generate-script', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { content, title } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    console.log('🚀 Starting script generation for user:', req.user.id);

    // Create project
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
    monitoring.trackScriptGeneration(project.id, req.user.id, parsedContent.lessonSteps.length);

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
    monitoring.error('Script generation failed', error, { userId: req.user.id });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate script'
    });
  } finally {
    try {
      await tmpCleaner.clearAll();
      console.log('✅ /tmp cleanup completed');
    } catch (cleanupError) {
      console.warn('Warning: /tmp cleanup failed:', cleanupError.message);
    }
  }
});

// Generate video
app.post('/api/generate-video', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    console.log(`⚡ Starting video generation for project: ${projectId}`);
    
    // Get project data
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
    let tempVideoPath = null;
    const videoOutputDir = `/tmp/output/${projectId}`;
    
    try {
      // Generate video
      //const videoOutputDir = `/tmp/output/${projectId}`;
      await fs.mkdir(videoOutputDir, { recursive: true });
      
      const videoName = `video_${Date.now()}`;
      const generatorOptions = {
        outputDir: videoOutputDir,
        videoName: videoName
      };
      
      const generator = new FixedOptimizedVideoGenerator(tempScriptPath, generatorOptions);
      tempVideoPath = await generator.generate();
      
      console.log(`✅ Video generation complete: ${tempVideoPath}`);
      
      // Upload to storage
      const videoFileName = `${projectId}_${Date.now()}.mp4`;
      const storagePath = await StorageService.uploadFile(
        'video-files',
        videoFileName,
        tempVideoPath,
        req.user.id
      );
      
      console.log(`✅ Video uploaded to storage: ${storagePath}`);
      
      // Calculate duration
      const videoDuration = calculateVideoDuration(tempVideoPath);
      
      // Save to database
      await DatabaseService.saveVideo(
        projectId,
        req.user.id,
        storagePath,
        'video-files',
        videoDuration
      );
      
      monitoring.trackVideoGeneration(projectId, req.user.id, videoDuration);
      
      res.json({
        success: true,
        message: 'Video generated successfully!',
        projectId: projectId,
        storagePath: storagePath,
        duration: videoDuration
      });
      
    } finally {
      try {
        await tmpCleaner.clearAll();
        console.log('✅ /tmp cleanup completed');
      } catch (cleanupError) {
        console.warn('Warning: /tmp cleanup failed:', cleanupError.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in video generation:', error);
    monitoring.error('Video generation failed', error, { userId: req.user.id });
    res.status(500).json({
      success: false,
      error: error.message || 'Video generation failed'
    });
  }
});

// Serve video files
app.get('/api/video/:projectId', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    
    if (!projectData || !projectData.videos || projectData.videos.length === 0) {
      return res.status(404).json({
        error: 'Video not found'
      });
    }
    
    const video = projectData.videos[0];
    const storagePath = video.storage_path;
    
    if (!storagePath) {
      return res.status(404).json({
        error: 'Video file not found'
      });
    }
    
    // Handle range requests
    const range = req.headers.range;
    const signedUrl = await StorageService.getSignedUrl(
      video.bucket_name,
      storagePath,
      3600
    );
    
    if (range) {
      const response = await fetch(signedUrl, {
        headers: { range }
      });
      
      res.status(response.status);
      response.headers.forEach((value, name) => {
        res.setHeader(name, value);
      });
      
      response.body.pipe(res);
    } else {
      res.redirect(signedUrl);
    }
    
  } catch (error) {
    console.error('❌ Error serving video:', error);
    res.status(500).json({
      error: 'Video serving error'
    });
  }
});

// Download video
app.get('/api/download/:projectId', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    
    if (!projectData || !projectData.videos || projectData.videos.length === 0) {
      return res.status(404).send('Video not found');
    }
    
    const video = projectData.videos[0];
    const storagePath = video.storage_path;
    
    if (!storagePath) {
      return res.status(404).send('Video file not found');
    }
    
    try {
      // Download file from storage
      const fileBlob = await StorageService.downloadFile(video.bucket_name, storagePath);
      
      // Set download headers
      const downloadFilename = `${projectData.project.title.replace(/[^a-zA-Z0-9]/g, '_')}_video.mp4`;
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      res.setHeader('Content-Type', 'video/mp4');
      
      // Convert blob to buffer and send
      const buffer = await fileBlob.arrayBuffer();
      res.send(Buffer.from(buffer));
      
    } catch (storageError) {
      console.error('❌ Error downloading from storage:', storageError);
      res.status(500).send('Error downloading video');
    }
    
  } catch (error) {
    console.error('❌ Error in download endpoint:', error);
    res.status(500).send('Error downloading video');
  }
});

// Get video stream URL
app.get('/api/stream/:projectId', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { expires = 3600 } = req.query;
    
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    
    if (!projectData || !projectData.videos || projectData.videos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    const video = projectData.videos[0];
    const storagePath = video.storage_path;
    
    if (!storagePath) {
      return res.status(404).json({
        success: false,
        error: 'Video file not found'
      });
    }
    
    try {
      const signedUrl = await StorageService.getSignedUrl(
        video.bucket_name,
        storagePath,
        parseInt(expires)
      );
      
      res.json({
        success: true,
        streamUrl: signedUrl,
        expiresIn: parseInt(expires),
        projectId: projectId,
        duration: video.duration
      });
      
    } catch (storageError) {
      console.error('❌ Error getting stream URL:', storageError);
      res.status(500).json({
        success: false,
        error: 'Error generating stream URL'
      });
    }
    
  } catch (error) {
    console.error('❌ Error in stream endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Stream URL generation failed'
    });
  }
});

// Delete project
app.delete('/api/project/:projectId', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`🗑️ Delete request for project: ${projectId} by user: ${req.user.id}`);
    
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

// Upload audio file
app.post('/api/upload-audio/:projectId', authenticateService, extractUserInfo, upload.single('audio'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { lessonStepId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }
    
    console.log(`🎵 Audio upload for project: ${projectId}, step: ${lessonStepId}`);
    
    // Verify project ownership
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Upload to storage
    const audioFileName = `${projectId}_step_${lessonStepId}_${Date.now()}.mp3`;
    const storagePath = await StorageService.uploadFile(
      'audio-files',
      audioFileName,
      req.file.path,
      req.user.id
    );
    
    // Save audio file record
    const audioRecord = await DatabaseService.saveAudioFile(
      lessonStepId,
      storagePath,
      'audio-files',
      0 // Duration placeholder
    );
    
    // Clean up temporary file
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      message: 'Audio uploaded successfully',
      audioFile: audioRecord
    });
    
  } catch (error) {
    console.error('❌ Error uploading audio:', error);
    
    // Clean up temporary file on error
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Warning: Could not delete temp file:', cleanupError.message);
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Audio upload failed'
    });
  }
});

// Get audio file
app.get('/api/audio/:audioId', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { audioId } = req.params;
    
    console.log(`🎵 Audio request for ID: ${audioId} by user: ${req.user.id}`);
    
    // Get audio file record with user verification
    const { data: audioFile, error } = await supabase
      .from('audio_files')
      .select(`
        *,
        lesson_steps!inner(
          project_id,
          projects!inner(user_id)
        )
      `)
      .eq('id', audioId)
      .eq('lesson_steps.projects.user_id', req.user.id)
      .single();
    
    if (error || !audioFile) {
      return res.status(404).json({
        success: false,
        error: 'Audio file not found'
      });
    }
    
    // Get signed URL for audio access
    const signedUrl = await StorageService.getSignedUrl(
      audioFile.bucket_name,
      audioFile.storage_path,
      3600
    );
    
    res.redirect(signedUrl);
    
  } catch (error) {
    console.error('❌ Error serving audio:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Audio serving error'
    });
  }
});

// Manual cleanup endpoint
app.post('/api/cleanup', authenticateService, cleanupMiddleware.cleanupEndpoint);

// Cleanup stats endpoint
app.get('/api/cleanup/stats', authenticateService, cleanupMiddleware.statsEndpoint);


// Error handling middleware
app.use(monitoring.errorMiddleware());

app.use((error, req, res, next) => {
  monitoring.error('Unhandled application error', error, {
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
    
    // Test connections
    try {
      const { data, error } = await supabase.from('projects').select('count').limit(1);
      if (error) throw error;
      console.log('✅ Supabase database connection successful');
    } catch (dbError) {
      console.error('❌ Supabase database connection failed:', dbError);
    }
    
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      if (storageError) throw storageError;
      console.log('✅ Supabase storage connection successful');
      console.log('📦 Available buckets:', buckets.map(b => b.name).join(', '));
    } catch (storageError) {
      console.error('❌ Supabase storage connection failed:', storageError);
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Production Video Generator Service Started!');
      console.log(`📡 Server running on: http://0.0.0.0:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Database: ${process.env.SUPABASE_URL ? 'Connected' : 'Not configured'}`);
      console.log(`🔑 Auth: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Missing'}`);
      console.log(`📦 Storage: Supabase Storage with buckets: audio-files, video-files`);
      console.log(`🎬 Video generation service ready for production!`);
      
      // Environment check
      console.log('\n📋 Environment Check:');
      console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
      console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
      console.log(`   SERVICE_API_KEY: ${process.env.SERVICE_API_KEY ? '✅ Set' : '❌ Missing'}`);
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
// Cleanup on server shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Server shutting down, cleaning up...');
  try {
    await tmpCleaner.clearAll();
    console.log('✅ Final cleanup completed');
  } catch (error) {
    console.error('❌ Final cleanup failed:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

// Start periodic cleanup every 30 minutes
setInterval(async () => {
  try {
    await tmpCleaner.clearAll();
    console.log('⏰ Periodic cleanup completed');
  } catch (error) {
    console.error('❌ Periodic cleanup failed:', error);
  }
}, 60 * 60 * 1000); // Every 60 minutes
startServer();