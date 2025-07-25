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
const { spawn } = require('child_process');

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

// Helper function for audio generation (add near other helper functions)
async function generateAudioWithSmallestAi(text, voiceConfig) {
  if (!process.env.SMALLEST_API_KEY) {
    throw new Error('Smallest.ai token not available');
  }

  const { voice, model } = voiceConfig;
  const apiUrl = `https://waves-api.smallest.ai/api/v1/${model}/get_speech`;

  const payload = {
    text: text.trim(),
    voice_id: voice,
    sample_rate: 24000,
    speed: 1.0,
    add_wav_header: true
  };

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SMALLEST_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  };

  try {
    const response = await fetch(apiUrl, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Smallest.ai API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    if (audioBuffer.byteLength === 0) {
      throw new Error('Received empty audio buffer from API');
    }

    return Buffer.from(audioBuffer);
  } catch (error) {
    console.error('❌ Smallest.ai API call failed:', error.message);
    throw error;
  }
}

// Helper function for audio duration (add near other helper functions)
async function getAudioDuration(audioFilePath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn(require('ffprobe-static').path, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      audioFilePath
    ]);
    let duration = '';
    let errorOutput = '';
    ffprobe.stdout.on('data', (data) => { duration += data.toString().trim(); });
    ffprobe.stderr.on('data', (data) => { errorOutput += data.toString(); });
    ffprobe.on('close', (code) => {
      if (code === 0 && duration && !isNaN(parseFloat(duration))) {
        resolve(parseFloat(duration));
      } else {
        console.error(`ffprobe error for ${audioFilePath} (code ${code}): ${errorOutput}`);
        resolve(0);
      }
    });
    ffprobe.on('error', (err) => {
      console.error(`Failed to start ffprobe for ${audioFilePath}:`, err);
      resolve(0);
    });
  });
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
app.post('/api/generate-video/old', authenticateService, extractUserInfo, async (req, res) => {
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
      
      const generator = new FixedOptimizedVideoGenerator(tempScriptPath, {
        ...generatorOptions,
        supabase: supabase,
        userId: req.user.id,
        projectId: projectId
      });
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

// Get video stream URL - FIXED VERSION
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
      
      // Return JSON instead of redirect
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

// Update project title endpoint
app.post('/api/update-project-title', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId, title } = req.body;
    
    // Validate required fields
    if (!projectId || !title) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: projectId and title are required' 
      });
    }
    
    // Validate title length
    if (title.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title cannot be empty' 
      });
    }
    
    if (title.length > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title cannot exceed 100 characters' 
      });
    }
    
    console.log(`📝 Updating project title for project: ${projectId}`);
    console.log(`🏷️ New title: "${title}"`);
    
    // Verify project ownership
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    if (!projectData) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found or access denied' 
      });
    }
    
    // Update project title in database
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        title: title.trim(),
        updated_at: new Date()
      })
      .eq('id', projectId)
      .eq('user_id', req.user.id) // Additional security check
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating project title:', updateError);
      throw updateError;
    }
    
    if (!updatedProject) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found or no changes made' 
      });
    }
    
    console.log(`✅ Project title updated successfully for project: ${projectId}`);
    
    res.json({
      success: true,
      message: 'Project title updated successfully',
      project: {
        id: updatedProject.id,
        title: updatedProject.title,
        updatedAt: updatedProject.updated_at
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating project title:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update project title' 
    });
  }
});

