// enhanced_optimized_video_generator.js - Enhanced standalone optimized video generator with improved path resolution
require('dotenv').config();
const fs = require('fs').promises;
const { existsSync } = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const crypto = require('crypto');
const os = require('os');
// Add after other requires
const { createClient } = require('@supabase/supabase-js');

let createCanvas;
try {
  ({ createCanvas } = require('canvas'));
} catch (err) {
  console.error('⚠️ Error loading canvas module:', err.message);
  console.error('Ensure canvas prerequisites are installed. See: https://www.npmjs.com/package/canvas#compiling');
  process.exit(1);
}

// STATIC CONFIGURATION
const STATIC_CONFIG = {
  FPS: 30,
  APPLY_VOLUME_BOOST: true,
  VOLUME_BOOST_DB: "3dB",
  
  TRANSITION_CONFIG: {
    POST_AUDIO_PAUSE: 1.5,
    MIN_SLIDE_DURATION: 4.0,
    COMPLEX_SLIDE_BONUS: 2.0,
    SPEAKER_CHANGE_PAUSE: 0.3
  },

  LAYOUT: {
    AVATAR: { x: 30, y: 250, spacing: 70, size: 30 },
    TITLE: { x: 500, y: 75, width: 1000 },
    CONTENT: { x: 500, y: 120, width: 800 },
    CONTENT2: { x: 500, y: 145, width: 800 },
    MEDIA: { x: 200, y: 200, width: 600, height: 400, border: 2, borderColor: '#e0e0e0' }
  },

  COLORS: {
    background: '#e9f0f4', primary: '#1a5276', secondary: '#5dade2',
    accent1: '#a9dfbf', accent2: '#f39c12', accent3: '#e74c3c',
    text: '#2c3e50', white: '#ffffff'
  },

  SPEAKER_BACKGROUNDS: {
    teacher: '#f8fafe',
    student1: '#f3e8ff',
    student2: '#fefaf8'
  },

  // Optimization settings
  OPTIMIZATION: {
    MAX_PARALLEL_AUDIO: 3,        // Generate 3 audio files simultaneously
    MAX_PARALLEL_FRAMES: 5,       // Process 5 frame types simultaneously
    ENABLE_FRAME_REUSE: true,     // Reuse identical frames
    CACHE_UNIQUE_FRAMES: true     // Cache unique frame variants
  }
};

class FixedOptimizedVideoGenerator {
  constructor(scriptPath, options = {}) {
    this.scriptPath = scriptPath;
    this.options = { ...options };
    this.config = { ...STATIC_CONFIG, ...options };
    
    this.supabase = options.supabase || null;
    this.userId = options.userId || null;
    this.projectId = options.projectId || null;
    // Frame optimization
    this.frameCache = new Map(); // Hash -> frame file path
    this.uniqueFrames = new Map(); // Step -> unique frame info
    this.cpuCores = os.cpus().length;
    
    // Initialize paths and tokens first
    this.setupPaths();
    this.initializeTokens();
    
    // Initialize data structures
    this.speakers = {};
    this.visualFunctions = {};
    this.lessonSteps = [];
  }

  setupPaths() {
    const scriptDir = path.dirname(path.resolve(this.scriptPath)); // Ensure absolute
    const scriptName = path.basename(this.scriptPath, '.js');
    const videoName = this.options.videoName || scriptName.replace('generated_script', 'video');
    
    this.OUTPUT_DIR = this.options.outputDir || path.join(scriptDir, 'video_output');
    
    // Ensure all paths are absolute
    this.OUTPUT_DIR = path.resolve(this.OUTPUT_DIR);
    this.FRAMES_DIR = path.resolve(this.OUTPUT_DIR, 'frames');
    this.UNIQUE_FRAMES_DIR = path.resolve(this.OUTPUT_DIR, 'unique_frames');
    this.AUDIO_DIR = path.resolve(this.OUTPUT_DIR, 'audio');
    this.TEMP_AUDIO_BOOSTED_DIR = path.resolve(this.AUDIO_DIR, 'boosted');
    this.TEMP_VIDEO = path.resolve(this.OUTPUT_DIR, 'temp-video_silent.mp4');
    this.FINAL_VIDEO = path.resolve(this.OUTPUT_DIR, `${videoName}.mp4`);
    
    console.log(`📁 Resolved paths:`);
    console.log(`   Script: ${path.resolve(this.scriptPath)}`);
    console.log(`   Output: ${this.OUTPUT_DIR}`);
    console.log(`📁 Video will be saved as: ${this.FINAL_VIDEO}`);
  }

