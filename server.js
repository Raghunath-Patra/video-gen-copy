// Enhanced server.js - Complete Express server with Project Management and FIXED Visual Function Serialization
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

// Import your existing modules
const EnhancedContentGenerator = require('./content_generator');
const VisualPreviewGenerator = require('./visual_preview_tool');
const FixedOptimizedVideoGenerator = require('./optimized_video_generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// In-memory storage for active projects (use database in production)
const projects = new Map();
let projectVideoFiles = new Map(); // projectId -> actual video filename

// Ensure required directories exist
async function initializeDirectories() {
    const dirs = ['uploads', 'temp', 'output/web_projects', 'public'];
    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            console.error(`Error creating directory ${dir}:`, error);
        }
    }
}

// NEW: Project Management Functions
async function scanProjectsDirectory() {
    try {
        const webProjectsDir = path.join(__dirname, 'output', 'web_projects');
        
        if (!existsSync(webProjectsDir)) {
            return [];
        }
        
        const projectDirs = await fs.readdir(webProjectsDir);
        const projectsList = [];
        
        for (const projectId of projectDirs) {
            const projectPath = path.join(webProjectsDir, projectId);
            const stat = await fs.stat(projectPath);
            
            if (stat.isDirectory()) {
                const projectInfo = await analyzeProject(projectId, projectPath);
                if (projectInfo) {
                    projectsList.push(projectInfo);
                }
            }
        }
        
        // Sort by creation date (newest first)
        projectsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return projectsList;
    } catch (error) {
        console.error('Error scanning projects directory:', error);
        return [];
    }
}

async function analyzeProject(projectId, projectPath) {
    try {
        const scriptPath = path.join(projectPath, 'generated_script.js');
        const videoOutputDir = path.join(projectPath, 'video_output');
        const inputPath = path.join(projectPath, 'input.md');
        
        // Basic project info
        const projectInfo = {
            projectId: projectId,
            projectPath: projectPath,
            status: 'unknown',
            hasScript: existsSync(scriptPath),
            hasVideo: false,
            hasInput: existsSync(inputPath),
            videoFiles: [],
            createdAt: null,
            title: 'Untitled Project',
            lessonStepsCount: 0,
            speakers: [],
            visualFunctions: []
        };
        
        // Get creation date from directory
        const stat = await fs.stat(projectPath);
        projectInfo.createdAt = stat.mtime;
        
        // Read input content for title
        if (projectInfo.hasInput) {
            try {
                const inputContent = await fs.readFile(inputPath, 'utf8');
                const lines = inputContent.split('\n');
                const firstHeader = lines.find(line => line.startsWith('#'));
                if (firstHeader) {
                    projectInfo.title = firstHeader.replace(/^#+\s*/, '').trim();
                }
            } catch (error) {
                console.error(`Error reading input for project ${projectId}:`, error);
            }
        }
        
        // Analyze script if exists
        if (projectInfo.hasScript) {
            try {
                const scriptContent = await fs.readFile(scriptPath, 'utf8');
                
                // Parse script content
                const sandbox = {
                    module: { exports: {} },
                    exports: {},
                    require: () => ({}),
                    console: { log: () => {} }
                };
                
                const func = new Function('module', 'exports', 'require', 'console', scriptContent);
                func(sandbox.module, sandbox.exports, sandbox.require, sandbox.console);
                
                const result = sandbox.module.exports;
                
                if (result.LESSON_CONTENT && result.visualFunctions) {
                    projectInfo.lessonStepsCount = result.LESSON_CONTENT.lessonSteps?.length || 0;
                    projectInfo.speakers = Object.keys(result.LESSON_CONTENT.speakers || {});
                    projectInfo.visualFunctions = Object.keys(result.visualFunctions || {});
                    
                    // Better title from lesson content
                    if (result.LESSON_CONTENT.lessonSteps && result.LESSON_CONTENT.lessonSteps.length > 0) {
                        const firstStep = result.LESSON_CONTENT.lessonSteps[0];
                        if (firstStep.title && projectInfo.title === 'Untitled Project') {
                            projectInfo.title = firstStep.title;
                        }
                    }
                }
            } catch (error) {
                console.error(`Error parsing script for project ${projectId}:`, error);
            }
        }
        
        // Check for videos
        if (existsSync(videoOutputDir)) {
            try {
                const videoFiles = await fs.readdir(videoOutputDir);
                const mp4Files = videoFiles.filter(file => file.endsWith('.mp4'));
                
                projectInfo.hasVideo = mp4Files.length > 0;
                projectInfo.videoFiles = mp4Files;
                
                // Store the first video file for quick access
                if (mp4Files.length > 0) {
                    projectVideoFiles.set(projectId, mp4Files[0]);
                }
            } catch (error) {
                console.error(`Error checking videos for project ${projectId}:`, error);
            }
        }
        
        // Determine project status
        if (projectInfo.hasVideo) {
            projectInfo.status = 'completed';
        } else if (projectInfo.hasScript) {
            projectInfo.status = 'script_ready';
        } else if (projectInfo.hasInput) {
            projectInfo.status = 'input_only';
        } else {
            projectInfo.status = 'empty';
        }
        
        return projectInfo;
    } catch (error) {
        console.error(`Error analyzing project ${projectId}:`, error);
        return null;
    }
}

// NEW: API Routes for Project Management

// Get all projects
app.get('/api/projects', async (req, res) => {
    try {
        const projectsList = await scanProjectsDirectory();
        
        res.json({
            success: true,
            projects: projectsList,
            total: projectsList.length
        });
    } catch (error) {
        console.error('❌ Error listing projects:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to list projects'
        });
    }
});