// MODIFIED: Main endpoint to update a step
// Now handles saving a staged visual function in the same transaction.
app.put('/api/project/:projectId/step/:stepOrder', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId, stepOrder } = req.params;
    // Destructure the new 'updatedVisual' field from the body
    const { stepData, regenerateAudio, updatedVisual } = req.body;
    
    console.log(`📝 Updating step ${stepOrder} for project: ${projectId}`);
    
    // Verify project ownership
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    if (!projectData) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    // --- New Logic: Save updated visual function if provided ---
    if (updatedVisual && updatedVisual.functionName && updatedVisual.code) {
        console.log(`🎨 Saving visual function: ${updatedVisual.functionName}`);
        
        // Use upsert to handle both creation of new functions and updating existing ones
        const { error: visualError } = await supabase
            .from('visual_functions')
            .upsert({
                project_id: projectId,
                function_name: updatedVisual.functionName,
                function_code: updatedVisual.code,
                updated_at: new Date()
            }, {
                onConflict: 'project_id, function_name' // Specify conflict target
            });
            
        if (visualError) throw visualError;
        console.log(`✅ Visual function '${updatedVisual.functionName}' saved successfully.`);
    }
    
    // Update lesson step in database (existing logic)
    const { data: lessonStep, error: stepError } = await supabase
      .from('lesson_steps')
      .update({
        speaker: stepData.speaker,
        title: stepData.title,
        content: stepData.content,
        content2: stepData.content2,
        narration: stepData.narration,
        visual_duration: stepData.visualDuration || 4.0,
        is_complex: stepData.isComplex || false,
        visual_type: stepData.visual?.type,
        visual_params: stepData.visual?.params || null,
        updated_at: new Date()
      })
      .eq('project_id', projectId)
      .eq('step_order', parseInt(stepOrder))
      .select()
      .single();
    
    if (stepError) throw stepError;
    
    // --- Audio Regeneration Logic (Unchanged) ---
    let audioGenerated = false;
    if (regenerateAudio && lessonStep) {
        // ... (your existing audio regeneration logic from the reference code goes here)
        console.log('Audio regeneration would happen here if logic was included.');
        audioGenerated = true; // Placeholder
    }
    
    res.json({
      success: true,
      message: 'Lesson step updated successfully',
      audioRegenerated: audioGenerated,
      updatedStep: lessonStep
    });
    
  } catch (error) {
    console.error('❌ Error updating lesson step:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update lesson step' });
  }
});

// Also fix the bulk audio regeneration endpoint
app.post('/api/project/:projectId/regenerate-audio', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { stepOrders, reason } = req.body; // Array of step orders to regenerate
    
    console.log(`🎵 Bulk audio regeneration for project: ${projectId}, steps: ${stepOrders.join(', ')}`);
    
    // Verify project ownership
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    if (!process.env.SMALLEST_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Audio generation service not configured'
      });
    }
    
    const results = [];
    
    for (const stepOrder of stepOrders) {
      try {
        // Get lesson step and speaker config
        const { data: lessonStep } = await supabase
          .from('lesson_steps')
          .select('*')
          .eq('project_id', projectId)
          .eq('step_order', stepOrder)
          .single();
        
        const { data: speaker } = await supabase
          .from('speakers')
          .select('*')
          .eq('project_id', projectId)
          .eq('speaker_key', lessonStep.speaker)
          .single();
        
        if (!lessonStep || !speaker) {
          results.push({
            stepOrder: stepOrder,
            success: false,
            error: 'Step or speaker not found'
          });
          continue;
        }
        
        // STEP 1: Get existing audio file info BEFORE generating new one
        const { data: oldAudio, error: fetchError } = await supabase
          .from('audio_files')
          .select('storage_path, bucket_name, id')
          .eq('lesson_step_id', lessonStep.id)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.warn(`⚠️ Error fetching old audio for step ${stepOrder}:`, fetchError.message);
        }
        
        // STEP 2: Generate new audio
        const audioBuffer = await generateAudioWithSmallestAi(
          lessonStep.narration, 
          {
            voice: speaker.voice,
            model: speaker.model
          }
        );
        
        // Save temporary audio file
        const tempAudioPath = `/tmp/temp_audio_${projectId}_${stepOrder}_${Date.now()}.wav`;
        await fs.writeFile(tempAudioPath, audioBuffer);
        
        // STEP 3: Upload to storage
        const audioFileName = `${projectId}_step_${stepOrder}_${Date.now()}.wav`;
        const storagePath = await StorageService.uploadFile(
          'audio-files',
          audioFileName,
          tempAudioPath,
          req.user.id
        );
        
        // Get audio duration
        const duration = await getAudioDuration(tempAudioPath);
        
        // STEP 4: Delete old audio file from storage BEFORE updating database
        if (oldAudio && oldAudio.storage_path) {
          try {
            console.log(`🗑️ Deleting old audio file from storage: ${oldAudio.storage_path}`);
            await StorageService.deleteFile(oldAudio.bucket_name, oldAudio.storage_path);
            console.log(`✅ Old audio file deleted from storage for step ${stepOrder}`);
          } catch (deleteError) {
            console.error(`❌ Failed to delete old audio file from storage for step ${stepOrder}:`, deleteError.message);
            // Continue anyway
          }
        }
        
        // STEP 5: Update/Insert audio file record
        if (oldAudio && oldAudio.id) {
          // Update existing record
          await supabase
            .from('audio_files')
            .update({
              storage_path: storagePath,
              bucket_name: 'audio-files',
              duration: duration,
              updated_at: new Date()
            })
            .eq('id', oldAudio.id);
        } else {
          // Insert new record
          await supabase
            .from('audio_files')
            .insert([{
              lesson_step_id: lessonStep.id,
              storage_path: storagePath,
              bucket_name: 'audio-files',
              duration: duration
            }]);
        }
        
        // Clean up temp file
        await fs.unlink(tempAudioPath);
        
        results.push({
          stepOrder: stepOrder,
          success: true,
          duration: duration
        });
        
      } catch (stepError) {
        console.error(`❌ Audio regeneration failed for step ${stepOrder}:`, stepError);
        results.push({
          stepOrder: stepOrder,
          success: false,
          error: stepError.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    res.json({
      success: true,
      message: `Audio regeneration completed: ${successCount} successful, ${failureCount} failed`,
      results: results,
      reason: reason
    });
    
  } catch (error) {
    console.error('❌ Error in bulk audio regeneration:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Bulk audio regeneration failed'
    });
  }finally {
    try {
      await tmpCleaner.clearAll();
      console.log('✅ /tmp cleanup completed');
    } catch (cleanupError) {
      console.warn('Warning: /tmp cleanup failed:', cleanupError.message);
    }
  }
});