  initializeTokens() {
    try {
      if (process.env.SMALLEST_API_KEY) {
        this.smallestAiToken = process.env.SMALLEST_API_KEY;
        console.log('✅ Smallest.ai token initialized');
      } else {
        console.warn('⚠️ SMALLEST_API_KEY not found. Audio generation will be skipped.');
        this.smallestAiToken = null;
      }
    } catch (err) {
      console.error('❌ Error initializing API tokens:', err.message);
    }
  }

  async loadContentFromScript() {
    try {
      console.log('📄 Loading content from JavaScript script...');
      
      if (!existsSync(this.scriptPath)) {
        throw new Error(`Script file not found: ${this.scriptPath}`);
      }
      
      const jsContent = await fs.readFile(this.scriptPath, 'utf8');
      
      const sandbox = {
        module: { exports: {} },
        exports: {},
        require: () => ({}),
        console: { log: () => {} }
      };
      
      const func = new Function('module', 'exports', 'require', 'console', jsContent);
      func(sandbox.module, sandbox.exports, sandbox.require, sandbox.console);
      
      const result = sandbox.module.exports;
      
      if (!result.LESSON_CONTENT || !result.visualFunctions) {
        throw new Error('Invalid script format - missing LESSON_CONTENT or visualFunctions');
      }
      
      this.speakers = result.LESSON_CONTENT.speakers;
      this.visualFunctions = result.visualFunctions;
      
      this.lessonSteps = result.LESSON_CONTENT.lessonSteps.map(step => ({
        ...step,
        actualAudioDuration: 0,
        effectiveDuration: step.visualDuration || 4.0,
        audioDelay: 0,
        audioPath: null,
        boostedAudioPath: null
      }));

      console.log(`✅ Loaded ${this.lessonSteps.length} lesson steps`);
      console.log(`🎨 Visual functions: ${Object.keys(this.visualFunctions).join(', ')}`);
      console.log(`💻 System: ${this.cpuCores} CPU cores detected`);
      
    } catch (error) {
      console.error('❌ Error loading script content:', error.message);
      throw error;
    }
  }

  // Frame analysis and optimization
  generateFrameHash(step) {
    const frameContent = {
      speaker: step.speaker,
      title: step.title,
      content: step.content || '',
      content2: step.content2 || '',
      visual: step.visual || null,
      equation: step.equation || null
    };
    
    const contentString = JSON.stringify(frameContent);
    return crypto.createHash('md5').update(contentString).digest('hex');
  }

  analyzeFrameUniqueness() {
    console.log('🔍 Analyzing frame uniqueness...');
    
    // Safety check
    if (!this.lessonSteps || !Array.isArray(this.lessonSteps)) {
      throw new Error('lessonSteps not properly initialized');
    }
    
    const hashToSteps = new Map();
    
    this.lessonSteps.forEach((step, index) => {
      const hash = this.generateFrameHash(step);
      
      if (!hashToSteps.has(hash)) {
        hashToSteps.set(hash, []);
      }
      hashToSteps.get(hash).push(index);
      
      this.uniqueFrames.set(index, {
        hash,
        isUnique: true,
        masterIndex: index
      });
    });
    
    let uniqueCount = 0;
    let duplicateCount = 0;
    
    hashToSteps.forEach((stepIndices, hash) => {
      if (stepIndices.length > 1) {
        const masterIndex = stepIndices[0];
        
        stepIndices.forEach((stepIndex, i) => {
          this.uniqueFrames.set(stepIndex, {
            hash,
            isUnique: i === 0,
            masterIndex
          });
          
          if (i === 0) {
            uniqueCount++;
          } else {
            duplicateCount++;
          }
        });
      } else {
        uniqueCount++;
      }
    });
    
    console.log(`📊 Frame analysis complete:`);
    console.log(`   Unique frames: ${uniqueCount}`);
    console.log(`   Duplicate frames: ${duplicateCount}`);
    console.log(`   Total frames needed: ${this.lessonSteps.length}`);
    console.log(`   🚀 Optimization: ${duplicateCount > 0 ? `${duplicateCount} frames will be reused!` : 'No duplicates found'}`);
    
    return { uniqueCount, duplicateCount };
  }