// Get specific project details
app.get('/api/project/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const projectPath = path.join(__dirname, 'output', 'web_projects', projectId);
        
        if (!existsSync(projectPath)) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }
        
        const projectInfo = await analyzeProject(projectId, projectPath);
        
        if (!projectInfo) {
            return res.status(500).json({
                success: false,
                error: 'Failed to analyze project'
            });
        }
        
        // Load full script content if available
        if (projectInfo.hasScript) {
            const scriptPath = path.join(projectPath, 'generated_script.js');
            try {
                const scriptContent = await fs.readFile(scriptPath, 'utf8');
                
                // Parse lesson steps for detailed view
                const sandbox = {
                    module: { exports: {} },
                    exports: {},
                    require: () => ({}),
                    console: { log: () => {} }
                };
                
                const func = new Function('module', 'exports', 'require', 'console', scriptContent);
                func(sandbox.module, sandbox.exports, sandbox.require, sandbox.console);
                
                const result = sandbox.module.exports;
                
                if (result.LESSON_CONTENT) {
                    projectInfo.lessonSteps = result.LESSON_CONTENT.lessonSteps;
                    projectInfo.speakers = result.LESSON_CONTENT.speakers;
                    projectInfo.visualFunctions = result.visualFunctions;
                    projectInfo.generatedScript = scriptContent;
                }
            } catch (error) {
                console.error(`Error loading script for project ${projectId}:`, error);
            }
        }
        
        res.json({
            success: true,
            project: projectInfo
        });
        
    } catch (error) {
        console.error('❌ Error getting project details:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get project details'
        });
    }
});

// Resume project from appropriate step
app.get('/api/project/:projectId/resume', async (req, res) => {
    try {
        const { projectId } = req.params;
        const projectPath = path.join(__dirname, 'output', 'web_projects', projectId);
        
        if (!existsSync(projectPath)) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }
        
        const projectInfo = await analyzeProject(projectId, projectPath);
        
        if (!projectInfo) {
            return res.status(500).json({
                success: false,
                error: 'Failed to analyze project'
            });
        }
        
        // Determine which step to resume from
        let resumeStep = 1;
        let resumeData = { 
            projectInfo,
            speakers: {},
            visualFunctions: {},
            lessonSteps: []
        };
        
        // Load script data if available (for both script_ready AND completed projects)
        if (projectInfo.hasScript) {
            const scriptPath = path.join(projectPath, 'generated_script.js');
            console.log(`🔍 Attempting to load script from: ${scriptPath}`);
            console.log(`📁 Script file exists: ${existsSync(scriptPath)}`);
            
            try {
                const scriptContent = await fs.readFile(scriptPath, 'utf8');
                console.log(`📄 Script content length: ${scriptContent.length} characters`);
                console.log(`📝 Script preview: ${scriptContent.substring(0, 200)}...`);
                
                const sandbox = {
                    module: { exports: {} },
                    exports: {},
                    require: () => ({}),
                    console: { log: () => {} }
                };
                
                const func = new Function('module', 'exports', 'require', 'console', scriptContent);
                func(sandbox.module, sandbox.exports, sandbox.require, sandbox.console);
                
                const result = sandbox.module.exports;
                console.log(`🔧 Parsed result keys: ${Object.keys(result)}`);
                
                if (result.LESSON_CONTENT) {
                    resumeData.lessonSteps = result.LESSON_CONTENT.lessonSteps || [];
                    resumeData.speakers = result.LESSON_CONTENT.speakers || {};
                    resumeData.visualFunctions = result.visualFunctions || {};
                    
                    console.log(`✅ Loaded script data for project ${projectId}:`);
                    console.log(`   - ${resumeData.lessonSteps.length} lesson steps`);
                    console.log(`   - ${Object.keys(resumeData.speakers).length} speakers`);
                    console.log(`   - ${Object.keys(resumeData.visualFunctions).length} visual functions`);
                    
                    if (resumeData.lessonSteps.length > 0) {
                        console.log(`   - First step title: ${resumeData.lessonSteps[0].title}`);
                    }
                } else {
                    console.warn(`⚠️ Script file exists but missing LESSON_CONTENT for project ${projectId}`);
                    console.log(`📋 Available keys in result: ${Object.keys(result)}`);
                }
            } catch (error) {
                console.error(`❌ Error loading script for resume:`, error);
                console.error(`❌ Error details:`, error.message);
                console.error(`❌ Error stack:`, error.stack);
                
                // Provide fallback speakers data
                resumeData.speakers = {
                    teacher: { voice: 'aditi', model: 'lightning-v2', name: 'Prof. Priya', color: '#1a5276', gender: 'female' },
                    student1: { voice: 'nikita', model: 'lightning-v2', name: 'Sneha', color: '#a9dfbf', gender: 'female' },
                    student2: { voice: 'lakshya', model: 'lightning-v2', name: 'Arjun', color: '#f39c12', gender: 'male' }
                };
            }
        } else {
            console.log(`❌ Project ${projectId} has no script file`);
        }
        
        // Determine resume step AFTER loading script data
        if (projectInfo.hasVideo) {
            resumeStep = 3; // Go to video result (default behavior)
        } else if (projectInfo.hasScript) {
            resumeStep = 2; // Go to script editor
        } else if (projectInfo.hasInput) {
            resumeStep = 1; // Stay at input step but load the input
            
            const inputPath = path.join(projectPath, 'input.md');
            try {
                const inputContent = await fs.readFile(inputPath, 'utf8');
                resumeData.inputContent = inputContent;
            } catch (error) {
                console.error(`Error loading input for resume:`, error);
            }
        }
        
        res.json({
            success: true,
            resumeStep: resumeStep,
            projectId: projectId,
            data: resumeData
        });
        
    } catch (error) {
        console.error('❌ Error resuming project:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to resume project'
        });
    }
});

// Delete project
app.delete('/api/project/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const projectPath = path.join(__dirname, 'output', 'web_projects', projectId);
        
        if (!existsSync(projectPath)) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }
        
        // Remove project directory
        await fs.rmdir(projectPath, { recursive: true });
        
        // Clean up in-memory references
        projects.delete(projectId);
        projectVideoFiles.delete(projectId);
        
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