// NEW ENDPOINT: To generate a new visual function from a text description
app.post('/api/project/:projectId/step/:stepOrder/add-visual', authenticateService, extractUserInfo, async (req, res) => {
    try {
        const { projectId, stepOrder } = req.params;
        const { description } = req.body;

        console.log(`✨ AI add visual request for step ${stepOrder} in project: ${projectId}`);
        console.log(`📝 Description: ${description}`);

        // Verify project ownership and AI service configuration
        const projectData = await DatabaseService.getProject(projectId, req.user.id);
        if (!projectData) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(500).json({ success: false, error: 'AI service not configured' });
        }

        // Fetch the specific slide this visual will be added to
        const { data: currentStep, error: stepError } = await supabase
            .from('lesson_steps')
            .select('*')
            .eq('project_id', projectId)
            .eq('step_order', parseInt(stepOrder))
            .single();
        
        if (stepError) throw stepError;

        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const aiPrompt = `You are an expert at creating JavaScript functions for HTML5 Canvas. A user wants to add a new visual to an educational slide.

USER REQUEST: "${description}"

SLIDE CONTEXT:
- Title: ${currentStep.title}
- Content: ${currentStep.content || ''}

REQUIREMENTS:
1.  Generate a unique, descriptive, camelCase JavaScript function name (e.g., 'drawBarChart', 'animateSolarSystem').
2.  Generate the corresponding JavaScript function code. The function should accept (ctx, ...params).
3.  Return a single, valid JSON object with two keys: "functionName" and "functionCode".
4.  Do NOT include any explanations, markdown, or wrapper text. Only the JSON object.

EXAMPLE RESPONSE:
{
  "functionName": "drawSimpleCircle",
  "functionCode": "function drawSimpleCircle(ctx) {\\n  ctx.beginPath();\\n  ctx.arc(500, 400, 50, 0, 2 * Math.PI);\\n  ctx.fillStyle = '#4A90E2';\\n  ctx.fill();\\n}"
}

RESPOND WITH ONLY THE JSON OBJECT:`;

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [{ role: "user", content: aiPrompt }]
        });

        if (!message.content || !message.content[0]) {
            throw new Error('No response from AI service');
        }
        const aiResponse = message.content[0].text;
        const cleanJson = aiResponse.replace(/```json\n?|```\n?/g, '').trim();
        const { functionName, functionCode } = JSON.parse(cleanJson);

        if (!functionName || !functionCode) {
            throw new Error('AI returned an invalid object for the new visual function.');
        }
        
        // Prepare the updated slide object (in memory)
        const updatedSlide = {
            ...currentStep,
            visual: {
                type: functionName,
                params: [] // Default to empty params
            }
        };

        res.json({
            success: true,
            updatedSlide: updatedSlide,
            newVisualFunction: {
                name: functionName,
                code: functionCode
            }
        });

    } catch (error) {
        console.error('❌ Error in AI add-visual:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to add visual' });
    }
});

