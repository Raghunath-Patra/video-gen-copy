// true_parallel_frame_generator.js - Real multi-core frame generation
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const path = require('path');

// Frame generation worker (runs in separate CPU core)
if (!isMainThread) {
  const fs = require('fs').promises;
  let createCanvas;
  
  try {
    ({ createCanvas } = require('canvas'));
  } catch (err) {
    console.error('Canvas not available in worker thread');
    process.exit(1);
  }

  // Worker receives frame generation task
  async function generateFrameInWorker() {
    try {
      const { step, framePath, hash, visualFunctions, speakers, config } = workerData;
      
      // Canvas rendering in separate CPU core
      const canvas = createCanvas(1000, 700);
      const ctx = canvas.getContext('2d');
      
      // Reconstruct visual functions from serialized code
      const reconstructedFunctions = {};
      Object.keys(visualFunctions).forEach(name => {
        try {
          reconstructedFunctions[name] = eval(`(${visualFunctions[name]})`);
        } catch (error) {
          console.error(`Failed to reconstruct function ${name}:`, error.message);
        }
      });
      
      // Draw frame (same logic as before)
      drawFrameContent(ctx, step, reconstructedFunctions, speakers, config);
      
      // Generate buffer and save
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(framePath, buffer);
      
      // Send success message back to main thread
      parentPort.postMessage({ 
        success: true, 
        framePath, 
        hash,
        workerId: workerData.workerId 
      });
      
    } catch (error) {
      // Send error message back to main thread
      parentPort.postMessage({ 
        success: false, 
        error: error.message, 
        hash: workerData.hash,
        workerId: workerData.workerId 
      });
    }
  }

  // Helper function to draw frame content
  function drawFrameContent(ctx, step, visualFunctions, speakers, config) {
    // Background
    const backgroundColor = config.SPEAKER_BACKGROUNDS[step.speaker] || config.COLORS.background;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 1000, 700);
    
    // Avatars
    drawAvatars(ctx, step.speaker, speakers, config);
    
    // Text content
    drawTextContent(ctx, step, config);
    
    // Visual functions
    if (step.visual && step.visual.type && visualFunctions[step.visual.type]) {
      try {
        visualFunctions[step.visual.type](ctx, ...(step.visual.params || []));
      } catch (error) {
        console.error(`Error in visual function ${step.visual.type}:`, error.message);
      }
    }
    
    // Chemical equations
    if (step.equation) {
      const equationX = config.LAYOUT.MEDIA.x + config.LAYOUT.MEDIA.width / 2;
      const equationY = config.LAYOUT.MEDIA.y + config.LAYOUT.MEDIA.height / 2;
      drawChemicalEquation(ctx, step.equation, equationX, equationY);
    }
  }

  // Simplified drawing functions for worker
  function drawAvatars(ctx, activeSpeaker, speakers, config) {
    const speakerKeys = Object.keys(speakers);
    
    speakerKeys.forEach((speaker, index) => {
      const speakerConfig = speakers[speaker];
      const isActive = speaker === activeSpeaker;
      const x = config.LAYOUT.AVATAR.x + config.LAYOUT.AVATAR.size / 2;
      const y = config.LAYOUT.AVATAR.y + (index * config.LAYOUT.AVATAR.spacing) + config.LAYOUT.AVATAR.size / 2;
      
      drawSingleAvatar(ctx, x, y, speakerConfig, isActive, config);
    });
  }

  function drawSingleAvatar(ctx, x, y, speakerConfig, isActive, config) {
    ctx.save();
    
    const radius = config.LAYOUT.AVATAR.size / 2;
    
    if (isActive) {
      ctx.shadowColor = speakerConfig.color;
      ctx.shadowBlur = 15;
    }
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#fdbcb4' : lightenColor('#fdbcb4', 0.4);
    ctx.fill();
    
    ctx.lineWidth = isActive ? 3 : 1.5;
    ctx.strokeStyle = isActive ? speakerConfig.color : lightenColor(speakerConfig.color, 0.3);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // Simple face
    const eyeColor = isActive ? '#2c3e50' : lightenColor('#2c3e50', 0.5);
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.2, radius * 0.06, 0, Math.PI * 2);
    ctx.arc(x + radius * 0.3, y - radius * 0.2, radius * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y + radius * 0.1, radius * 0.3, 0, Math.PI);
    ctx.stroke();
    
    // Name
    ctx.fillStyle = isActive ? '#2c3e50' : lightenColor('#2c3e50', 0.4);
    ctx.font = `${isActive ? 'bold ' : ''}12px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(speakerConfig.name, x, y + radius + 16);
    
    ctx.restore();
  }

  function drawTextContent(ctx, step, config) {
    // Title
    ctx.fillStyle = config.COLORS.primary;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(step.title, config.LAYOUT.TITLE.x, config.LAYOUT.TITLE.y);
    
    // Content
    ctx.fillStyle = config.COLORS.text;
    if (step.content) {
      ctx.font = '22px Arial';
      wrapText(ctx, step.content, config.LAYOUT.CONTENT.x, config.LAYOUT.CONTENT.y, config.LAYOUT.CONTENT.width, 30);
    }
    if (step.content2) {
      ctx.font = '22px Arial';
      wrapText(ctx, step.content2, config.LAYOUT.CONTENT2.x, config.LAYOUT.CONTENT2.y + (step.content ? 30 : 0), config.LAYOUT.CONTENT2.width, 26);
    }

    // Media area border
    ctx.strokeStyle = config.LAYOUT.MEDIA.borderColor;
    ctx.lineWidth = config.LAYOUT.MEDIA.border;
    ctx.strokeRect(
      config.LAYOUT.MEDIA.x, 
      config.LAYOUT.MEDIA.y, 
      config.LAYOUT.MEDIA.width, 
      config.LAYOUT.MEDIA.height
    );
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    ctx.textAlign = 'center';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  function drawChemicalEquation(ctx, equation, x, y, fontSize = 24) {
    ctx.save();
    ctx.fillStyle = '#2c3e50';
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(equation, x, y);
    ctx.restore();
  }

  function lightenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  // Start worker task
  generateFrameInWorker();
  
} else {
  // Main thread - Multi-core frame generation manager
  
  class MultiCoreFrameGenerator {
    constructor(maxWorkers = null) {
      this.maxWorkers = maxWorkers || Math.min(os.cpus().length, 8); // Use up to 8 cores
      this.activeWorkers = [];
      this.completedFrames = new Map();
      
      console.log(`🔥 Multi-core frame generator initialized:`);
      console.log(`   CPU cores available: ${os.cpus().length}`);
      console.log(`   Worker threads to use: ${this.maxWorkers}`);
    }

    async generateUniqueFramesParallel(uniqueSteps, visualFunctions, speakers, config, outputDir) {
      console.log(`⚡ Generating ${uniqueSteps.length} unique frames using ${this.maxWorkers} CPU cores...`);
      
      // Serialize visual functions for worker threads
      const serializedFunctions = {};
      Object.keys(visualFunctions).forEach(name => {
        if (typeof visualFunctions[name] === 'function') {
          serializedFunctions[name] = visualFunctions[name].toString();
        }
      });
      
      const startTime = Date.now();
      let completedCount = 0;
      let errorCount = 0;
      
      // Process frames in batches using all available cores
      for (let i = 0; i < uniqueSteps.length; i += this.maxWorkers) {
        const batch = uniqueSteps.slice(i, i + this.maxWorkers);
        const workerPromises = [];
        
        // Create worker for each frame in batch
        batch.forEach(({ step, index, hash }, batchIndex) => {
          const workerId = i + batchIndex;
          const framePath = path.join(outputDir, `unique_${hash}.png`);
          
          const workerPromise = new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
              workerData: {
                step,
                framePath,
                hash,
                visualFunctions: serializedFunctions,
                speakers,
                config,
                workerId
              }
            });
            
            worker.on('message', (result) => {
              if (result.success) {
                this.completedFrames.set(result.hash, result.framePath);
                completedCount++;
                console.log(`   ✅ Core ${result.workerId}: Generated frame for step ${index + 1}`);
              } else {
                errorCount++;
                console.error(`   ❌ Core ${result.workerId}: Error - ${result.error}`);
              }
              
              worker.terminate();
              resolve(result);
            });
            
            worker.on('error', (error) => {
              errorCount++;
              console.error(`   ❌ Worker ${workerId} error:`, error.message);
              worker.terminate();
              reject(error);
            });
            
            this.activeWorkers.push(worker);
          });
          
          workerPromises.push(workerPromise);
        });
        
        // Wait for all workers in this batch to complete
        try {
          await Promise.all(workerPromises);
          console.log(`   Batch ${Math.floor(i / this.maxWorkers) + 1}: ${batch.length} frames processed`);
        } catch (error) {
          console.error(`   ❌ Batch error:`, error.message);
        }
      }
      
      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;
      
      console.log(`\n🔥 Multi-core frame generation complete!`);
      console.log(`   Frames generated: ${completedCount}/${uniqueSteps.length}`);
      console.log(`   Errors: ${errorCount}`);
      console.log(`   Processing time: ${processingTime.toFixed(2)}s`);
      console.log(`   Average per frame: ${(processingTime / uniqueSteps.length).toFixed(3)}s`);
      console.log(`   🚀 Performance: ${this.maxWorkers}x parallel processing power!`);
      
      return this.completedFrames;
    }

    getFramePath(hash) {
      return this.completedFrames.get(hash);
    }

    cleanup() {
      // Terminate any remaining workers
      this.activeWorkers.forEach(worker => {
        try {
          worker.terminate();
        } catch (error) {
          // Worker already terminated
        }
      });
      this.activeWorkers = [];
    }
  }

  module.exports = MultiCoreFrameGenerator;
}

// Usage example for main video generator:
/*
const MultiCoreFrameGenerator = require('./true_parallel_frame_generator');

class OptimizedVideoGenerator {
  constructor(scriptPath, options = {}) {
    // ... existing constructor code ...
    this.multiCoreGenerator = new MultiCoreFrameGenerator();
  }

  async generateUniqueFrames() {
    console.log('🖼️ Generating unique frames with TRUE multi-core processing...');
    
    const { uniqueCount } = this.analyzeFrameUniqueness();
    const uniqueSteps = [];
    
    this.lessonSteps.forEach((step, index) => {
      const frameInfo = this.uniqueFrames.get(index);
      if (frameInfo.isUnique) {
        uniqueSteps.push({ step, index, hash: frameInfo.hash });
      }
    });
    
    // Use multi-core generation
    this.frameCache = await this.multiCoreGenerator.generateUniqueFramesParallel(
      uniqueSteps, 
      this.visualFunctions, 
      this.speakers, 
      this.config, 
      this.UNIQUE_FRAMES_DIR
    );
    
    console.log('✅ Multi-core unique frame generation complete');
  }
}
*/