// FIXED: Enhanced script endpoint with proper function serialization
app.get('/api/project/:projectId/script', async (req, res) => {
    try {
        const { projectId } = req.params;
        const projectPath = path.join(__dirname, 'output', 'web_projects', projectId);
        const scriptPath = path.join(projectPath, 'generated_script.js');
        
        console.log(`🔍 Debug script request for project: ${projectId}`);
        console.log(`📁 Project path: ${projectPath}`);
        console.log(`📄 Script path: ${scriptPath}`);
        console.log(`✅ Project dir exists: ${existsSync(projectPath)}`);
        console.log(`✅ Script file exists: ${existsSync(scriptPath)}`);
        
        if (!existsSync(scriptPath)) {
            return res.status(404).json({
                success: false,
                error: 'Script file not found',
                paths: {
                    projectPath,
                    scriptPath,
                    projectExists: existsSync(projectPath),
                    scriptExists: existsSync(scriptPath)
                }
            });
        }
        
        const scriptContent = await fs.readFile(scriptPath, 'utf8');
        console.log(`📝 Script content length: ${scriptContent.length}`);
        
        // Parse the script
        const sandbox = {
            module: { exports: {} },
            exports: {},
            require: () => ({}),
            console: { log: () => {} }
        };
        
        const func = new Function('module', 'exports', 'require', 'console', scriptContent);
        func(sandbox.module, sandbox.exports, sandbox.require, sandbox.console);
        
        const result = sandbox.module.exports;
        console.log(`🔧 Parsed result keys: ${Object.keys(result)}`);
        
        const responseData = {
            success: true,
            projectId: projectId,
            scriptExists: true,
            contentLength: scriptContent.length,
            parsedKeys: Object.keys(result),
            hasLessonContent: !!result.LESSON_CONTENT,
            lessonStepsCount: result.LESSON_CONTENT?.lessonSteps?.length || 0,
            speakersCount: Object.keys(result.LESSON_CONTENT?.speakers || {}).length,
            visualFunctionsCount: Object.keys(result.visualFunctions || {}).length
        };
        
        if (result.LESSON_CONTENT) {
            responseData.lessonSteps = result.LESSON_CONTENT.lessonSteps || [];
            responseData.speakers = result.LESSON_CONTENT.speakers || {};
        }
        
        // CRITICAL FIX: Properly serialize visual functions for frontend
        if (result.visualFunctions) {
            responseData.visualFunctions = {};
            
            Object.keys(result.visualFunctions).forEach(funcName => {
                const func = result.visualFunctions[funcName];
                
                if (typeof func === 'function') {
                    // Store the actual function (it will be serialized by JSON.stringify)
                    responseData.visualFunctions[funcName] = func;
                    console.log(`🎨 Serializing function ${funcName}`);
                } else {
                    console.warn(`⚠️ Function ${funcName} is not a function:`, typeof func);
                }
            });
            
            console.log(`🎨 Visual functions being sent:`, Object.keys(responseData.visualFunctions));
            
            // Debug: log first few characters of each function
            Object.keys(responseData.visualFunctions).forEach(funcName => {
                const funcStr = responseData.visualFunctions[funcName].toString();
                console.log(`   ${funcName}: ${funcStr.substring(0, 100)}...`);
            });
        } else {
            responseData.visualFunctions = {};
            console.log(`❌ No visual functions found in script result`);
        }
        
        console.log(`📊 Response data summary:`, {
            lessonStepsCount: responseData.lessonStepsCount,
            speakersCount: responseData.speakersCount,
            visualFunctionsCount: responseData.visualFunctionsCount,
            visualFunctionNames: Object.keys(responseData.visualFunctions)
        });
        
        // IMPORTANT: Custom JSON serialization to handle functions
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(responseData, function(key, value) {
            if (typeof value === 'function') {
                return value.toString();
            }
            return value;
        }));
        
    } catch (error) {
        console.error('❌ Error in script debug endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Get project's input content
app.get('/api/project/:projectId/input', async (req, res) => {
    try {
        const { projectId } = req.params;
        const inputPath = path.join(__dirname, 'output', 'web_projects', projectId, 'input.md');
        
        if (!existsSync(inputPath)) {
            return res.status(404).json({
                success: false,
                error: 'Input file not found'
            });
        }
        
        const inputContent = await fs.readFile(inputPath, 'utf8');
        
        res.json({
            success: true,
            content: inputContent
        });
        
    } catch (error) {
        console.error('❌ Error getting project input:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get project input'
        });
    }
});

// Update project's script
app.put('/api/project/:projectId/script', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { scriptContent, lessonSteps } = req.body;
        
        const projectPath = path.join(__dirname, 'output', 'web_projects', projectId);
        const scriptPath = path.join(projectPath, 'generated_script.js');
        
        if (!existsSync(projectPath)) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }
        
        // Save updated script
        if (scriptContent) {
            await fs.writeFile(scriptPath, scriptContent, 'utf8');
        }
        
        // Update in-memory project data
        const project = projects.get(projectId);
        if (project && lessonSteps) {
            project.lessonSteps = lessonSteps;
        }
        
        res.json({
            success: true,
            message: 'Script updated successfully'
        });
        
    } catch (error) {
        console.error('❌ Error updating project script:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update script'
        });
    }
});

// Add favicon handler to stop the 404 errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).send();
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// EXISTING API ENDPOINTS (keeping all original functionality)

// API endpoint to generate script and visuals
app.post('/api/generate-script', async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Content is required'
            });
        }

        console.log('🚀 Starting script generation...');
        
        // Generate unique project ID
        const projectId = uuidv4();
        const projectDir = path.join(__dirname, 'output', 'web_projects', projectId);
        
        // Create project directory
        await fs.mkdir(projectDir, { recursive: true });
        
        // Save input content
        const inputPath = path.join(projectDir, 'input.md');
        await fs.writeFile(inputPath, content, 'utf8');
        
        // Generate script using your existing content generator
        const contentGenerator = new EnhancedContentGenerator();
        const jsContent = await contentGenerator.generateDynamicContent(content);
        
        // Save the generated script
        const scriptPath = path.join(projectDir, 'generated_script.js');
        await fs.writeFile(scriptPath, jsContent, 'utf8');
        
        // Parse the content to get lesson steps and speakers
        const parsedContent = contentGenerator.parseGeneratedContent(jsContent);
        
        // Store project data
        const projectData = {
            projectId,
            scriptPath,
            projectDir,
            inputContent: content,
            generatedScript: jsContent,
            lessonSteps: parsedContent.lessonSteps,
            speakers: parsedContent.speakers,
            visualFunctions: Object.keys(parsedContent.visualFunctions || {}),
            createdAt: new Date(),
            status: 'script_generated'
        };
        
        projects.set(projectId, projectData);
        
        console.log(`✅ Script generated for project: ${projectId}`);
        
        res.json({
            success: true,
            data: projectData,
            message: 'Script generated successfully'
        });
        
    } catch (error) {
        console.error('❌ Error generating script:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate script'
        });
    }
});