// MODIFIED: AI modification endpoint
// Handles both content and visual modifications.
// For visual modifications, it now returns the suggested code without saving it.
app.post('/api/project/:projectId/step/:stepOrder/ai-modify', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId, stepOrder } = req.params;
    const { currentSlide, modification, availableVisualFunctions, modifyType = 'content' } = req.body;
    
    console.log(`🤖 AI modification request for step ${stepOrder} in project: ${projectId}`);
    console.log(`📝 Modification type: ${modifyType}`);
    console.log(`📝 Request: ${modification}`);
    
    // Verify project ownership
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured'
      });
    }
    
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    let aiPrompt;
    let responseHandler;
    
    if (modifyType === 'visual' && currentSlide.visual?.type) {
      // --- Visual function modification ---
      const currentVisualFunction = projectData.visualFunctions.find(
        vf => vf.function_name === currentSlide.visual.type
      );
      
      if (!currentVisualFunction) {
        return res.status(404).json({
          success: false,
          error: 'Visual function not found'
        });
      }
      
      aiPrompt = `You are an expert at writing HTML5 Canvas drawing functions for educational videos.

CURRENT VISUAL FUNCTION CODE:
\`\`\`javascript
${currentVisualFunction.function_code}
\`\`\`

SLIDE CONTEXT:
- Title: ${currentSlide.title}
- Content: ${currentSlide.content || ''}
- Additional Content: ${currentSlide.content2 || ''}
- Current Parameters: ${JSON.stringify(currentSlide.visual.params || [])}

USER REQUEST: ${modification}

REQUIREMENTS:
1. Return ONLY the updated JavaScript function code - no explanations, no markdown, no wrapper text
2. The function should accept (ctx, ...params) as parameters where params match the slide's visual.params
3. Keep the same function signature and name: ${currentVisualFunction.function_name}
4. Use canvas drawing commands: ctx.beginPath, ctx.arc, ctx.fillRect, ctx.strokeRect, etc.
5. Ensure all coordinates fit within the media area: x: 200, y: 200, width: 600, height: 400
6. Use ctx.save() and ctx.restore() to preserve context state
7. Make the drawing educational and clear, relevant to the slide content
8. If parameters are used, make sure they enhance the visualization appropriately
9. Use colors that are educational and clear: blues, greens, oranges for different elements

RESPOND WITH ONLY THE JAVASCRIPT FUNCTION CODE:`;

      responseHandler = async (aiResponse) => {
        let updatedCode = aiResponse.trim();
        
        // Clean up the response - remove any markdown formatting
        if (updatedCode.startsWith('```javascript')) {
          updatedCode = updatedCode.replace(/^```javascript\n/, '').replace(/\n```$/, '');
        } else if (updatedCode.startsWith('```')) {
          updatedCode = updatedCode.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        
        // Validate the function code syntax
        try {
          new Function('ctx', 'param1', 'param2', 'param3', updatedCode);
        } catch (syntaxError) {
          throw new Error(`Generated function has syntax error: ${syntaxError.message}`);
        }
        
        // --- CHANGE: Return 'updatedVisual' object for staging ---
        // The database update is removed from this step.
        return {
          updatedVisual: {
            functionName: currentVisualFunction.function_name,
            code: updatedCode
          },
          message: 'AI suggested a visual modification.'
        };
      };
      
    } else {
      // --- Content modification (existing functionality) ---
      aiPrompt = `You are helping modify an educational lesson slide. Here's the current slide content:

${JSON.stringify(currentSlide, null, 2)}

Available visual functions: ${availableVisualFunctions.join(', ')}

SLIDE CONTEXT:
- This is step ${stepOrder} in an educational video
- Speaker: ${currentSlide.speaker}
- Current visual: ${currentSlide.visual?.type || 'none'}

USER REQUEST: "${modification}"

Please modify the slide according to the user's request and return ONLY a valid JSON object with the modified slide data. Keep the same structure but update the relevant fields based on the modification request.

IMPORTANT: 
- Only return valid JSON, no explanations, no markdown formatting
- Keep all existing fields unless specifically asked to change them
- If visual functions are mentioned, use only those from the available list: ${availableVisualFunctions.join(', ')}
- Ensure narration text is natural and educational
- If changing visual parameters, provide appropriate values in the visual.params array
- Maintain educational tone and clarity

RESPOND WITH ONLY THE JSON OBJECT:`;

      responseHandler = async (aiResponse) => {
        let modifiedSlide;
        try {
          const cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          modifiedSlide = JSON.parse(cleanJson);
        } catch (parseError) {
          throw new Error('AI returned invalid JSON format');
        }
        
        return {
          modifiedSlide: modifiedSlide,
          message: 'AI suggested a content modification.'
        };
      };
    }
    
    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514", // Or your preferred model
      max_tokens: modifyType === 'visual' ? 4000 : 1000,
      messages: [
        { role: "user", content: aiPrompt }
      ]
    });
    
    if (!message.content || !message.content[0]) {
      throw new Error('No response from AI service');
    }
    
    const aiResponse = message.content[0].text;
    console.log(`✅ AI generated response (${aiResponse.length} characters)`);
    
    // Process the response based on modification type
    const result = await responseHandler(aiResponse);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('❌ Error in AI modification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI modification failed'
    });
  }
});