  // Parallel audio generation
  async generateAllAudioParallel() {
    if (!this.smallestAiToken) {
      console.log('🔇 Skipping audio generation (no API token)');
      return;
    }

    console.log('🎤 Generating audio files in parallel...');
    
    const maxParallel = this.config.OPTIMIZATION.MAX_PARALLEL_AUDIO;
    
    for (let i = 0; i < this.lessonSteps.length; i += maxParallel) {
      const batch = this.lessonSteps.slice(i, i + maxParallel);
      const batchPromises = batch.map((step, batchIndex) => 
        this.generateSingleAudio(i + batchIndex, step)
      );
      
      console.log(`   Batch ${Math.floor(i / maxParallel) + 1}: Processing steps ${i + 1}-${Math.min(i + maxParallel, this.lessonSteps.length)}`);
      await Promise.all(batchPromises);
    }
    
    console.log('✅ All audio generation complete');
  }

  // Optimized unique frame generation
  async generateUniqueFrames() {
    console.log('🖼️ Generating unique frames...');
    
    // First analyze frame uniqueness
    const { uniqueCount } = this.analyzeFrameUniqueness();
    const uniqueSteps = [];
    
    this.lessonSteps.forEach((step, index) => {
      const frameInfo = this.uniqueFrames.get(index);
      if (frameInfo.isUnique) {
        uniqueSteps.push({ step, index, hash: frameInfo.hash });
      }
    });
    
    console.log(`   Generating ${uniqueCount} unique frames with I/O optimization...`);
    
    const maxParallel = this.config.OPTIMIZATION.MAX_PARALLEL_FRAMES;
    
    for (let i = 0; i < uniqueSteps.length; i += maxParallel) {
      const batch = uniqueSteps.slice(i, i + maxParallel);
      const batchPromises = batch.map(({ step, index, hash }) => 
        this.generateUniqueFrame(step, index, hash)
      );
      
      console.log(`   Batch ${Math.floor(i / maxParallel) + 1}: Generating frames ${i + 1}-${Math.min(i + maxParallel, uniqueSteps.length)}`);
      await Promise.all(batchPromises);
    }
    
    console.log('✅ All unique frames generated');
  }

  async generateUniqueFrame(step, stepIndex, hash) {
    try {
      const canvas = createCanvas(1000, 700);
      const ctx = canvas.getContext('2d');
      
      // Draw frame content
      this.drawBackground(ctx, step.speaker);
      this.drawAvatars(ctx, step.speaker);
      this.drawTextContent(ctx, step);
      
      if (step.visual && step.visual.type) {
        this.callVisualFunction(ctx, step.visual.type, ...(step.visual.params || []));
      }
      
      if (step.equation) {
        const equationX = this.config.LAYOUT.MEDIA.x + this.config.LAYOUT.MEDIA.width / 2;
        const equationY = this.config.LAYOUT.MEDIA.y + this.config.LAYOUT.MEDIA.height / 2;
        this.drawChemicalEquation(ctx, step.equation, equationX, equationY);
      }
      
      const framePath = path.join(this.UNIQUE_FRAMES_DIR, `unique_${hash}.png`);
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(framePath, buffer);
      
      this.frameCache.set(hash, framePath);
      
      console.log(`   ✅ Generated unique frame for step ${stepIndex + 1}: ${step.title}`);
      
    } catch (error) {
      console.error(`   ❌ Error generating frame for step ${stepIndex + 1}:`, error.message);
    }
  }

  // Create frame sequence by copying unique frames
  async createFrameSequence() {
    console.log('🔄 Creating frame sequence with optimized reuse...');
    
    let globalFrameIndex = 0;
    let copiedFrames = 0;
    let reusedFrames = 0;
    
    for (let i = 0; i < this.lessonSteps.length; i++) {
      const step = this.lessonSteps[i];
      const frameInfo = this.uniqueFrames.get(i);
      const framesForThisStep = Math.round(step.effectiveDuration * this.config.FPS);
      
      const sourceFramePath = this.frameCache.get(frameInfo.hash);
      
      if (!sourceFramePath || !existsSync(sourceFramePath)) {
        console.error(`❌ Source frame not found for step ${i + 1}`);
        continue;
      }
      
      console.log(`   Step ${i + 1}: Creating ${framesForThisStep} frames ${frameInfo.isUnique ? '(unique)' : '(reused)'}`);
      
      for (let j = 0; j < framesForThisStep; j++) {
        const paddedIndex = String(globalFrameIndex).padStart(6, '0');
        const targetFramePath = path.join(this.FRAMES_DIR, `frame_${paddedIndex}.png`);
        
        try {
          await fs.copyFile(sourceFramePath, targetFramePath);
          
          if (frameInfo.isUnique && j === 0) {
            copiedFrames++;
          } else {
            reusedFrames++;
          }
        } catch (error) {
          console.error(`❌ Error copying frame ${globalFrameIndex}:`, error.message);
        }
        
        globalFrameIndex++;
      }
    }
    
    console.log(`✅ Frame sequence created:`);
    console.log(`   Total frames: ${globalFrameIndex}`);
    console.log(`   Unique frames generated: ${copiedFrames}`);
    console.log(`   Frames reused: ${reusedFrames}`);
    console.log(`   🚀 Performance boost: ${reusedFrames > 0 ? `${reusedFrames} frames saved!` : 'No optimization possible'}`);
  }