// Enhanced API endpoint to generate preview images
app.post('/api/generate-previews', async (req, res) => {
    try {
        const { projectId } = req.body;
        
        console.log(`🖼️ Generating previews for project: ${projectId}`);
        
        const projectPath = path.join(__dirname, 'output', 'web_projects', projectId);
        const scriptPath = path.join(projectPath, 'generated_script.js');
        const previewsDir = path.join(projectPath, 'previews');
        
        if (!existsSync(scriptPath)) {
            return res.status(404).json({
                success: false,
                error: 'Script file not found'
            });
        }
        
        // Create previews directory
        await fs.mkdir(previewsDir, { recursive: true });
        
        // Load and parse script
        const scriptContent = await fs.readFile(scriptPath, 'utf8');
        const sandbox = {
            module: { exports: {} },
            exports: {},
            require: () => ({}),
            console: { log: () => {} }
        };
        
        const func = new Function('module', 'exports', 'require', 'console', scriptContent);
        func(sandbox.module, sandbox.exports, sandbox.require, sandbox.console);
        
        const result = sandbox.module.exports;
        
        if (!result.LESSON_CONTENT || !result.visualFunctions) {
            return res.status(400).json({
                success: false,
                error: 'Invalid script format'
            });
        }
        
        // Import visual preview generator
        const VisualPreviewGenerator = require('./visual_preview_tool');
        const previewGenerator = new VisualPreviewGenerator();
        
        const lessonSteps = result.LESSON_CONTENT.lessonSteps;
        const speakers = result.LESSON_CONTENT.speakers;
        const visualFunctions = result.visualFunctions;
        
        let successCount = 0;
        const previewImages = [];
        
        // Generate preview for each step
        for (let i = 0; i < lessonSteps.length; i++) {
            const step = lessonSteps[i];
            const filename = `step_${String(i + 1).padStart(2, '0')}_${step.speaker}.png`;
            const outputPath = path.join(previewsDir, filename);
            
            try {
                const success = await previewGenerator.generateVisualPreview(
                    step,
                    visualFunctions,
                    speakers,
                    outputPath
                );
                
                if (success) {
                    console.log(`   ✅ Generated preview ${i + 1}: ${filename}`);
                    previewImages.push({
                        stepIndex: i,
                        filename: filename,
                        path: `/api/preview-image/${projectId}/${i}`
                    });
                    successCount++;
                } else {
                    console.log(`   ❌ Failed to generate preview ${i + 1}: ${filename}`);
                }
            } catch (error) {
                console.error(`   ❌ Error generating preview ${i + 1}:`, error.message);
            }
        }
        
        console.log(`✅ Generated ${successCount}/${lessonSteps.length} previews`);
        
        res.json({
            success: true,
            previewImages,
            totalCount: lessonSteps.length,
            successCount: successCount,
            message: `Generated ${successCount} preview images`
        });
        
    } catch (error) {
        console.error('❌ Error in preview generation:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate previews'
        });
    }
});

// API endpoint to serve preview images
app.get('/api/preview-image/:projectId/:slideIndex', async (req, res) => {
    try {
        const { projectId, slideIndex } = req.params;
        
        const previewDir = path.join(__dirname, 'output', 'web_projects', projectId, 'previews');
        const slideNum = parseInt(slideIndex) + 1;
        
        if (!existsSync(previewDir)) {
            return res.status(404).send('Preview directory not found');
        }
        
        // Try to find the preview image for this slide
        const files = await fs.readdir(previewDir);
        const slideFile = files.find(file => 
            file.startsWith(`step_${slideNum.toString().padStart(2, '0')}`) && 
            file.endsWith('.png')
        );
        
        if (slideFile) {
            const imagePath = path.join(previewDir, slideFile);
            res.sendFile(path.resolve(imagePath));
        } else {
            // Generate a placeholder image indicating no preview
            res.status(404).send('Preview image not found');
        }
        
    } catch (error) {
        console.error('❌ Error serving preview image:', error);
        res.status(500).send('Error loading preview image');
    }
});

// NEW: AI Visual Editor Endpoint
app.post('/api/edit-visual', async (req, res) => {
    try {
        const { projectId, slideIndex, prompt, currentVisualCode } = req.body;
        
        console.log(`🤖 AI Visual Edit Request for project ${projectId}, slide ${slideIndex}`);
        console.log(`📝 Prompt: ${prompt}`);
        
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(400).json({
                success: false,
                error: 'ANTHROPIC_API_KEY not configured'
            });
        }
        
        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        
        // Prepare the AI prompt
        const aiPrompt = `You are an expert at writing HTML5 Canvas drawing functions for educational videos. 

CURRENT VISUAL FUNCTION CODE:
\`\`\`javascript
${currentVisualCode}
\`\`\`

USER REQUEST: ${prompt}

REQUIREMENTS:
1. Return ONLY the updated JavaScript function code - no explanations, no markdown, no wrapper text
2. The function should accept (ctx, ...params) as parameters
3. Keep the same function signature and name
4. Use canvas drawing commands: ctx.beginPath, ctx.arc, ctx.fillRect, ctx.strokeRect, etc.
5. Ensure all coordinates fit within the media area: x: 200, y: 200, width: 600, height: 400
6. Use ctx.save() and ctx.restore() to preserve context state
7. Make the drawing educational and clear
8. If adding animations or transitions, use simple canvas techniques

RESPOND WITH ONLY THE JAVASCRIPT FUNCTION CODE:`;

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [
                {
                    role: "user",
                    content: aiPrompt
                }
            ]
        });

        let updatedCode = message.content[0].text.trim();
        
        // Clean up the response - remove any markdown formatting
        if (updatedCode.startsWith('```javascript')) {
            updatedCode = updatedCode.replace(/^```javascript\n/, '').replace(/\n```$/, '');
        } else if (updatedCode.startsWith('```')) {
            updatedCode = updatedCode.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        
        console.log(`✅ AI generated updated visual code (${updatedCode.length} characters)`);
        
        res.json({
            success: true,
            updatedCode: updatedCode,
            message: 'Visual code updated by AI'
        });
        
    } catch (error) {
        console.error('❌ Error in AI visual editing:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to edit visual with AI'
        });
    }
});