// AI modification for visual functions endpoint
app.post('/api/project/:projectId/visual-function/:functionName/ai-modify', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId, functionName } = req.params;
    const { currentCode, modification } = req.body;
    
    console.log(`🤖 AI visual function modification for ${functionName} in project: ${projectId}`);
    console.log(`📝 Request: ${modification}`);
    
    // Verify project ownership
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Verify function exists
    const visualFunction = projectData.visualFunctions.find(
      vf => vf.function_name === functionName
    );
    
    if (!visualFunction) {
      return res.status(404).json({
        success: false,
        error: 'Visual function not found'
      });
    }
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured'
      });
    }
    
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const aiPrompt = `You are an expert at writing HTML5 Canvas drawing functions for educational videos.

CURRENT VISUAL FUNCTION CODE:
\`\`\`javascript
${currentCode}
\`\`\`

FUNCTION NAME: ${functionName}

USER REQUEST: ${modification}

REQUIREMENTS:
1. Return ONLY the updated JavaScript function code - no explanations, no markdown, no wrapper text
2. The function should accept (ctx, ...params) as parameters
3. Keep the same function signature and name: ${functionName}
4. Use canvas drawing commands: ctx.beginPath, ctx.arc, ctx.fillRect, ctx.strokeRect, etc.
5. Ensure all coordinates fit within the media area: x: 200, y: 200, width: 600, height: 400
6. Use ctx.save() and ctx.restore() to preserve context state
7. Make the drawing educational and clear
8. Use colors that are educational and clear: blues, greens, oranges for different elements
9. If the modification asks for specific changes, implement them while maintaining the function structure
10. Ensure the code is syntactically correct and will execute without errors

RESPOND WITH ONLY THE JAVASCRIPT FUNCTION CODE:`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        { role: "user", content: aiPrompt }
      ]
    });
    
    if (!message.content || !message.content[0]) {
      throw new Error('No response from AI service');
    }
    
    let updatedCode = message.content[0].text.trim();
    
    // Clean up the response - remove any markdown formatting
    if (updatedCode.startsWith('```javascript')) {
      updatedCode = updatedCode.replace(/^```javascript\n/, '').replace(/\n```$/, '');
    } else if (updatedCode.startsWith('```')) {
      updatedCode = updatedCode.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    // Validate the function code
    try {
      new Function('ctx', 'param1', 'param2', 'param3', updatedCode);
    } catch (syntaxError) {
      throw new Error(`Generated function has syntax error: ${syntaxError.message}`);
    }
    
    console.log(`✅ AI generated valid visual function code (${updatedCode.length} characters)`);
    
    res.json({
      success: true,
      updatedCode: updatedCode,
      functionName: functionName,
      message: 'Visual function modified by AI'
    });
    
  } catch (error) {
    console.error('❌ Error in AI visual function modification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI visual function modification failed'
    });
  }
});

