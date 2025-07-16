// visual_preview_tool.js - Generate preview images for visual functions
const fs = require('fs').promises;
const { existsSync } = require('fs');
const path = require('path');

let createCanvas;
try {
  ({ createCanvas } = require('canvas'));
} catch (err) {
  console.error('⚠️ Error loading canvas module:', err.message);
  console.error('Ensure canvas prerequisites are installed. See: https://www.npmjs.com/package/canvas#compiling');
  process.exit(1);
}

class VisualPreviewGenerator {
  constructor() {
    this.canvas = createCanvas(1000, 700);
    this.ctx = this.canvas.getContext('2d');
  }

  async loadGeneratedContent(scriptPath) {
    try {
      console.log('📄 Loading generated script...');
      
      if (!existsSync(scriptPath)) {
        throw new Error(`Script file not found: ${scriptPath}`);
      }
      
      // Read and parse the JavaScript content
      const jsContent = await fs.readFile(scriptPath, 'utf8');
      
      // Create a sandbox to evaluate the JavaScript content
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
      
      console.log(`✅ Loaded ${Object.keys(result.visualFunctions).length} visual functions`);
      console.log(`📝 Found ${result.LESSON_CONTENT.lessonSteps.length} lesson steps`);
      
      return {
        lessonSteps: result.LESSON_CONTENT.lessonSteps,
        speakers: result.LESSON_CONTENT.speakers,
        visualFunctions: result.visualFunctions
      };
      
    } catch (error) {
      console.error('❌ Error loading content:', error.message);
      throw error;
    }
  }