// Enhanced video generation endpoint with path safety
app.post('/api/generate-video', async (req, res) => {
    try {
        const { projectId, slides } = req.body;
        
        console.log(`⚡ OPTIMIZED web video generation for project: ${projectId}`);
        
        const projectDir = path.resolve(__dirname, 'output', 'web_projects', projectId);
        const scriptPath = path.join(projectDir, 'generated_script.js');
        
        if (!existsSync(scriptPath)) {
            // Script regeneration logic
            let content = '';
            if (slides && slides.length > 0) {
                content = `# Generated Educational Content\n\n`;
                slides.forEach((slide, index) => {
                    content += `## ${slide.title}\n\n`;
                    if (slide.content) content += `${slide.content}\n\n`;
                    if (slide.content2) content += `${slide.content2}\n\n`;
                    if (slide.narration) content += `*Narration: ${slide.narration}*\n\n`;
                });
            } else {
                throw new Error('No slides data provided and script file not found');
            }
            
            const EnhancedContentGenerator = require('./content_generator');
            const contentGenerator = new EnhancedContentGenerator();
            const jsContent = await contentGenerator.generateDynamicContent(content);
            
            await fs.mkdir(projectDir, { recursive: true });
            await fs.writeFile(scriptPath, jsContent, 'utf8');
            console.log(`✅ Script regenerated at: ${scriptPath}`);
        }
        
        // Generate video with optimized generator
        const videoOutputDir = path.join(projectDir, 'video_output');
        const videoName = `web_video_${Date.now()}`;
        
        const generatorOptions = {
            outputDir: videoOutputDir,
            videoName: videoName
        };
        
        const generator = new FixedOptimizedVideoGenerator(scriptPath, generatorOptions);
        const videoPath = await generator.generate();
        
        console.log(`✅ Optimized video generation complete: ${videoPath}`);
        
        // Extract the actual filename from the full path
        const actualVideoFilename = path.basename(videoPath);
        console.log(`📹 Actual video filename: ${actualVideoFilename}`);
        
        // Store the mapping for later retrieval
        projectVideoFiles.set(projectId, actualVideoFilename);
        
        res.json({ 
            success: true, 
            message: 'Optimized video generated successfully!',
            projectId: projectId,
            scriptPath: scriptPath,
            videoPath: videoPath,
            videoFilename: actualVideoFilename,
            note: 'Video generated with full parallelization!'
        });
        
    } catch (error) {
        console.error('❌ Error in optimized video generation:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Optimized video generation failed'
        });
    }
});

// Enhanced complete video generation with path safety
app.post('/api/generate-video-complete', async (req, res) => {
    try {
        const { content } = req.body;
        const { v4: uuidv4 } = require('uuid');
        const projectId = uuidv4();
        
        console.log(`⚡ Starting OPTIMIZED complete video generation for project: ${projectId}`);
        
        const projectDir = path.resolve(__dirname, 'output', 'web_projects', projectId);
        const scriptPath = path.join(projectDir, 'generated_script.js');
        const videoOutputDir = path.join(projectDir, 'video_output');
        
        // Generate script
        const EnhancedContentGenerator = require('./content_generator');
        const contentGenerator = new EnhancedContentGenerator();
        
        await fs.mkdir(projectDir, { recursive: true });
        
        // Save input content
        const inputPath = path.join(projectDir, 'input.md');
        await fs.writeFile(inputPath, content, 'utf8');
        
        const jsContent = await contentGenerator.generateDynamicContent(content);
        await fs.writeFile(scriptPath, jsContent, 'utf8');
        
        // Generate video
        const videoName = `complete_video_${Date.now()}`;
        const generatorOptions = {
            outputDir: videoOutputDir,
            videoName: videoName
        };
        
        const generator = new FixedOptimizedVideoGenerator(scriptPath, generatorOptions);
        const videoPath = await generator.generate();
        
        console.log(`✅ OPTIMIZED complete video generation finished: ${videoPath}`);
        
        // Store the actual filename
        const actualVideoFilename = path.basename(videoPath);
        projectVideoFiles.set(projectId, actualVideoFilename);
        
        res.json({ 
            success: true, 
            message: 'Complete optimized video generated successfully!',
            projectId: projectId,
            videoPath: videoPath,
            videoFilename: actualVideoFilename,
            note: 'Video generated with full parallelization!'
        });
        
    } catch (error) {
        console.error('❌ Error in optimized complete video generation:', error);
        res.json({ 
            success: false, 
            error: error.message
        });
    }
});