// PDF export endpoint (add after AI modification endpoint)
app.get('/api/project/:projectId/export-pdf', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`📄 PDF export request for project: ${projectId}`);
    
    // Get project data
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Enhanced HTML content with better print styles
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${projectData.project.title} - Script</title>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6;
            color: #333;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #1a5276;
            padding-bottom: 20px;
        }
        .step { 
            margin-bottom: 30px; 
            padding: 20px; 
            border: 1px solid #ddd; 
            border-radius: 8px; 
            page-break-inside: avoid;
        }
        .step-title { 
            font-size: 18px; 
            font-weight: bold; 
            color: #1a5276; 
            margin-bottom: 10px; 
        }
        .speaker { 
            color: #666; 
            font-size: 14px; 
            margin-bottom: 10px; 
            font-weight: bold;
        }
        .content { 
            margin-bottom: 15px; 
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .narration { 
            background: #e8f4fd; 
            padding: 15px; 
            border-radius: 5px; 
            font-style: italic; 
            border-left: 4px solid #1a5276;
        }
        .visual-info { 
            color: #e74c3c; 
            font-size: 12px; 
            margin-top: 10px; 
            font-weight: bold;
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1a5276;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        /* Print styles */
        @media print {
            .print-button { display: none; }
            body { margin: 20px; }
            .step { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">🖨️ Print to PDF</button>
    
    <div class="header">
        <h1>${projectData.project.title}</h1>
        <p>Educational Video Script</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <p>Project ID: ${projectId}</p>
    </div>
    
    ${projectData.lessonSteps.map((step, index) => `
        <div class="step">
            <div class="step-title">Step ${index + 1}: ${step.title || 'Untitled'}</div>
            <div class="speaker">🎤 Speaker: ${step.speaker}</div>
            ${step.content ? `<div class="content"><strong>📝 Content:</strong><br>${step.content.replace(/\n/g, '<br>')}</div>` : ''}
            ${step.content2 ? `<div class="content"><strong>📋 Additional Content:</strong><br>${step.content2.replace(/\n/g, '<br>')}</div>` : ''}
            <div class="narration">
                <strong>🎬 Narration:</strong><br>
                ${(step.narration || 'No narration').replace(/\n/g, '<br>')}
            </div>
            ${step.visual_type ? `<div class="visual-info">🎨 Visual: ${step.visual_type}</div>` : ''}
        </div>
    `).join('')}
    
    <script>
        // Auto-print dialog can be triggered here if needed
        // setTimeout(() => window.print(), 1000);
    </script>
</body>
</html>`;
    
    // Return HTML that can be printed to PDF
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
   
 } catch (error) {
   console.error('❌ Error exporting script:', error);
   res.status(500).json({
     success: false,
     error: error.message || 'Script export failed'
   });
 }
});

// Enhanced video generation endpoint (replace the existing generate-video endpoint)
app.post('/api/generate-video', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.body;
    console.log(`🔧 Enhanced video generation request for project: ${projectId}`);
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    console.log(`⚡ Enhanced video generation for project: ${projectId}`);
    
    // Get project data with all related information
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
    
    // Check if video already exists and is recent
    const existingVideo = projectData.videos.find(v => v.created_at);
    const lastUpdated = new Date(projectData.project.updated_at);
    
    if (existingVideo) {
      const videoCreated = new Date(existingVideo.created_at);
      if (videoCreated > lastUpdated) {
        console.log('📹 Using existing video (no changes detected)');
        return res.json({
          success: true,
          message: 'Video already exists and is up to date',
          projectId: projectId,
          storagePath: existingVideo.storage_path,
          duration: existingVideo.duration,
          useExisting: true
        });
      }
    }
    
    // Create temporary script file with enhanced audio handling
    const tempScriptPath = await createTempScriptFile(projectData);
    let tempVideoPath = null;
    const videoOutputDir = `/tmp/output/${projectId}`;
    
    try {
      await fs.mkdir(videoOutputDir, { recursive: true });
      
      const videoName = `video_${Date.now()}`;
      const generatorOptions = {
        outputDir: videoOutputDir,
        videoName: videoName,
        reuseExistingAudio: true, // Flag to reuse existing audio files
        projectData: projectData // Pass project data for audio reuse
      };
      
      const generator = new FixedOptimizedVideoGenerator(tempScriptPath, {
        ...generatorOptions,
        supabase: supabase,
        userId: req.user.id,
        projectId: projectId
      });
      
      tempVideoPath = await generator.generate();
      
      console.log(`✅ Enhanced video generation complete: ${tempVideoPath}`);
      
      // Upload new video to storage
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
      
      // Delete old video if exists
      if (existingVideo?.storage_path) {
        try {
          await StorageService.deleteFile(existingVideo.bucket_name, existingVideo.storage_path);
          await supabase
            .from('videos')
            .delete()
            .eq('project_id', projectId);
        } catch (deleteError) {
          console.warn('⚠️ Could not delete old video:', deleteError.message);
        }
      }
      
      // Save new video to database
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
        message: 'Enhanced video generated successfully!',
        projectId: projectId,
        storagePath: storagePath,
        duration: videoDuration,
        audioFilesReused: projectData.audioFiles.length
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
    console.error('❌ Error in enhanced video generation:', error);
    monitoring.error('Enhanced video generation failed', error, { userId: req.user.id });
    res.status(500).json({
      success: false,
      error: error.message || 'Enhanced video generation failed'
    });
  }
});

// 1. Update Visual Function Endpoint
app.put('/api/project/:projectId/visual-function/:functionName', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId, functionName } = req.params;
    const { functionCode } = req.body;
    
    console.log(`🎨 Updating visual function ${functionName} for project: ${projectId}`);
    
    // Verify project ownership
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Validate function code (basic syntax check)
    try {
      new Function('ctx', 'param1', 'param2', 'param3', functionCode);
    } catch (syntaxError) {
      return res.status(400).json({
        success: false,
        error: `Invalid function syntax: ${syntaxError.message}`
      });
    }
    
    // Update visual function in database
    const { data: visualFunction, error } = await supabase
    .from('visual_functions')
    .update({
      function_code: functionCode,
      updated_at: new Date()
    })
    .eq('project_id', projectId)
    .eq('function_name', functionName)
    .select()
    .single();

  if (error) throw error;
    
    res.json({
      success: true,
      message: 'Visual function updated successfully',
      visualFunction: visualFunction
    });
    
  } catch (error) {
    console.error('❌ Error updating visual function:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update visual function'
    });
  }
});

// 2. Add New Visual Function Endpoint
app.post('/api/project/:projectId/visual-function', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { functionName, functionCode } = req.body;
    
    if (!functionName || !functionCode) {
      return res.status(400).json({
        success: false,
        error: 'Function name and code are required'
      });
    }
    
    console.log(`🎨 Adding new visual function ${functionName} for project: ${projectId}`);
    
    // Verify project ownership
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Validate function code
    try {
      new Function('ctx', 'param1', 'param2', 'param3', functionCode);
    } catch (syntaxError) {
      return res.status(400).json({
        success: false,
        error: `Invalid function syntax: ${syntaxError.message}`
      });
    }
    
    // Check if function name already exists
    const { data: existing } = await supabase
      .from('visual_functions')
      .select('id')
      .eq('project_id', projectId)
      .eq('function_name', functionName)
      .single();
    
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Function with this name already exists'
      });
    }
    
    // Insert new visual function
    const { data: visualFunction, error } = await supabase
      .from('visual_functions')
      .insert([{
        project_id: projectId,
        function_name: functionName,
        function_code: functionCode
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Visual function added successfully',
      visualFunction: visualFunction
    });
    
  } catch (error) {
    console.error('❌ Error adding visual function:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add visual function'
    });
  }
});

// 3. Delete Visual Function Endpoint
app.delete('/api/project/:projectId/visual-function/:functionName', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId, functionName } = req.params;
    
    console.log(`🗑️ Deleting visual function ${functionName} for project: ${projectId}`);
    
    // Verify project ownership
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if function is being used in lesson steps
    const { data: usedInSteps } = await supabase
      .from('lesson_steps')
      .select('step_order, title')
      .eq('project_id', projectId)
      .eq('visual_type', functionName);
    
    if (usedInSteps && usedInSteps.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete function: used in steps ${usedInSteps.map(s => s.step_order).join(', ')}`,
        usedInSteps: usedInSteps
      });
    }
    
    // Delete visual function
    const { error } = await supabase
      .from('visual_functions')
      .delete()
      .eq('project_id', projectId)
      .eq('function_name', functionName);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Visual function deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting visual function:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete visual function'
    });
  }
});