  drawBackground(speaker) {
    // Use the same background colors as the video generator
    const SPEAKER_BACKGROUNDS = {
      teacher: '#f8fafe',
      student1: '#f3e8ff',
      student2: '#fefaf8'
    };

    const backgroundColor = SPEAKER_BACKGROUNDS[speaker] || '#e9f0f4';
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, 1000, 700);
  }

  drawAvatars(activeSpeaker, speakers) {
    const LAYOUT = {
      AVATAR: { x: 30, y: 250, spacing: 70, size: 30 }
    };

    const COLORS = { text: '#2c3e50' };
    
    const speakerKeys = Object.keys(speakers);
    
    speakerKeys.forEach((speaker, index) => {
      const config = speakers[speaker];
      const isActive = speaker === activeSpeaker;
      const x = LAYOUT.AVATAR.x + LAYOUT.AVATAR.size / 2;
      const y = LAYOUT.AVATAR.y + (index * LAYOUT.AVATAR.spacing) + LAYOUT.AVATAR.size / 2;
      
      this.drawSingleAvatar(x, y, config, isActive);
    });
  }

  drawSingleAvatar(x, y, config, isActive) {
    this.ctx.save();
    
    const radius = 15; // LAYOUT.AVATAR.size / 2
    
    // Draw glow effect for active speaker
    if (isActive) {
      this.ctx.shadowColor = config.color;
      this.ctx.shadowBlur = 15;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
    }
    
    // Draw main avatar circle
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = isActive ? '#fdbcb4' : this.lightenColor('#fdbcb4', 0.4);
    this.ctx.fill();
    
    // Draw border
    this.ctx.lineWidth = isActive ? 3 : 1.5;
    this.ctx.strokeStyle = isActive ? config.color : this.lightenColor(config.color, 0.3);
    this.ctx.stroke();
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
    
    // Draw simple facial features
    this.drawAvatarFace(x, y, radius * 0.8, isActive);
    
    // Draw name label
    this.ctx.fillStyle = isActive ? '#2c3e50' : this.lightenColor('#2c3e50', 0.4);
    this.ctx.font = `${isActive ? 'bold ' : ''}12px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(config.name, x, y + radius + 16);
    
    this.ctx.restore();
  }

  drawAvatarFace(centerX, centerY, faceRadius, isActive) {
    this.ctx.save();
    
    // Eyes
    const eyeColor = isActive ? '#2c3e50' : this.lightenColor('#2c3e50', 0.5);
    this.ctx.fillStyle = eyeColor;
    this.ctx.beginPath();
    this.ctx.arc(centerX - faceRadius * 0.3, centerY - faceRadius * 0.2, faceRadius * 0.06, 0, Math.PI * 2);
    this.ctx.arc(centerX + faceRadius * 0.3, centerY - faceRadius * 0.2, faceRadius * 0.06, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Smile
    this.ctx.strokeStyle = eyeColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY + faceRadius * 0.1, faceRadius * 0.3, 0, Math.PI);
    this.ctx.stroke();
    
    this.ctx.restore();
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

  drawTextContent(step) {
    const LAYOUT = {
      TITLE: { x: 500, y: 75, width: 1000 },
      CONTENT: { x: 500, y: 120, width: 800 },
      CONTENT2: { x: 500, y: 145, width: 800 }
    };

    const COLORS = { primary: '#1a5276', text: '#2c3e50' };

    // Title
    this.ctx.fillStyle = COLORS.primary;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(step.title, LAYOUT.TITLE.x, LAYOUT.TITLE.y);
    
    // Content
    this.ctx.fillStyle = COLORS.text;
    if (step.content) {
      this.ctx.font = '22px Arial';
      this.wrapText(step.content, LAYOUT.CONTENT.x, LAYOUT.CONTENT.y, LAYOUT.CONTENT.width, 30);
    }
    if (step.content2) {
      this.ctx.font = '22px Arial';
      this.wrapText(step.content2, LAYOUT.CONTENT2.x, LAYOUT.CONTENT2.y + (step.content ? 30 : 0), LAYOUT.CONTENT2.width, 26);
    }

    // Draw media area border
    const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  }

  wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    this.ctx.textAlign = 'center';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        this.ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, x, currentY);
  }

  async generateVisualPreview(step, visualFunctions, speakers, outputPath) {
    try {
      // Clear canvas and draw background
      this.drawBackground(step.speaker);
      
      // Draw avatars
      this.drawAvatars(step.speaker, speakers);
      
      // Draw text content
      this.drawTextContent(step);
      
      // Draw visual function if present
      if (step.visual && step.visual.type && visualFunctions[step.visual.type]) {
        console.log(`   🎨 Drawing visual: ${step.visual.type}(${step.visual.params ? step.visual.params.join(', ') : ''})`);
        
        try {
          // Call the visual function
          if (step.visual.params && step.visual.params.length > 0) {
            visualFunctions[step.visual.type](this.ctx, ...step.visual.params);
          } else {
            visualFunctions[step.visual.type](this.ctx);
          }
        } catch (error) {
          console.error(`   ❌ Error in visual function '${step.visual.type}':`, error.message);
          
          // Draw error placeholder
          this.ctx.save();
          this.ctx.fillStyle = '#ff6b6b';
          this.ctx.font = '16px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(`Error in ${step.visual.type}()`, 500, 400);
          this.ctx.restore();
        }
      }
      
      // Save the image
      const buffer = this.canvas.toBuffer('image/png');
      await fs.writeFile(outputPath, buffer);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Error generating preview:`, error.message);
      return false;
    }
  }

  async generateAllPreviews(scriptPath, outputDir = null) {
    try {
      // Load content
      const content = await this.loadGeneratedContent(scriptPath);
      
      // Set up output directory
      if (!outputDir) {
        outputDir = path.join(path.dirname(scriptPath), 'visual_previews');
      }
      
      await fs.mkdir(outputDir, { recursive: true });
      console.log(`📁 Preview directory: ${outputDir}`);
      
      // Generate previews for steps with visuals
      const stepsWithVisuals = content.lessonSteps.filter(step => step.visual && step.visual.type);
      console.log(`\n🖼️ Generating ${stepsWithVisuals.length} visual previews...`);
      
      let successCount = 0;
      
      for (let i = 0; i < stepsWithVisuals.length; i++) {
        const step = stepsWithVisuals[i];
        const stepIndex = content.lessonSteps.indexOf(step) + 1;
        
        const filename = `step_${String(stepIndex).padStart(2, '0')}_${step.visual.type}_${step.speaker}.png`;
        const outputPath = path.join(outputDir, filename);
        
        console.log(`   ${i + 1}/${stepsWithVisuals.length}. [${step.speaker}] ${step.title}`);
        
        const success = await this.generateVisualPreview(
          step,
          content.visualFunctions,
          content.speakers,
          outputPath
        );
        
        if (success) {
          console.log(`   ✅ Saved: ${filename}`);
          successCount++;
        } else {
          console.log(`   ❌ Failed: ${filename}`);
        }
      }
      
      console.log(`\n🎉 Generated ${successCount}/${stepsWithVisuals.length} visual previews`);
      console.log(`📂 Open folder: ${outputDir}`);
      
      // Also generate individual visual function examples
      await this.generateFunctionExamples(content.visualFunctions, outputDir);
      
      return {
        outputDir,
        successCount,
        totalCount: stepsWithVisuals.length
      };
      
    } catch (error) {
      console.error('❌ Error generating previews:', error.message);
      throw error;
    }
  }

  async generateFunctionExamples(visualFunctions, outputDir) {
    console.log(`\n🎯 Generating individual function examples...`);
    
    const examplesDir = path.join(outputDir, 'function_examples');
    await fs.mkdir(examplesDir, { recursive: true });
    
    const functionNames = Object.keys(visualFunctions);
    
    for (const funcName of functionNames) {
      try {
        // Clear canvas
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, 1000, 700);
        
        // Draw media area border
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(200, 200, 600, 400);
        
        // Call the function with some example parameters
        if (funcName === 'drawIndicatorTest') {
          visualFunctions[funcName](this.ctx, 'HCl');
        } else if (funcName === 'drawOlfactoryIndicators') {
          visualFunctions[funcName](this.ctx, 'setup');
        } else {
          visualFunctions[funcName](this.ctx);
        }
        
        const filename = `function_${funcName}.png`;
        const outputPath = path.join(examplesDir, filename);
        
        const buffer = this.canvas.toBuffer('image/png');
        await fs.writeFile(outputPath, buffer);
        
        console.log(`   ✅ ${funcName} → ${filename}`);
        
      } catch (error) {
        console.error(`   ❌ ${funcName}: ${error.message}`);
      }
    }
    
    console.log(`📂 Function examples: ${examplesDir}`);
  }
}

// Command line usage
async function main() {
  try {
    const scriptPath = process.argv[2];
    const outputDir = process.argv[3];
    
    if (!scriptPath) {
      console.log(`
🖼️ Visual Preview Tool Usage:

Generate preview images for all visual functions:
  node visual_preview_tool.js <script_path> [output_dir]

Examples:
  node visual_preview_tool.js ../output/chemistry/acids_bases/generated_script.js
  node visual_preview_tool.js ../output/chemistry/acids_bases/generated_script.js ./my_previews

This will create:
  - Individual preview images for each step with visuals
  - Function example images showing each visual function
  - Organized in folders for easy review
      `);
      return;
    }
    
    const generator = new VisualPreviewGenerator();
    const result = await generator.generateAllPreviews(scriptPath, outputDir);
    
    console.log(`\n📊 Preview Generation Complete!`);
    console.log(`✅ Success: ${result.successCount}/${result.totalCount} previews`);
    console.log(`📁 Location: ${result.outputDir}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = VisualPreviewGenerator;

// Run if called directly
if (require.main === module) {
  main();
}