  // Drawing methods (same as before)
  drawBackground(ctx, speaker) {
    const backgroundColor = this.config.SPEAKER_BACKGROUNDS[speaker] || this.config.COLORS.background;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 1000, 700);
  }

  drawAvatars(ctx, activeSpeaker) {
    const speakerKeys = Object.keys(this.speakers);
    
    speakerKeys.forEach((speaker, index) => {
      const config = this.speakers[speaker];
      const isActive = speaker === activeSpeaker;
      const x = this.config.LAYOUT.AVATAR.x + this.config.LAYOUT.AVATAR.size / 2;
      const y = this.config.LAYOUT.AVATAR.y + (index * this.config.LAYOUT.AVATAR.spacing) + this.config.LAYOUT.AVATAR.size / 2;
      
      this.drawSingleAvatar(ctx, x, y, config, isActive);
    });
  }

  drawSingleAvatar(ctx, x, y, config, isActive) {
    ctx.save();
    
    const radius = this.config.LAYOUT.AVATAR.size / 2;
    
    if (isActive) {
      ctx.shadowColor = config.color;
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#fdbcb4' : this.lightenColor('#fdbcb4', 0.4);
    ctx.fill();
    
    ctx.lineWidth = isActive ? 3 : 1.5;
    ctx.strokeStyle = isActive ? config.color : this.lightenColor(config.color, 0.3);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    this.drawAvatarFace(ctx, x, y, radius * 0.8, isActive);
    
    ctx.fillStyle = isActive ? this.config.COLORS.text : this.lightenColor(this.config.COLORS.text, 0.4);
    ctx.font = `${isActive ? 'bold ' : ''}12px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(config.name, x, y + radius + 16);
    
    ctx.restore();
  }

  drawAvatarFace(ctx, centerX, centerY, faceRadius, isActive) {
    ctx.save();
    
    const eyeColor = isActive ? '#2c3e50' : this.lightenColor('#2c3e50', 0.5);
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(centerX - faceRadius * 0.3, centerY - faceRadius * 0.2, faceRadius * 0.06, 0, Math.PI * 2);
    ctx.arc(centerX + faceRadius * 0.3, centerY - faceRadius * 0.2, faceRadius * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY + faceRadius * 0.1, faceRadius * 0.3, 0, Math.PI);
    ctx.stroke();
    
    ctx.restore();
  }

  lightenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  drawTextContent(ctx, step) {
    // Title
    ctx.fillStyle = this.config.COLORS.primary;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(step.title, this.config.LAYOUT.TITLE.x, this.config.LAYOUT.TITLE.y);
    
    // Content
    ctx.fillStyle = this.config.COLORS.text;
    if (step.content) {
      ctx.font = '22px Arial';
      this.wrapText(ctx, step.content, this.config.LAYOUT.CONTENT.x, this.config.LAYOUT.CONTENT.y, this.config.LAYOUT.CONTENT.width, 30);
    }
    if (step.content2) {
      ctx.font = '22px Arial';
      this.wrapText(ctx, step.content2, this.config.LAYOUT.CONTENT2.x, this.config.LAYOUT.CONTENT2.y + (step.content ? 30 : 0), this.config.LAYOUT.CONTENT2.width, 26);
    }

    // Draw media area border
    ctx.strokeStyle = this.config.LAYOUT.MEDIA.borderColor;
    ctx.lineWidth = this.config.LAYOUT.MEDIA.border;
    ctx.strokeRect(
      this.config.LAYOUT.MEDIA.x, 
      this.config.LAYOUT.MEDIA.y, 
      this.config.LAYOUT.MEDIA.width, 
      this.config.LAYOUT.MEDIA.height
    );
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    ctx.textAlign = 'center';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  callVisualFunction(ctx, functionName, ...args) {
    if (this.visualFunctions[functionName] && typeof this.visualFunctions[functionName] === 'function') {
      try {
        this.visualFunctions[functionName](ctx, ...args);
      } catch (error) {
        console.error(`❌ Error executing visual function '${functionName}':`, error.message);
        
        ctx.save();
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Error in ${functionName}()`, this.config.LAYOUT.MEDIA.x + this.config.LAYOUT.MEDIA.width / 2, this.config.LAYOUT.MEDIA.y + this.config.LAYOUT.MEDIA.height / 2);
        ctx.restore();
      }
    } else {
      console.warn(`⚠️ Visual function '${functionName}' not found. Available functions: ${Object.keys(this.visualFunctions).join(', ')}`);
      
      ctx.save();
      ctx.fillStyle = '#f39c12';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Missing visual: ${functionName}`, this.config.LAYOUT.MEDIA.x + this.config.LAYOUT.MEDIA.width / 2, this.config.LAYOUT.MEDIA.y + this.config.LAYOUT.MEDIA.height / 2);
      ctx.restore();
    }
  }

  drawChemicalEquation(ctx, equation, x, y, fontSize = 24) {
    ctx.save();
    ctx.fillStyle = this.config.COLORS.text;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(equation, x, y);
    ctx.restore();
  }

  // Audio generation methods
  async generateAudioWithSmallestAi(text, voiceConfig) {
    if (!this.smallestAiToken) {
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
        'Authorization': `Bearer ${this.smallestAiToken}`,
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
  // Add this method to FixedOptimizedVideoGenerator class in optimized_video_generator.js
  async downloadExistingAudio(projectData) {
    if (!this.supabase || !projectData.audioFiles || projectData.audioFiles.length === 0) {
      return;
    }

    console.log('🎵 Downloading existing audio files from storage...');
    
    for (const audioFile of projectData.audioFiles) {
      try {
        // Find corresponding lesson step
        const lessonStep = projectData.lessonSteps.find(step => step.id === audioFile.lesson_step_id);
        if (!lessonStep) continue;
        
        // Download audio file from storage
        const { data: audioBlob, error } = await this.supabase.storage
          .from(audioFile.bucket_name)
          .download(audioFile.storage_path);
        
        if (error) throw error;
        
        // Save to local file system
        const localAudioPath = path.join(this.AUDIO_DIR, `step_${lessonStep.step_order.toString().padStart(3, '0')}_${lessonStep.speaker}.wav`);
        const arrayBuffer = await audioBlob.arrayBuffer();
        await fs.writeFile(localAudioPath, Buffer.from(arrayBuffer));
        
        // Update lesson step with audio info
        const stepIndex = lessonStep.step_order - 1;
        if (this.lessonSteps[stepIndex]) {
          this.lessonSteps[stepIndex].audioPath = localAudioPath;
          this.lessonSteps[stepIndex].actualAudioDuration = audioFile.duration || 0;
        }
        
        console.log(`   ✅ Downloaded audio for step ${lessonStep.step_order}`);
        
      } catch (error) {
        console.error(`   ❌ Failed to download audio for step:`, error.message);
      }
    }
  }

  calculateEffectiveDuration(step, previousStep = null) {
    let duration = Math.max(step.visualDuration, step.actualAudioDuration || 0);
    duration = Math.max(duration, this.config.TRANSITION_CONFIG.MIN_SLIDE_DURATION);
    
    if (step.actualAudioDuration > 0) {
      duration = Math.max(duration, step.actualAudioDuration + this.config.TRANSITION_CONFIG.POST_AUDIO_PAUSE);
    }
    
    if (step.isComplex) {
      duration += this.config.TRANSITION_CONFIG.COMPLEX_SLIDE_BONUS;
    }
    
    if (previousStep && previousStep.speaker !== step.speaker) {
      duration += this.config.TRANSITION_CONFIG.SPEAKER_CHANGE_PAUSE;
    }
    
    return duration;
  }

  async setupDirectories() {
    try {
      await fs.mkdir(this.OUTPUT_DIR, { recursive: true });
      await fs.mkdir(this.FRAMES_DIR, { recursive: true });
      await fs.mkdir(this.UNIQUE_FRAMES_DIR, { recursive: true });
      if (this.smallestAiToken) {
        await fs.mkdir(this.AUDIO_DIR, { recursive: true });
        if (this.config.APPLY_VOLUME_BOOST) {
          await fs.mkdir(this.TEMP_AUDIO_BOOSTED_DIR, { recursive: true });
        }
      }
      console.log('✅ Created output directories successfully');
    } catch (err) {
      console.error('❌ Error creating directories:', err);
      throw err;
    }
  }

  async getAudioDuration(audioFilePath) {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn(ffprobePath, [
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

  async boostAudioVolume(inputPath, outputPath, volumeBoost) {
    return new Promise((resolve, reject) => {
      const ffmpegProc = spawn(ffmpegPath, [
        '-i', inputPath,
        '-filter:a', `volume=${volumeBoost}`,
        '-y', outputPath
      ]);
      let ffmpegOutput = '';
      ffmpegProc.stderr.on('data', (data) => { ffmpegOutput += data.toString(); });
      ffmpegProc.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          console.error(`❌ FFmpeg volume boost failed for ${inputPath} (code ${code}): ${ffmpegOutput.substring(0, 500)}`);
          resolve(inputPath);
        }
      });
      ffmpegProc.on('error', (err) => {
        console.error(`❌ Failed to start FFmpeg for volume boost (${inputPath}):`, err);
        resolve(inputPath);
      });
    });
  }

  async generateSingleAudio(stepIndex, step) {
    if (!this.smallestAiToken) {
      return;
    }

    const stepLabel = `Step ${stepIndex + 1}`;
    
    try {
      const speaker = step.speaker;
      const voiceConfig = this.speakers[speaker];
      
      if (!voiceConfig) {
        throw new Error(`No voice configuration found for speaker: ${speaker}`);
      }

      const audioFileName = `step_${String(stepIndex + 1).padStart(3, '0')}_${speaker}.wav`;
      const audioPath = path.join(this.AUDIO_DIR, audioFileName);
      
      let finalAudioPath = audioPath;
      
      if (!existsSync(audioPath)) {
        const audioBuffer = await this.generateAudioWithSmallestAi(step.narration, voiceConfig);
        await fs.writeFile(audioPath, audioBuffer);
      }
      
      if (this.config.APPLY_VOLUME_BOOST) {
        const boostedFileName = audioFileName.replace('.wav', '_boosted.wav');
        const boostedPath = path.join(this.TEMP_AUDIO_BOOSTED_DIR, boostedFileName);
        
        if (!existsSync(boostedPath)) {
          finalAudioPath = await this.boostAudioVolume(audioPath, boostedPath, this.config.VOLUME_BOOST_DB);
        } else {
          finalAudioPath = boostedPath;
        }
        
        step.boostedAudioPath = finalAudioPath;
      }
      
      const duration = await this.getAudioDuration(finalAudioPath);
      step.actualAudioDuration = duration;
      step.audioPath = finalAudioPath;
      // Add this block after step.audioPath = finalAudioPath; (around line 445)
      if (this.supabase && this.userId && this.projectId) {
        try {
          // Upload to Supabase storage
          const audioFileName = `${this.projectId}_step_${stepIndex + 1}_${Date.now()}.wav`;
          const fileBuffer = await fs.readFile(finalAudioPath);
          const storagePath = `${this.userId}/${audioFileName}`;
          
          const { data: uploadData, error: uploadError } = await this.supabase.storage
            .from('audio-files')
            .upload(storagePath, fileBuffer, {
              upsert: true,
              contentType: 'audio/wav'
            });
          
          if (uploadError) throw uploadError;
          
          // Find the lesson step ID from database
          const { data: lessonStep, error: stepError } = await this.supabase
            .from('lesson_steps')
            .select('id')
            .eq('project_id', this.projectId)
            .eq('step_order', stepIndex + 1)
            .single();
          
          if (!stepError && lessonStep) {
            // Save audio file record to database
            const { error: dbError } = await this.supabase
              .from('audio_files')
              .insert([{
                lesson_step_id: lessonStep.id,
                storage_path: uploadData.path,
                bucket_name: 'audio-files',
                duration: duration
              }]);
            
            if (dbError) throw dbError;
            console.log(`   📤 Audio uploaded to storage: ${uploadData.path}`);
          }
        } catch (storageError) {
          console.error(`   ⚠️ Failed to upload audio to storage:`, storageError.message);
          // Don't fail the entire process, just continue without storage
        }
      }
      
    } catch (error) {
      console.error(`   ❌ ${stepLabel}: Audio generation failed:`, error.message);
      step.actualAudioDuration = 0;
      step.audioPath = null;
      step.boostedAudioPath = null;
    }
  }

  async createVideoFromFramesWithDuration(targetDuration) {
    return new Promise((resolve, reject) => {
      console.log(`🎬 Creating silent video with target duration: ${targetDuration.toFixed(2)}s`);
      
      const ffmpegArgs = [
        '-framerate', this.config.FPS.toString(),
        '-i', path.join(this.FRAMES_DIR, 'frame_%06d.png'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-t', targetDuration.toString(),
        '-y', this.TEMP_VIDEO
      ];
      
      const ffmpegProc = spawn(ffmpegPath, ffmpegArgs);
      
      let ffmpegOutput = '';
      ffmpegProc.stderr.on('data', (data) => {
        ffmpegOutput += data.toString();
      });
      
      ffmpegProc.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Silent video created: ${this.TEMP_VIDEO}`);
          resolve(this.TEMP_VIDEO);
        } else {
          console.error(`❌ FFmpeg failed (code ${code}): ${ffmpegOutput.substring(0, 500)}`);
          reject(new Error('Video creation failed'));
        }
      });
      
      ffmpegProc.on('error', (err) => {
        console.error(`❌ Failed to start FFmpeg:`, err);
        reject(err);
      });
    });
  }

  async combineVideoWithTimedAudio(videoPath, lessonSteps, outputPath) {
    const stepsWithAudio = lessonSteps.filter(step => step.audioPath && step.actualAudioDuration > 0);
    
    if (stepsWithAudio.length === 0) {
      console.log('🔇 No audio tracks found, keeping silent video');
      await fs.copyFile(videoPath, outputPath);
      return outputPath;
    }

    return new Promise((resolve, reject) => {
      console.log(`🎵 Combining video with ${stepsWithAudio.length} audio tracks...`);
      
      const audioInputs = [];
      const filterChain = [];
      let inputIndex = 1;
      
      stepsWithAudio.forEach((step, i) => {
        audioInputs.push('-i', step.audioPath);
        
        const delayFilter = `[${inputIndex}:a]volume=3.0,adelay=${Math.floor(step.audioDelay * 1000)}|${Math.floor(step.audioDelay * 1000)}[a${i}]`;
        filterChain.push(delayFilter);
        inputIndex++;
      });
      
      const audioTracks = stepsWithAudio.map((step, i) => `[a${i}]`);
      const mixFilter = `${audioTracks.join('')}amix=inputs=${audioTracks.length}:duration=longest[audioout]`;
      filterChain.push(mixFilter);
      
      const ffmpegArgs = [
        '-i', videoPath,
        ...audioInputs,
        '-filter_complex', filterChain.join(';'),
        '-map', '0:v',
        '-map', '[audioout]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        '-y', outputPath
      ];
      
      const ffmpegProc = spawn(ffmpegPath, ffmpegArgs);
      
      let ffmpegOutput = '';
      ffmpegProc.stderr.on('data', (data) => {
        ffmpegOutput += data.toString();
      });
      
      ffmpegProc.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Final video created: ${outputPath}`);
          resolve(outputPath);
        } else {
          console.error(`❌ Final video composition failed (code ${code}): ${ffmpegOutput.substring(0, 500)}`);
          reject(new Error('Video composition failed'));
        }
      });
      
      ffmpegProc.on('error', (err) => {
        console.error(`❌ Failed to start FFmpeg for composition:`, err);
        reject(err);
      });
    });
  }

  // Debug method for testing path resolution
  getPathInfo() {
    return {
      scriptPath: path.resolve(this.scriptPath),
      outputDir: this.OUTPUT_DIR,
      framesDir: this.FRAMES_DIR,
      uniqueFramesDir: this.UNIQUE_FRAMES_DIR,
      audioDir: this.AUDIO_DIR,
      tempAudioBoostedDir: this.TEMP_AUDIO_BOOSTED_DIR,
      tempVideo: this.TEMP_VIDEO,
      finalVideo: this.FINAL_VIDEO,
      existence: {
        scriptExists: existsSync(this.scriptPath),
        outputDirExists: existsSync(this.OUTPUT_DIR),
        framesDirExists: existsSync(this.FRAMES_DIR),
        uniqueFramesDirExists: existsSync(this.UNIQUE_FRAMES_DIR),
        audioDirExists: existsSync(this.AUDIO_DIR)
      }
    };
  }

  // MAIN OPTIMIZED GENERATION METHOD
  async generate() {
    try {
      const startTime = Date.now();
      
      // IMPORTANT: Load content first before any other operations
      await this.loadContentFromScript();
      
      await this.setupDirectories();
      console.log(`🚀 Starting OPTIMIZED video generation...`);
      console.log(`💻 System: ${this.cpuCores} CPU cores`);
      console.log(`📁 Output directory: ${this.OUTPUT_DIR}`);

      // PARALLEL PROCESSING: Start audio generation and frame analysis simultaneously
      console.log('\n⚡ Phase 1: Parallel processing...');
      
      const audioPromise = this.generateAllAudioParallel();
      const frameAnalysisPromise = this.generateUniqueFrames();
      
      // Wait for both to complete
      await Promise.all([audioPromise, frameAnalysisPromise]);

      // Calculate durations
      console.log('\n⏱️ Phase 2: Calculating effective durations...');
      const INITIAL_BUFFER = 1.0;
      let accumulatedDuration = INITIAL_BUFFER;
      
      this.lessonSteps.forEach((step, i) => {
        const previousStep = i > 0 ? this.lessonSteps[i - 1] : null;
        step.effectiveDuration = this.calculateEffectiveDuration(step, previousStep);
        step.audioDelay = accumulatedDuration;
        accumulatedDuration += step.effectiveDuration;
        
        console.log(`   Step ${i+1}: ${step.effectiveDuration.toFixed(2)}s, Audio starts at ${step.audioDelay.toFixed(2)}s`);
      });

      const targetVideoDuration = accumulatedDuration + 1.0;

      // OPTIMIZED: Create frame sequence by reusing unique frames
      console.log('\n🎬 Phase 3: Creating optimized frame sequence...');
      await this.createFrameSequence();

      // Create final video
      console.log('\n🎥 Phase 4: Assembling final video...');
      const silentVideoPath = await this.createVideoFromFramesWithDuration(targetVideoDuration);
      await this.combineVideoWithTimedAudio(silentVideoPath, this.lessonSteps, this.FINAL_VIDEO);
      
      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;
      
      console.log(`\n🎉 OPTIMIZED video creation complete!`);
      console.log(`🎬 Output: ${this.FINAL_VIDEO}`);
      console.log(`⏱️ Video duration: ${targetVideoDuration.toFixed(2)}s`);
      console.log(`⚡ Processing time: ${processingTime.toFixed(2)}s`);
      console.log(`🚀 Speed ratio: ${(targetVideoDuration / processingTime).toFixed(1)}x faster than real-time!`);
      
      // Performance summary
      const { uniqueCount, duplicateCount } = this.analyzeFrameUniqueness();
      console.log(`\n📊 Optimization Summary:`);
      console.log(`   CPU cores: ${this.cpuCores}`);
      console.log(`   Unique frames generated: ${uniqueCount}`);
      console.log(`   Frames reused: ${duplicateCount}`);
      console.log(`   Total video frames: ${this.lessonSteps.reduce((sum, step) => sum + Math.round(step.effectiveDuration * this.config.FPS), 0)}`);
      console.log(`   Time saved: ${duplicateCount > 0 ? 'Significant frame generation time saved!' : 'No duplicate frames found'}`);
      
      return this.FINAL_VIDEO;
      
    } catch (error) {
      console.error('❌ Error in optimized video generation:', error.message || error);
      throw error;
    }
  }
}

// Command line usage
async function main() {
  try {
    const scriptPath = process.argv[2];
    const videoName = process.argv[3];
    
    if (!scriptPath) {
      console.log(`
🚀 Enhanced Optimized Video Generator

PERFORMANCE OPTIMIZATIONS:
• Smart frame reuse (identical frames generated only once)
• Parallel audio generation (3 simultaneous API calls)
• Parallel frame processing (I/O optimization)
• Optimized file operations
• Enhanced path resolution for better compatibility
• Fixed initialization order bug

Usage:
  node enhanced_optimized_video_generator.js <script_path> [video_name]

Examples:
  node enhanced_optimized_video_generator.js output/chemistry/acids_bases/generated_script.js
  node enhanced_optimized_video_generator.js output/chemistry/acids_bases/generated_script.js "fast_video"

Expected performance: 5-10x faster than sequential generation!

System Info:
  CPU cores detected: ${os.cpus().length}
  Processing mode: I/O optimized parallel processing
      `);
      return;
    }
    
    console.log(`🚀 Starting OPTIMIZED video generation from: ${scriptPath}`);
    
    const generator = new FixedOptimizedVideoGenerator(scriptPath, { videoName });
    const videoPath = await generator.generate();
    
    console.log(`\n📊 Generation Complete!`);
    console.log(`📹 Video saved: ${videoPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = FixedOptimizedVideoGenerator;

// Run if called directly
if (require.main === module) {
  main();
}