// direct_script_video_generator.js - Generate video directly from JavaScript script
require('dotenv').config();
const fs = require('fs').promises;
const { existsSync } = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

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
    MEDIA: { x: 200, y: 200, width: 600, height: 400, border: 2, borderColor: '#e0e0e0' },
    AVATAR_NAMES: { x: 30, y: 45 }
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
  }
};

class DirectScriptVideoGenerator {
  constructor(scriptPath, options = {}) {
    this.scriptPath = scriptPath;
    this.options = { ...options };
    this.config = { ...STATIC_CONFIG, ...options };
    
    // Initialize paths
    this.setupPaths();
    
    // Initialize API tokens
    this.initializeTokens();
    
    // Load and process content from script
    this.loadContentFromScript();
  }

  setupPaths() {
    const scriptDir = path.dirname(this.scriptPath);
    const scriptName = path.basename(this.scriptPath, '.js');
    const videoName = this.options.videoName || scriptName.replace('generated_script', 'video');
    
    this.OUTPUT_DIR = this.options.outputDir || path.join(scriptDir, 'video_output');
    this.FRAMES_DIR = path.join(this.OUTPUT_DIR, 'frames');
    this.AUDIO_DIR = path.join(this.OUTPUT_DIR, 'audio');
    this.TEMP_AUDIO_BOOSTED_DIR = path.join(this.AUDIO_DIR, 'boosted');
    this.TEMP_VIDEO = path.join(this.OUTPUT_DIR, 'temp-video_silent.mp4');
    this.FINAL_VIDEO = path.join(this.OUTPUT_DIR, `${videoName}.mp4`);
    
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
      
      // Read the JavaScript content
      const jsContent = await fs.readFile(this.scriptPath, 'utf8');
      
      // Create a sandbox to evaluate the JavaScript content safely
      const sandbox = {
        module: { exports: {} },
        exports: {},
        require: () => ({}),
        console: { log: () => {} }
      };
      
      // Evaluate the JavaScript content in the sandbox
      const func = new Function('module', 'exports', 'require', 'console', jsContent);
      func(sandbox.module, sandbox.exports, sandbox.require, sandbox.console);
      
      const result = sandbox.module.exports;
      
      if (!result.LESSON_CONTENT || !result.visualFunctions) {
        throw new Error('Invalid script format - missing LESSON_CONTENT or visualFunctions');
      }
      
      // Process the content
      this.speakers = result.LESSON_CONTENT.speakers;
      this.visualFunctions = result.visualFunctions; // These are already functions!
      
      // Process lesson steps
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
      console.log(`👥 Speakers: ${Object.keys(this.speakers).join(', ')}`);
      
    } catch (error) {
      console.error('❌ Error loading script content:', error.message);
      throw error;
    }
  }

  // Audio generation methods (same as before)
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
      console.log(`⏭️ Step ${stepIndex + 1}: Skipping audio generation (no API token)`);
      return;
    }

    const stepLabel = `Step ${stepIndex + 1}`;
    console.log(`🎤 ${stepLabel}: Generating audio for "${step.title}"`);
    
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
        console.log(`   🔄 Generating new audio for: ${step.narration.substring(0, 50)}...`);
        
        const audioBuffer = await this.generateAudioWithSmallestAi(step.narration, voiceConfig);
        await fs.writeFile(audioPath, audioBuffer);
        console.log(`   💾 Saved audio: ${audioPath}`);
      } else {
        console.log(`   ♻️ Using existing audio: ${audioPath}`);
      }
      
      if (this.config.APPLY_VOLUME_BOOST) {
        const boostedFileName = audioFileName.replace('.wav', '_boosted.wav');
        const boostedPath = path.join(this.TEMP_AUDIO_BOOSTED_DIR, boostedFileName);
        
        if (!existsSync(boostedPath)) {
          finalAudioPath = await this.boostAudioVolume(audioPath, boostedPath, this.config.VOLUME_BOOST_DB);
          console.log(`   🔊 Applied volume boost: ${finalAudioPath}`);
        } else {
          finalAudioPath = boostedPath;
        }
        
        step.boostedAudioPath = finalAudioPath;
      }
      
      const duration = await this.getAudioDuration(finalAudioPath);
      step.actualAudioDuration = duration;
      step.audioPath = finalAudioPath;
      
      console.log(`   ✅ ${stepLabel}: Audio duration: ${duration.toFixed(2)}s`);
      
    } catch (error) {
      console.error(`   ❌ ${stepLabel}: Audio generation failed:`, error.message);
      step.actualAudioDuration = 0;
      step.audioPath = null;
      step.boostedAudioPath = null;
    }
  }

  // Drawing methods (same as your visual_preview_tool.js)
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
        console.log(`🎨 Calling visual function: ${functionName}(${args.join(', ')})`);
        this.visualFunctions[functionName](ctx, ...args);
      } catch (error) {
        console.error(`❌ Error executing visual function '${functionName}':`, error.message);
        
        // Draw error placeholder
        ctx.save();
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Error in ${functionName}()`, this.config.LAYOUT.MEDIA.x + this.config.LAYOUT.MEDIA.width / 2, this.config.LAYOUT.MEDIA.y + this.config.LAYOUT.MEDIA.height / 2);
        ctx.restore();
      }
    } else {
      console.warn(`⚠️ Visual function '${functionName}' not found. Available functions: ${Object.keys(this.visualFunctions).join(', ')}`);
      
      // Draw placeholder for missing function
      ctx.save();
      ctx.fillStyle = '#f39c12';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Missing visual: ${functionName}`, this.config.LAYOUT.MEDIA.x + this.config.LAYOUT.MEDIA.width / 2, this.config.LAYOUT.MEDIA.y + this.config.LAYOUT.MEDIA.height / 2);
      ctx.restore();
    }
  }

  async generateFrame(frameGlobalIndex, stepData) {
    const canvas = createCanvas(1000, 700);
    const ctx = canvas.getContext('2d');
    
    // Background
    this.drawBackground(ctx, stepData.speaker);
    
    // Avatars
    this.drawAvatars(ctx, stepData.speaker);
    
    // Text content
    this.drawTextContent(ctx, stepData);
    
    // Dynamic visuals
    if (stepData.visual && stepData.visual.type) {
      this.callVisualFunction(ctx, stepData.visual.type, ...(stepData.visual.params || []));
    }
    
    // Chemical equations
    if (stepData.equation) {
      const equationX = this.config.LAYOUT.MEDIA.x + this.config.LAYOUT.MEDIA.width / 2;
      const equationY = this.config.LAYOUT.MEDIA.y + this.config.LAYOUT.MEDIA.height / 2;
      this.drawChemicalEquation(ctx, stepData.equation, equationX, equationY);
    }
    
    const paddedIndex = String(frameGlobalIndex).padStart(6, '0');
    const framePath = path.join(this.FRAMES_DIR, `frame_${paddedIndex}.png`);
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(framePath, buffer);
    return framePath;
  }

  drawChemicalEquation(ctx, equation, x, y, fontSize = 24) {
    ctx.save();
    ctx.fillStyle = this.config.COLORS.text;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(equation, x, y);
    ctx.restore();
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

  // MAIN GENERATION METHOD
  async generate() {
    try {
      await this.setupDirectories();
      console.log(`🚀 Starting video generation from script...`);
      console.log(`📁 Output directory: ${this.OUTPUT_DIR}`);

      // Generate audio if token available
      if (this.smallestAiToken) {
        console.log('\n🔊 Generating audio...');
        for (let i = 0; i < this.lessonSteps.length; i++) {
          await this.generateSingleAudio(i, this.lessonSteps[i]);
        }
      } else {
        console.log('\n🔇 Skipping audio generation (no API token)...');
      }

      // Calculate durations
      console.log('\n⏱️ Calculating effective durations...');
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

      // Generate frames
      console.log('\n🖼️ Generating frames...');
      let globalFrameIndex = 0;
      
      for (let i = 0; i < this.lessonSteps.length; i++) {
        const step = this.lessonSteps[i];
        const framesForThisStep = Math.round(step.effectiveDuration * this.config.FPS);
        
        console.log(`   Step ${i+1}: Generating ${framesForThisStep} frames`);
        
        for (let j = 0; j < framesForThisStep; j++) {
          await this.generateFrame(globalFrameIndex, step);
          globalFrameIndex++;
        }
      }

      // Create final video
      console.log('\n🎬 Creating video...');
      const silentVideoPath = await this.createVideoFromFramesWithDuration(targetVideoDuration);
      await this.combineVideoWithTimedAudio(silentVideoPath, this.lessonSteps, this.FINAL_VIDEO);
      
      console.log(`\n🎉 Video created successfully!`);
      console.log(`🎬 Output: ${this.FINAL_VIDEO}`);
      console.log(`⏱️ Duration: ${targetVideoDuration.toFixed(2)}s`);
      
      return this.FINAL_VIDEO;
      
    } catch (error) {
      console.error('❌ Error in video generation:', error.message || error);
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
🎬 Direct Script Video Generator

Usage:
  node direct_script_video_generator.js <script_path> [video_name]

Examples:
  node direct_script_video_generator.js output/chemistry/acids_bases/generated_script.js
  node direct_script_video_generator.js output/chemistry/acids_bases/generated_script.js "my_acids_video"

This generates video directly from the JavaScript script file without needing JSON.
      `);
      return;
    }
    
    console.log(`🚀 Starting video generation from: ${scriptPath}`);
    
    const generator = new DirectScriptVideoGenerator(scriptPath, { videoName });
    const videoPath = await generator.generate();
    
    console.log(`\n📊 Generation Complete!`);
    console.log(`📹 Video saved: ${videoPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = DirectScriptVideoGenerator;

// Run if called directly
if (require.main === module) {
  main();
}