// Enhanced video serving endpoint with detailed debugging
app.get('/api/video/:projectId', (req, res) => {
    try {
        const { projectId } = req.params;
        console.log(`🎬 Video request for project: ${projectId}`);
        
        // First try to get the stored filename
        let videoFilename = projectVideoFiles.get(projectId);
        let videoPath;
        
        if (videoFilename) {
            videoPath = path.join(__dirname, 'output', 'web_projects', projectId, 'video_output', videoFilename);
            console.log(`📹 Using stored filename: ${videoFilename}`);
        } else {
            // Fallback: scan the video_output directory for any .mp4 file
            const videoDir = path.join(__dirname, 'output', 'web_projects', projectId, 'video_output');
            console.log(`🔍 Scanning directory for video files: ${videoDir}`);
            
            if (existsSync(videoDir)) {
                const files = require('fs').readdirSync(videoDir).filter(file => file.endsWith('.mp4'));
                console.log(`📁 Found files: ${files.join(', ')}`);
                
                if (files.length > 0) {
                    videoFilename = files[0]; // Use the first .mp4 file found
                    videoPath = path.join(videoDir, videoFilename);
                    console.log(`📹 Selected video file: ${videoFilename}`);
                    
                    // Store it for future requests
                    projectVideoFiles.set(projectId, videoFilename);
                } else {
                    console.log(`❌ No .mp4 files found in: ${videoDir}`);
                    return res.status(404).json({
                        error: 'No video files found',
                        projectId: projectId,
                        searchedDirectory: videoDir
                    });
                }
            } else {
                console.log(`❌ Video directory does not exist: ${videoDir}`);
                return res.status(404).json({
                    error: 'Video directory not found',
                    projectId: projectId,
                    expectedDirectory: videoDir
                });
            }
        }
        
        if (!videoPath || !existsSync(videoPath)) {
            console.log(`❌ Video file not found at: ${videoPath}`);
            return res.status(404).json({
                error: 'Video file not found',
                projectId: projectId,
                expectedPath: videoPath
            });
        }
        
        console.log(`✅ Video found, serving: ${videoPath}`);
        
        // Get file stats for debugging
        const stat = require('fs').statSync(videoPath);
        const fileSize = stat.size;
        console.log(`📊 Video file size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
        
        // Check if this is a range request (for video seeking)
        const range = req.headers.range;
        console.log(`🎯 Range request: ${range || 'No range header'}`);
        
        if (range) {
            // Handle range requests for video seeking/streaming
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            
            console.log(`📦 Serving range: ${start}-${end}/${fileSize} (${chunksize} bytes)`);
            
            const file = require('fs').createReadStream(videoPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
                'Cache-Control': 'no-cache'
            };
            res.writeHead(206, head);
            file.pipe(res);
            
            file.on('error', (error) => {
                console.error('❌ Error streaming video chunk:', error);
            });
            
        } else {
            // Serve entire video
            console.log('📺 Serving complete video file');
            
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-cache'
            };
            res.writeHead(200, head);
            
            const stream = require('fs').createReadStream(videoPath);
            stream.pipe(res);
            
            stream.on('error', (error) => {
                console.error('❌ Error streaming complete video:', error);
                if (!res.headersSent) {
                    res.status(500).send('Video streaming error');
                }
            });
            
            stream.on('end', () => {
                console.log('✅ Video streaming completed');
            });
        }
        
    } catch (error) {
        console.error('❌ Error in video endpoint:', error);
        res.status(500).json({
            error: 'Video serving error',
            details: error.message
        });
    }
});

// FIXED: Download endpoint that finds the actual video file
app.get('/api/download/:projectId', (req, res) => {
    try {
        const { projectId } = req.params;
        
        // First try to get the stored filename
        let videoFilename = projectVideoFiles.get(projectId);
        let videoPath;
        
        if (videoFilename) {
            videoPath = path.join(__dirname, 'output', 'web_projects', projectId, 'video_output', videoFilename);
        } else {
            // Fallback: scan the video_output directory
            const videoDir = path.join(__dirname, 'output', 'web_projects', projectId, 'video_output');
            
            if (existsSync(videoDir)) {
                const files = require('fs').readdirSync(videoDir).filter(file => file.endsWith('.mp4'));
                if (files.length > 0) {
                    videoFilename = files[0];
                    videoPath = path.join(videoDir, videoFilename);
                    projectVideoFiles.set(projectId, videoFilename);
                }
            }
        }
        
        console.log(`📥 Download request for: ${videoPath}`);
        
        if (!videoPath || !existsSync(videoPath)) {
            console.log(`❌ Video not found for download: ${videoPath}`);
            return res.status(404).send('Video not found');
        }
        
        console.log(`✅ Starting download: ${videoPath}`);
        
        // Set download filename (keep the original name or create a friendly one)
        const downloadFilename = `educational_video_${projectId.slice(0, 8)}.mp4`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
        res.setHeader('Content-Type', 'video/mp4');
        
        const fileStream = require('fs').createReadStream(videoPath);
        fileStream.pipe(res);
        
        fileStream.on('error', (error) => {
            console.error('❌ Error during download:', error);
            res.status(500).send('Error downloading video');
        });
        
        fileStream.on('end', () => {
            console.log(`✅ Download completed: ${downloadFilename}`);
        });
        
    } catch (error) {
        console.error('❌ Error in download endpoint:', error);
        res.status(500).send('Error downloading video');
    }
});

// Debug endpoint to show actual video files
app.get('/api/debug/videos/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const videoDir = path.join(__dirname, 'output', 'web_projects', projectId, 'video_output');
        const storedFilename = projectVideoFiles.get(projectId);
        
        const debug = {
            projectId: projectId,
            videoDir: videoDir,
            videoDirExists: existsSync(videoDir),
            storedFilename: storedFilename,
            filesInDirectory: []
        };
        
        if (existsSync(videoDir)) {
            debug.filesInDirectory = await fs.readdir(videoDir);
            debug.mp4Files = debug.filesInDirectory.filter(file => file.endsWith('.mp4'));
        }
        
        res.json(debug);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Educational Video Generator API is running',
        timestamp: new Date(),
        projects: projects.size,
        env: {
            hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
            hasSmallestKey: !!process.env.SMALLEST_API_KEY,
            nodeVersion: process.version
        }
    });
});

// Test environment variables endpoint
app.get('/api/test-env', (req, res) => {
    res.json({
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasSmallestKey: !!process.env.SMALLEST_API_KEY,
        nodeVersion: process.version,
        workingDirectory: process.cwd(),
        projectsInMemory: projects.size
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
async function startServer() {
    try {
        await initializeDirectories();
        
        app.listen(PORT, () => {
            console.log('🚀 Enhanced Educational Video Generator Server Started!');
            console.log(`📡 Server running on: http://localhost:${PORT}`);
            console.log(`🎬 Web Interface: http://localhost:${PORT}`);
            console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`🔧 Environment Test: http://localhost:${PORT}/api/test-env`);
            console.log(`📁 Projects API: http://localhost:${PORT}/api/projects`);
            console.log(`💻 Backend ready for optimized video generation requests`);
            console.log(`🆕 NEW: Project Management & Resume Functionality Added!`);
            console.log(`🎨 FIXED: Visual Function Serialization for Frontend Preview!`);
            
            // Check environment variables on startup
            if (!process.env.ANTHROPIC_API_KEY) {
                console.warn('⚠️  ANTHROPIC_API_KEY not found in environment variables');
            } else {
                console.log('✅ ANTHROPIC_API_KEY loaded');
            }
            
            if (!process.env.SMALLEST_API_KEY) {
                console.warn('⚠️  SMALLEST_API_KEY not found in environment variables');
            } else {
                console.log('✅ SMALLEST_API_KEY loaded');
            }
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

// Add this endpoint to your server.js file
// Add this PDF endpoint to your server.js file

// PDF Generation endpoint
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { projectId } = req.body;
        
        if (!projectId) {
            return res.status(400).json({
                success: false,
                error: 'Project ID is required'
            });
        }
        
        console.log(`📄 Generating PDF for project: ${projectId}`);
        
        const projectPath = path.join(__dirname, 'output', 'web_projects', projectId);
        const scriptPath = path.join(projectPath, 'generated_script.js');
        
        if (!existsSync(scriptPath)) {
            return res.status(404).json({
                success: false,
                error: 'Project script not found'
            });
        }
        
        // Load and parse the script
        const scriptContent = await fs.readFile(scriptPath, 'utf8');
        
        const sandbox = {
            module: { exports: {} },
            exports: {},
            require: () => ({}),
            console: { log: () => {} }
        };
        
        const func = new Function('module', 'exports', 'require', 'console', scriptContent);
        func(sandbox.module, sandbox.exports, sandbox.require, sandbox.console);
        
        const result = sandbox.module.exports;
        
        if (!result.LESSON_CONTENT || !result.visualFunctions) {
            return res.status(400).json({
                success: false,
                error: 'Invalid script format'
            });
        }
        
        // Generate PDF HTML content
        const pdfData = {
            projectId: projectId,
            title: result.LESSON_CONTENT.lessonSteps[0]?.title || 'Educational Video Project',
            lessonSteps: result.LESSON_CONTENT.lessonSteps,
            speakers: result.LESSON_CONTENT.speakers,
            visualFunctions: Object.keys(result.visualFunctions),
            generatedAt: new Date().toISOString()
        };
        
        const htmlContent = generatePDFHTML(pdfData);
        
        // Return HTML for browser to print as PDF
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="educational_video_report_${projectId.slice(0, 8)}.html"`);
        res.send(htmlContent);
        
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate PDF'
        });
    }
});

// Helper function to generate PDF HTML content
function generatePDFHTML(pdfData) {
    const currentDate = new Date().toLocaleDateString();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Educational Video Report - ${pdfData.title}</title>
        <meta charset="utf-8">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                color: #333;
                background: white;
            }
            
            .header {
                text-align: center;
                border-bottom: 3px solid #1976d2;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            
            .header h1 {
                color: #1976d2;
                margin-bottom: 10px;
                font-size: 2.2em;
            }
            
            .project-info {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 10px;
                margin-bottom: 30px;
                border-left: 5px solid #1976d2;
            }
            
            .lesson-steps {
                margin-top: 40px;
            }
            
            .step {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 10px;
                margin-bottom: 25px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                page-break-inside: avoid;
            }
            
            .step-header {
                background: linear-gradient(135deg, #1976d2, #42a5f5);
                color: white;
                padding: 20px;
                font-weight: 600;
                font-size: 1.1em;
            }
            
            .step-content {
                padding: 25px;
            }
            
            @media print {
                body { 
                    margin: 0; 
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .step { 
                    page-break-inside: avoid; 
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📚 Educational Video Report</h1>
            <p><strong>${pdfData.title}</strong></p>
            <p>Project ID: ${pdfData.projectId}</p>
            <p>Generated on ${currentDate}</p>
        </div>
        
        <div class="project-info">
            <h2>📊 Project Overview</h2>
            <p><strong>Total Steps:</strong> ${pdfData.lessonSteps.length}</p>
            <p><strong>Speakers:</strong> ${Object.keys(pdfData.speakers || {}).length}</p>
            <p><strong>Visual Functions:</strong> ${pdfData.visualFunctions.length}</p>
        </div>
        
        <div class="lesson-steps">
            <h2>📋 Detailed Lesson Steps</h2>
            ${pdfData.lessonSteps.map((step, index) => `
                <div class="step">
                    <div class="step-header">
                        Step ${index + 1}: ${step.title || 'Untitled Step'}
                    </div>
                    <div class="step-content">
                        <p><strong>Speaker:</strong> ${step.speaker}</p>
                        <p><strong>Duration:</strong> ${step.visualDuration || 4} seconds</p>
                        ${step.content ? `<p><strong>Content:</strong> ${step.content}</p>` : ''}
                        ${step.content2 ? `<p><strong>Additional:</strong> ${step.content2}</p>` : ''}
                        ${step.narration ? `<p><strong>Narration:</strong> ${step.narration}</p>` : ''}
                        ${step.visual ? `<p><strong>Visual:</strong> ${step.visual.type}</p>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </body>
    </html>
    `;
}

app.put('/api/project/:projectId/visual-function', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { functionName, functionCode } = req.body;
        
        const projectPath = path.join(__dirname, 'output', 'web_projects', projectId);
        const scriptPath = path.join(projectPath, 'generated_script.js');
        
        if (!existsSync(scriptPath)) {
            return res.status(404).json({
                success: false,
                error: 'Script file not found'
            });
        }
        
        // Read current script
        let scriptContent = await fs.readFile(scriptPath, 'utf8');
        
        // Simple regex to replace the function
        const functionRegex = new RegExp(
            `function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`,
            'g'
        );
        
        if (functionRegex.test(scriptContent)) {
            // Replace existing function
            scriptContent = scriptContent.replace(functionRegex, functionCode);
        } else {
            // If function not found, add it before module.exports
            const exportIndex = scriptContent.lastIndexOf('module.exports');
            if (exportIndex !== -1) {
                const beforeExport = scriptContent.substring(0, exportIndex);
                const afterExport = scriptContent.substring(exportIndex);
                scriptContent = beforeExport + '\n' + functionCode + '\n\n' + afterExport;
            }
        }
        
        // Save updated script
        await fs.writeFile(scriptPath, scriptContent, 'utf8');
        
        console.log(`✅ Updated visual function '${functionName}' in project ${projectId}`);
        
        res.json({
            success: true,
            message: 'Visual function updated successfully'
        });
        
    } catch (error) {
        console.error('❌ Error updating visual function:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update visual function'
        });
    }
});