// 4. Update Speaker Configuration Endpoint
app.put('/api/project/:projectId/speaker/:speakerKey', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId, speakerKey } = req.params;
    const { voice, model, name, color, gender } = req.body;
    
    console.log(`👤 Updating speaker ${speakerKey} for project: ${projectId}`);
    
    // Verify project ownership
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Update speaker in database
    const { data: speaker, error } = await supabase
      .from('speakers')
      .update({
        voice: voice,
        model: model,
        name: name,
        color: color,
        gender: gender,
        updated_at: new Date()
      })
      .eq('project_id', projectId)
      .eq('speaker_key', speakerKey)
      .select()
      .single();
    
    if (error) throw error;
    
    // Check if voice/model changed - if so, mark for audio regeneration
    const needsAudioRegeneration = voice !== speaker.voice || model !== speaker.model;
    
    let audioRegenerationSteps = [];
    if (needsAudioRegeneration) {
      // Find all steps using this speaker
      const { data: stepsWithSpeaker } = await supabase
        .from('lesson_steps')
        .select('step_order, title')
        .eq('project_id', projectId)
        .eq('speaker', speakerKey);
      
      audioRegenerationSteps = stepsWithSpeaker || [];
    }
    
    res.json({
      success: true,
      message: 'Speaker updated successfully',
      speaker: speaker,
      needsAudioRegeneration: needsAudioRegeneration,
      affectedSteps: audioRegenerationSteps
    });
    
  } catch (error) {
    console.error('❌ Error updating speaker:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update speaker'
    });
  }
});

// 5. Bulk Audio Regeneration Endpoint
// app.post('/api/project/:projectId/regenerate-audio', authenticateService, extractUserInfo, async (req, res) => {
//   try {
//     const { projectId } = req.params;
//     const { stepOrders, reason } = req.body; // Array of step orders to regenerate
    
//     console.log(`🎵 Bulk audio regeneration for project: ${projectId}, steps: ${stepOrders.join(', ')}`);
    
//     // Verify project ownership
//     const projectData = await DatabaseService.getProject(projectId, req.user.id);
//     if (!projectData) {
//       return res.status(404).json({
//         success: false,
//         error: 'Project not found'
//       });
//     }
    
//     if (!process.env.SMALLEST_API_KEY) {
//       return res.status(500).json({
//         success: false,
//         error: 'Audio generation service not configured'
//       });
//     }
    
//     const results = [];
    
//     for (const stepOrder of stepOrders) {
//       try {
//         // Get lesson step and speaker config
//         const { data: lessonStep } = await supabase
//           .from('lesson_steps')
//           .select('*')
//           .eq('project_id', projectId)
//           .eq('step_order', stepOrder)
//           .single();
        
//         const { data: speaker } = await supabase
//           .from('speakers')
//           .select('*')
//           .eq('project_id', projectId)
//           .eq('speaker_key', lessonStep.speaker)
//           .single();
        
//         if (!lessonStep || !speaker) {
//           results.push({
//             stepOrder: stepOrder,
//             success: false,
//             error: 'Step or speaker not found'
//           });
//           continue;
//         }
        
//         // Generate new audio
//         const audioBuffer = await generateAudioWithSmallestAi(
//           lessonStep.narration, 
//           {
//             voice: speaker.voice,
//             model: speaker.model
//           }
//         );
        
//         // Save temporary audio file
//         const tempAudioPath = `/tmp/temp_audio_${projectId}_${stepOrder}_${Date.now()}.wav`;
//         await fs.writeFile(tempAudioPath, audioBuffer);
        
//         // Upload to storage
//         const audioFileName = `${projectId}_step_${stepOrder}_${Date.now()}.wav`;
//         const storagePath = await StorageService.uploadFile(
//           'audio-files',
//           audioFileName,
//           tempAudioPath,
//           req.user.id
//         );
        
//         // Get audio duration
//         const duration = await getAudioDuration(tempAudioPath);
        
//         // Delete old audio file
//         const { data: oldAudio } = await supabase
//           .from('audio_files')
//           .select('storage_path, bucket_name')
//           .eq('lesson_step_id', lessonStep.id)
//           .single();
        
//         if (oldAudio?.storage_path) {
//           await StorageService.deleteFile(oldAudio.bucket_name, oldAudio.storage_path);
//         }
        
//         // Update audio file record
//         await supabase
//           .from('audio_files')
//           .upsert([{
//             lesson_step_id: lessonStep.id,
//             storage_path: storagePath,
//             bucket_name: 'audio-files',
//             duration: duration
//           }]);
        
//         // Clean up temp file
//         await fs.unlink(tempAudioPath);
        
//         results.push({
//           stepOrder: stepOrder,
//           success: true,
//           duration: duration
//         });
        
//       } catch (stepError) {
//         console.error(`❌ Audio regeneration failed for step ${stepOrder}:`, stepError);
//         results.push({
//           stepOrder: stepOrder,
//           success: false,
//           error: stepError.message
//         });
//       }
//     }
    
//     const successCount = results.filter(r => r.success).length;
//     const failureCount = results.length - successCount;
    
//     res.json({
//       success: true,
//       message: `Audio regeneration completed: ${successCount} successful, ${failureCount} failed`,
//       results: results,
//       reason: reason
//     });
    
//   } catch (error) {
//     console.error('❌ Error in bulk audio regeneration:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message || 'Bulk audio regeneration failed'
//     });
//   }
// });

// 6. Get Project Visual Functions (for editing interface)
app.get('/api/project/:projectId/visual-functions', authenticateService, extractUserInfo, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verify project ownership
    const projectData = await DatabaseService.getProject(projectId, req.user.id);
    if (!projectData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const { data: visualFunctions, error } = await supabase
      .from('visual_functions')
      .select('*')
      .eq('project_id', projectId)
      .order('function_name');
    
    if (error) throw error;
    
    res.json({
      success: true,
      visualFunctions: visualFunctions || []
    });
    
  } catch (error) {
    console.error('❌ Error getting visual functions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get visual functions'
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