// Add this endpoint to your server.js after the existing project routes
// Insert this around line 400-500, after the other project endpoints

// PDF generation data endpoint
app.get('/api/project/:projectId/pdf', async (req, res) => {
    try {
        const { projectId } = req.params;
        const projectPath = path.join(__dirname, 'output', 'web_projects', projectId);
        const scriptPath = path.join(projectPath, 'generated_script.js');
        
        console.log(`📄 PDF data request for project: ${projectId}`);
        
        if (!existsSync(scriptPath)) {
            return res.status(404).json({
                success: false,
                error: 'Script file not found'
            });
        }
        
        // Load and parse script
        const scriptContent = await fs.readFile(scriptPath, 'utf8');
        const sandbox = {
            module: { exports: {} },
            exports: {},
            require: () => ({}),
            console: { log: () => {} }
        };
        
        const func = new Function('module', 'exports', 'require', 'console', scriptContent);
        func(sandbox.module, sandbox.exports, sandbox.require, sandbox.console);
        
        const result = sandbox.module.exports;
        
        if (!result.LESSON_CONTENT) {
            return res.status(400).json({
                success: false,
                error: 'Invalid script format - missing LESSON_CONTENT'
            });
        }
        
        // Get project metadata
        const projectInfo = await analyzeProject(projectId, projectPath);
        
        // Return comprehensive data for PDF generation
        res.json({
            success: true,
            projectId: projectId,
            title: result.LESSON_CONTENT.lessonSteps[0]?.title || projectInfo?.title || 'Educational Script',
            lessonSteps: result.LESSON_CONTENT.lessonSteps,
            speakers: result.LESSON_CONTENT.speakers,
            visualFunctions: Object.keys(result.visualFunctions || {}),
            visualFunctionDetails: result.visualFunctions,
            projectInfo: {
                createdAt: projectInfo?.createdAt || new Date().toISOString(),
                status: projectInfo?.status || 'unknown',
                hasVideo: projectInfo?.hasVideo || false,
                totalDuration: result.LESSON_CONTENT.lessonSteps.reduce(
                    (sum, step) => sum + (step.visualDuration || 4), 0
                )
            },
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                generator: 'Educational Video Generator'
            }
        });
        
    } catch (error) {
        console.error('❌ Error in PDF data endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to prepare PDF data'
        });
    }
});

// PDF download statistics endpoint (optional)
app.post('/api/project/:projectId/pdf-downloaded', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        console.log(`📊 PDF downloaded for project: ${projectId}`);
        
        // You could log this to a database or analytics service
        // For now, just acknowledge the download
        
        res.json({
            success: true,
            message: 'PDF download recorded'
        });
        
    } catch (error) {
        console.error('❌ Error recording PDF download:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record PDF download'
        });
    }
});


// Add this endpoint to your server.js file (around line 600, after other API endpoints)

// AI Visual Editor Endpoint using Claude
app.post('/api/ai-chat/visual-edit', async (req, res) => {
    try {
        const { prompt, slideIndex, projectId } = req.body;
        
        console.log(`🤖 AI Visual Edit Request:`);
        console.log(`   Project: ${projectId}`);
        console.log(`   Slide: ${slideIndex + 1}`);
        console.log(`   Prompt length: ${prompt?.length || 0} characters`);
        
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(400).json({
                success: false,
                error: 'Claude AI API key not configured'
            });
        }

        if (!prompt || prompt.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required'
            });
        }

        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        console.log('🧠 Sending request to Claude AI...');

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        let updatedCode = message.content[0].text.trim();
        
        console.log(`✅ Received response from Claude AI (${updatedCode.length} characters)`);
        
        // Clean up the response - remove any markdown formatting
        if (updatedCode.startsWith('```javascript')) {
            updatedCode = updatedCode.replace(/^```javascript\n/, '').replace(/\n```$/, '');
        } else if (updatedCode.startsWith('```')) {
            updatedCode = updatedCode.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        // Validate that we got a function
        if (!updatedCode.includes('function') && !updatedCode.includes('=>')) {
            console.warn('⚠️ AI response does not appear to be a function');
            return res.status(400).json({
                success: false,
                error: 'AI response does not contain a valid function. Please try rephrasing your request.'
            });
        }

        console.log('✅ AI visual edit completed successfully');
        
        res.json({
            success: true,
            updatedCode: updatedCode,
            message: 'Visual function updated by Claude AI',
            metadata: {
                model: 'claude-sonnet-4',
                promptLength: prompt.length,
                responseLength: updatedCode.length,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Error in AI visual editing:', error);
        
        let errorMessage = 'AI visual editing failed';
        
        if (error.message?.includes('rate_limit')) {
            errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message?.includes('invalid_api_key')) {
            errorMessage = 'API key configuration error. Please contact support.';
        } else if (error.message?.includes('network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
        } else {
            errorMessage = error.message || errorMessage;
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Optional: AI Chat History endpoint
app.get('/api/ai-chat/history/:projectId/:slideIndex', async (req, res) => {
    try {
        const { projectId, slideIndex } = req.params;
        
        // This could store and retrieve chat history from a database
        // For now, return empty history
        res.json({
            success: true,
            history: [],
            message: 'Chat history retrieved'
        });
        
    } catch (error) {
        console.error('❌ Error retrieving chat history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve chat history'
        });
    }
});

// Optional: AI Suggestions endpoint
app.post('/api/ai-chat/suggestions', async (req, res) => {
    try {
        const { slideContent, visualType } = req.body;
        
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(400).json({
                success: false,
                error: 'Claude AI API key not configured'
            });
        }

        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const prompt = `Given this educational content: "${slideContent}", suggest 3 specific improvements for the visual function "${visualType}". Be concise and actionable.`;

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [
                {
                    role: "user", 
                    content: prompt
                }
            ]
        });

        const suggestions = message.content[0].text.trim().split('\n').filter(s => s.trim());
        
        res.json({
            success: true,
            suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
            message: 'AI suggestions generated'
        });
        
    } catch (error) {
        console.error('❌ Error generating AI suggestions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate suggestions'
        });
    }
});

// Add this endpoint to your server.js file
app.post('/api/ai-chat/visual-edit', async (req, res) => {
    try {
        const { prompt, slideIndex, projectId } = req.body;
        
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(400).json({
                success: false,
                error: 'Claude AI API key not configured'
            });
        }

        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [{ role: "user", content: prompt }]
        });

        let updatedCode = message.content[0].text.trim();
        
        // Clean up markdown
        if (updatedCode.startsWith('```javascript')) {
            updatedCode = updatedCode.replace(/^```javascript\n/, '').replace(/\n```$/, '');
        } else if (updatedCode.startsWith('```')) {
            updatedCode = updatedCode.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        res.json({
            success: true,
            updatedCode: updatedCode,
            message: 'Visual function updated by Claude AI'
        });
        
    } catch (error) {
        console.error('❌ Error in AI visual editing:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'AI visual editing failed'
        });
    }
});






startServer();