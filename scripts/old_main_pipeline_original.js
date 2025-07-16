// updated_main_pipeline.js - Pipeline with enhanced content generator
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const EnhancedContentGenerator = require('./content_generator'); // Updated import
const VideoGenerator = require('./static_video_template');

class UpdatedVideoPipeline {
  constructor() {
    this.contentGenerator = new EnhancedContentGenerator(); // Use enhanced version
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // Helper to ask for user input
  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  // Helper to wait for user keypress
  waitForKeypress(message = "Press Enter to continue...") {
    return new Promise((resolve) => {
      this.rl.question(`${message}`, () => resolve());
    });
  }

  closeReadline() {
    this.rl.close();
  }

  readInputFile(filePath) {
    try {
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
      
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Input file not found: ${absolutePath}`);
      }
      return fs.readFileSync(absolutePath, 'utf8').trim();
    } catch (error) {
      console.error(`Error reading input file: ${error.message}`);
      throw error;
    }
  }

  resolveOutputPath(inputFilePath, videoName = null) {
    try {
      const absoluteInputPath = path.resolve(inputFilePath);
      const projectRoot = process.cwd();
      const inputDir = path.join(projectRoot, 'input');
      
      const relativePath = path.relative(inputDir, path.dirname(absoluteInputPath));
      const baseName = path.basename(absoluteInputPath, '.md');
      const finalVideoName = videoName || baseName;
      
      const outputPath = path.join(projectRoot, 'output', relativePath, finalVideoName);
      
      console.log(`📁 Path Resolution:`);
      console.log(`   Input: ${inputFilePath}`);
      console.log(`   Relative: ${relativePath}`);
      console.log(`   Output: ${outputPath}`);
      
      return outputPath;
    } catch (error) {
      console.error(`Error resolving output path: ${error.message}`);
      const fallbackPath = path.join(process.cwd(), 'output', videoName || `video_${Date.now()}`);
      console.log(`   Fallback: ${fallbackPath}`);
      return fallbackPath;
    }
  }

  // Preview the generated content structure
  async previewGeneratedContent(dynamicContent) {
    console.log('\n📋 Generated Content Preview:');
    console.log(`   Total Steps: ${dynamicContent.lessonSteps.length}`);
    console.log(`   Speakers: ${Object.keys(dynamicContent.speakers || {}).join(', ')}`);
    console.log(`   Visual Functions: ${Object.keys(dynamicContent.visualFunctions || {}).join(', ')}`);
    
    console.log('\n🎭 Lesson Steps Overview:');
    dynamicContent.lessonSteps.forEach((step, index) => {
      console.log(`\n${index + 1}. [${step.speaker}] ${step.title}`);
      console.log(`   Content: ${(step.content || 'N/A').substring(0, 60)}${step.content && step.content.length > 60 ? '...' : ''}`);
      console.log(`   Narration: ${step.narration.substring(0, 80)}${step.narration.length > 80 ? '...' : ''}`);
      console.log(`   Duration: ${step.visualDuration}s, Complex: ${step.isComplex || false}`);
      if (step.visual) {
        console.log(`   Visual: ${step.visual.type}(${step.visual.params ? step.visual.params.join(', ') : ''})`);
      }
      if (step.equation) {
        console.log(`   Equation: ${step.equation}`);
      }
    });

    console.log('\n📊 Content Statistics:');
    const totalDuration = dynamicContent.lessonSteps.reduce((sum, step) => sum + (step.visualDuration || 4), 0);
    const speakerCount = {};
    dynamicContent.lessonSteps.forEach(step => {
      speakerCount[step.speaker] = (speakerCount[step.speaker] || 0) + 1;
    });
    
    console.log(`   Estimated Duration: ${totalDuration}s (${(totalDuration/60).toFixed(1)} minutes)`);
    console.log(`   Speaker Distribution: ${Object.entries(speakerCount).map(([speaker, count]) => `${speaker}: ${count}`).join(', ')}`);
    
    const visualSteps = dynamicContent.lessonSteps.filter(step => step.visual).length;
    console.log(`   Steps with Visuals: ${visualSteps}/${dynamicContent.lessonSteps.length}`);
  }

  // Generate preview images for each slide
  async generatePreviewImages(dynamicContent, outputDir) {
    console.log('\n🖼️ Generating preview images for each slide...');
    
    const previewDir = path.join(outputDir, 'previews');
    await fs.promises.mkdir(previewDir, { recursive: true });
    
    // Create a temporary video generator for preview
    const tempVideoGenerator = new VideoGenerator(dynamicContent, {
      outputDir: outputDir,
      videoName: 'preview'
    });
    
    const previewPaths = [];
    
    for (let i = 0; i < dynamicContent.lessonSteps.length; i++) {
      const step = dynamicContent.lessonSteps[i];
      console.log(`   Generating preview ${i + 1}/${dynamicContent.lessonSteps.length}: ${step.title}`);
      
      try {
        // Generate a single frame for this step
        const framePath = await tempVideoGenerator.generateFrame(i, step);
        
        // Copy to preview directory with descriptive name
        const previewName = `slide_${String(i + 1).padStart(2, '0')}_${step.speaker}_${step.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.png`;
        const previewPath = path.join(previewDir, previewName);
        
        await fs.promises.copyFile(framePath, previewPath);
        previewPaths.push(previewPath);
        
        console.log(`   ✅ Preview saved: ${previewName}`);
        
      } catch (error) {
        console.error(`   ❌ Error generating preview for step ${i + 1}:`, error.message);
        previewPaths.push(null);
      }
    }
    
    return { previewDir, previewPaths };
  }

  // Show preview images to user
  async showPreviewImages(previewDir, previewPaths, dynamicContent) {
    console.log(`\n🖼️ Preview images generated in: ${previewDir}`);
    console.log(`\n📸 Preview Summary:`);
    
    previewPaths.forEach((previewPath, index) => {
      if (previewPath) {
        const step = dynamicContent.lessonSteps[index];
        console.log(`   ${index + 1}. [${step.speaker}] ${step.title} → ${path.basename(previewPath)}`);
      } else {
        console.log(`   ${index + 1}. [ERROR] Failed to generate preview`);
      }
    });

    console.log(`\n💡 Open the previews folder to review the generated slides:`);
    console.log(`   ${previewDir}`);
    console.log(`\n🔍 Each image shows how the slide will appear in the final video.`);
  }

  // NEW: Generate script only (first step)
  async generateScriptOnly(inputFilePath, options = {}) {
    try {
      console.log('📝 Generating script and visual code only...\n');
      
      // Step 1: Read input content
      console.log('📖 Step 1: Reading input content...');
      const inputContent = this.readInputFile(inputFilePath);
      console.log(`   Input length: ${inputContent.length} characters`);
      console.log(`   Preview: ${inputContent.substring(0, 100)}...`);
      
      // Step 2: Resolve output path
      const outputDir = this.resolveOutputPath(inputFilePath, options.videoName);
      const scriptPath = path.join(outputDir, 'generated_script.js');
      const contentPath = path.join(outputDir, 'generated_content.json');
      
      // Step 3: Generate dynamic content with enhanced generator
      console.log('\n🤖 Step 2: Generating script and visual functions...');
      const jsContent = await this.contentGenerator.generateDynamicContent(inputContent);
      
      // Step 4: Save the JavaScript content as-is for user review
      await fs.promises.mkdir(outputDir, { recursive: true });
      fs.writeFileSync(scriptPath, jsContent, 'utf8');
      console.log(`   JavaScript script saved to: ${scriptPath}`);
      
      // Step 5: Parse and validate the content
      console.log('\n🔍 Step 3: Parsing and validating content...');
      const parsedContent = this.contentGenerator.parseGeneratedContent(jsContent);
      console.log(`   Generated ${parsedContent.lessonSteps.length} lesson steps`);
      console.log(`   Visual functions: ${Object.keys(parsedContent.visualFunctions || {}).join(', ')}`);
      
      // Step 6: Save parsed content for video generation
      this.contentGenerator.saveContent(parsedContent, contentPath);
      
      // Step 7: Show content preview
      await this.previewGeneratedContent(parsedContent);
      
      console.log('\n🎯 Script Generation Complete!');
      console.log(`📄 Generated files:`);
      console.log(`   Script: ${scriptPath}`);
      console.log(`   Content: ${contentPath}`);
      console.log(`\n📝 Review the script file and edit if needed.`);
      console.log(`🎬 When ready, run: node main_pipeline.js video "${contentPath}" [video_name]`);
      
      this.closeReadline();
      
      return {
        scriptPath,
        contentPath,
        outputDir,
        parsedContent
      };
      
    } catch (error) {
      console.error('❌ Script generation error:', error);
      this.closeReadline();
      throw error;
    }
  }

  // Main interactive video generation method (updated to use enhanced generator)
  async generateVideoInteractive(inputFilePath, options = {}) {
    try {
      console.log('🎬 Starting Interactive Video Generation Pipeline...\n');
      
      // Step 1: Read input content
      console.log('📖 Step 1: Reading input content...');
      const inputContent = this.readInputFile(inputFilePath);
      console.log(`   Input length: ${inputContent.length} characters`);
      console.log(`   Preview: ${inputContent.substring(0, 100)}...`);
      
      // Step 2: Resolve output path
      const outputDir = this.resolveOutputPath(inputFilePath, options.videoName);
      const contentPath = path.join(outputDir, 'generated_content.json');
      
      // Step 3: Generate dynamic content with enhanced generator
      console.log('\n🤖 Step 2: Generating dynamic content with enhanced LLM...');
      const dynamicContent = await this.contentGenerator.generateAndParseContent(inputContent);
      console.log(`   Generated ${dynamicContent.lessonSteps.length} lesson steps`);
      console.log(`   Visual functions: ${Object.keys(dynamicContent.visualFunctions || {}).join(', ')}`);
      
      // Step 4: Save and preview content
      await fs.promises.mkdir(outputDir, { recursive: true });
      this.contentGenerator.saveContent(dynamicContent, contentPath);
      console.log(`   Dynamic content saved to: ${contentPath}`);
      
      // Step 5: Show content preview and ask for approval
      await this.previewGeneratedContent(dynamicContent);
      
      console.log('\n🤔 Content Review:');
      const contentApproval = await this.askQuestion('Do you want to proceed with this content? (y/n/edit): ');
      
      if (contentApproval.toLowerCase() === 'n') {
        console.log('❌ Content generation cancelled by user.');
        this.closeReadline();
        return { cancelled: true, contentPath };
      }
      
      if (contentApproval.toLowerCase() === 'edit') {
        console.log(`📝 Please edit the content file and run:`);
        console.log(`   node scripts/main_pipeline.js video "${contentPath}"`);
        this.closeReadline();
        return { editRequested: true, contentPath };
      }
      
      // Step 6: Generate preview images
      console.log('\n🖼️ Step 3: Generating preview images...');
      const { previewDir, previewPaths } = await this.generatePreviewImages(dynamicContent, outputDir);
      
      // Step 7: Show previews and ask for approval
      await this.showPreviewImages(previewDir, previewPaths, dynamicContent);
      
      console.log('\n🎨 Visual Review:');
      const visualApproval = await this.askQuestion('Do you want to proceed with video generation? (y/n): ');
      
      if (visualApproval.toLowerCase() === 'n') {
        console.log('❌ Video generation cancelled by user.');
        console.log(`✅ Content and previews are saved in: ${outputDir}`);
        this.closeReadline();
        return { 
          cancelled: true, 
          contentPath, 
          previewDir, 
          message: 'You can edit the content and regenerate later.' 
        };
      }
      
      // Step 8: Generate final video
      console.log('\n🎥 Step 4: Generating final video...');
      const videoGenerator = new VideoGenerator(dynamicContent, {
        outputDir: outputDir,
        inputPath: inputFilePath,
        videoName: options.videoName || path.basename(inputFilePath, '.md')
      });
      
      const videoPath = await videoGenerator.generate();
      
      console.log('\n🎉 Pipeline completed successfully!');
      console.log(`📁 Generated files:`);
      console.log(`   Input: ${inputFilePath}`);
      console.log(`   Content: ${contentPath}`);
      console.log(`   Previews: ${previewDir}`);
      console.log(`   Video: ${videoPath}`);
      console.log(`   Directory: ${outputDir}`);
      
      this.closeReadline();
      
      return {
        contentPath,
        videoPath,
        previewDir,
        outputDir,
        dynamicContent
      };
      
    } catch (error) {
      console.error('❌ Pipeline error:', error);
      this.closeReadline();
      throw error;
    }
  }

  // Non-interactive methods (keeping existing functionality)
  async generateVideo(inputFilePath, options = {}) {
    // Original method for non-interactive use
    try {
      console.log('🎬 Starting Non-Interactive Video Generation Pipeline...\n');
      
      const inputContent = this.readInputFile(inputFilePath);
      const outputDir = this.resolveOutputPath(inputFilePath, options.videoName);
      const contentPath = path.join(outputDir, 'generated_content.json');
      
      const dynamicContent = await this.contentGenerator.generateAndParseContent(inputContent);
      
      await fs.promises.mkdir(outputDir, { recursive: true });
      this.contentGenerator.saveContent(dynamicContent, contentPath);
      
      const videoGenerator = new VideoGenerator(dynamicContent, {
        outputDir: outputDir,
        inputPath: inputFilePath,
        videoName: options.videoName || path.basename(inputFilePath, '.md')
      });
      
      const videoPath = await videoGenerator.generate();
      
      return {
        contentPath,
        videoPath,
        outputDir,
        dynamicContent
      };
      
    } catch (error) {
      console.error('❌ Pipeline error:', error);
      throw error;
    }
  }

  async generateVideoFromContent(contentFilePath, options = {}) {
    try {
      console.log('🎬 Generating video from existing content...');
      
      const absoluteContentPath = path.resolve(contentFilePath);
      let dynamicContent = this.contentGenerator.loadContent(absoluteContentPath);
      
      console.log(`✅ Loaded content with ${dynamicContent.lessonSteps.length} steps`);
      
      let outputDir;
      if (options.outputDir) {
        outputDir = path.resolve(options.outputDir);
      } else {
        outputDir = path.dirname(absoluteContentPath);
      }
      
      const videoGenerator = new VideoGenerator(dynamicContent, {
        outputDir: outputDir,
        videoName: options.videoName || 'generated_video'
      });
      
      const videoPath = await videoGenerator.generate();
      
      console.log(`✅ Video generated: ${videoPath}`);
      return videoPath;
      
    } catch (error) {
      console.error('❌ Error generating video from content:', error);
      throw error;
    }
  }

  async generateContentOnly(inputFilePath, outputPath = null) {
    try {
      console.log('📝 Generating content only...');
      
      const inputContent = this.readInputFile(inputFilePath);
      const dynamicContent = await this.contentGenerator.generateAndParseContent(inputContent);
      
      let contentPath;
      if (outputPath) {
        contentPath = path.resolve(outputPath);
      } else {
        const outputDir = this.resolveOutputPath(inputFilePath);
        await fs.promises.mkdir(outputDir, { recursive: true });
        contentPath = path.join(outputDir, 'generated_content.json');
      }
      
      this.contentGenerator.saveContent(dynamicContent, contentPath);
      
      console.log(`✅ Content generated and saved to: ${contentPath}`);
      return { contentPath, dynamicContent };
      
    } catch (error) {
      console.error('❌ Error generating content:', error);
      throw error;
    }
  }

  previewContent(contentFilePath) {
    try {
      const absolutePath = path.resolve(contentFilePath);
      const content = this.contentGenerator.loadContent(absolutePath);
      
      console.log('\n📋 Content Preview:');
      console.log(`   File: ${absolutePath}`);
      console.log(`   Total Steps: ${content.lessonSteps.length}`);
      console.log(`   Speakers: ${Object.keys(content.speakers || {}).join(', ')}`);
      console.log(`   Visual Functions: ${Object.keys(content.visualFunctions || {}).join(', ')}`);
      
      console.log('\n🎭 Lesson Steps:');
      content.lessonSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. [${step.speaker}] ${step.title}`);
        console.log(`      Content: ${(step.content || 'N/A').substring(0, 50)}${step.content && step.content.length > 50 ? '...' : ''}`);
        console.log(`      Duration: ${step.visualDuration}s, Complex: ${step.isComplex || false}`);
        if (step.visual) {
          console.log(`      Visual: ${step.visual.type}(${step.visual.params ? step.visual.params.join(', ') : ''})`);
        }
        if (step.equation) {
          console.log(`      Equation: ${step.equation}`);
        }
        console.log('');
      });
      
      return content;
      
    } catch (error) {
      console.error('❌ Error previewing content:', error);
      throw error;
    }
  }

  listInputFiles(subject = null) {
    try {
      const inputDir = path.join(process.cwd(), 'input');
      
      if (!fs.existsSync(inputDir)) {
        console.log('❌ Input directory not found. Create it with: mkdir -p input');
        return [];
      }
      
      console.log('\n📚 Available Input Files:');
      
      const subjects = subject ? [subject] : fs.readdirSync(inputDir).filter(item => 
        fs.statSync(path.join(inputDir, item)).isDirectory()
      );
      
      const allFiles = [];
      
      subjects.forEach(subjectDir => {
        const subjectPath = path.join(inputDir, subjectDir);
        if (fs.existsSync(subjectPath) && fs.statSync(subjectPath).isDirectory()) {
          console.log(`\n📁 ${subjectDir}/`);
          
          const files = fs.readdirSync(subjectPath).filter(file => file.endsWith('.md'));
          
          if (files.length === 0) {
            console.log('   (no .md files found)');
          } else {
            files.forEach(file => {
              const filePath = path.join('input', subjectDir, file);
              console.log(`   📄 ${file} → ${filePath}`);
              allFiles.push(filePath);
            });
          }
        }
      });
      
      return allFiles;
      
    } catch (error) {
      console.error('❌ Error listing input files:', error);
      return [];
    }
  }
}

// Command-line interface
async function main() {
  try {
    const args = process.argv.slice(2);
    const pipeline = new UpdatedVideoPipeline();
    
    if (args.length === 0) {
      console.log(`
🎬 Enhanced Video Generation Pipeline Usage:

STEP 1: Generate Script Only (Review & Edit)
1. Generate script and visual code:
   node scripts/main_pipeline.js script <input_file.md> [video_name]

STEP 2: Generate Video from Script
2. Generate video from reviewed script:
   node scripts/main_pipeline.js video <content_file.json> [video_name]

INTERACTIVE MODES (with approval and preview):
3. Generate complete video with approval steps:
   node scripts/main_pipeline.js interactive <input_file.md> [video_name]

4. Generate with previews only:
   node scripts/main_pipeline.js preview-generate <input_file.md> [video_name]

NON-INTERACTIVE MODES (original functionality):
5. Generate complete video (original):
   node scripts/main_pipeline.js generate <input_file.md> [video_name]

6. Generate content only:
   node scripts/main_pipeline.js content <input_file.md> [output_file.json]

7. Preview existing content:
   node scripts/main_pipeline.js preview <content_file.json>

8. List available input files:
   node scripts/main_pipeline.js list [subject]

Examples:
   node scripts/main_pipeline.js script input/chemistry/chemical_reactions.md "acids_bases"
   node scripts/main_pipeline.js video output/chemistry/acids_bases/generated_content.json
   node scripts/main_pipeline.js interactive input/chemistry/chemical_reactions.md "combination_reactions"

🎯 Recommended workflow: Use 'script' first to review, then 'video' to generate!
      `);
      
      pipeline.listInputFiles();
      return;
    }

    const command = args[0];
    const inputFile = args[1];
    const outputName = args[2];

    switch (command) {
      case 'script':
        if (!inputFile) {
          throw new Error('Input file required for script command');
        }
        console.log(`📝 Starting SCRIPT generation from: ${inputFile}`);
        const scriptResult = await pipeline.generateScriptOnly(inputFile, { videoName: outputName });
        console.log('\n📊 Script Generation Summary:');
        console.log(`   Steps: ${scriptResult.parsedContent?.lessonSteps.length || 'N/A'}`);
        console.log(`   Script: ${scriptResult.scriptPath}`);
        console.log(`   Content: ${scriptResult.contentPath}`);
        break;

      case 'interactive':
        if (!inputFile) {
          throw new Error('Input file required for interactive command');
        }
        console.log(`🚀 Starting INTERACTIVE video generation from: ${inputFile}`);
        const interactiveResult = await pipeline.generateVideoInteractive(inputFile, { videoName: outputName });
        if (interactiveResult.cancelled) {
          console.log('\n✋ Process cancelled by user');
        } else if (interactiveResult.editRequested) {
          console.log('\n📝 Edit requested - please modify the content file');
        } else {
          console.log('\n📊 Generation Summary:');
          console.log(`   Steps: ${interactiveResult.dynamicContent?.lessonSteps.length || 'N/A'}`);
          console.log(`   Content: ${interactiveResult.contentPath}`);
          console.log(`   Previews: ${interactiveResult.previewDir}`);
          console.log(`   Video: ${interactiveResult.videoPath}`);
        }
        break;

      case 'preview-generate':
        if (!inputFile) {
          throw new Error('Input file required for preview-generate command');
        }
        console.log(`🖼️ Generating with preview from: ${inputFile}`);
        const previewResult = await pipeline.generateVideoInteractive(inputFile, { videoName: outputName });
        break;

      case 'generate':
        if (!inputFile) {
          throw new Error('Input file required for generate command');
        }
        console.log(`🚀 Generating complete video from: ${inputFile}`);
        const result = await pipeline.generateVideo(inputFile, { videoName: outputName });
        console.log('\n📊 Generation Summary:');
        console.log(`   Steps: ${result.dynamicContent.lessonSteps.length}`);
        console.log(`   Content: ${result.contentPath}`);
        console.log(`   Video: ${result.videoPath}`);
        console.log(`   Directory: ${result.outputDir}`);
        break;

      case 'content':
        if (!inputFile) {
          throw new Error('Input file required for content command');
        }
        console.log(`📝 Generating content from: ${inputFile}`);
        const contentResult = await pipeline.generateContentOnly(inputFile, outputName);
        pipeline.previewContent(contentResult.contentPath);
        break;

      case 'video':
        if (!inputFile) {
          throw new Error('Content file required for video command');
        }
        console.log(`🎥 Generating video from content: ${inputFile}`);
        const videoPath = await pipeline.generateVideoFromContent(inputFile, { videoName: outputName });
        console.log(`✅ Video generated: ${videoPath}`);
        break;

      case 'preview':
        if (!inputFile) {
          throw new Error('Content file required for preview command');
        }
        console.log(`👀 Previewing content: ${inputFile}`);
        pipeline.previewContent(inputFile);
        break;

      case 'list':
        pipeline.listInputFiles(inputFile);
        break;

      default:
        throw new Error(`Unknown command: ${command}. Use: script, interactive, preview-generate, generate, content, video, preview, or list`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Run without arguments to see usage help');
    process.exit(1);
  }
}

// Export for use as module
module.exports = UpdatedVideoPipeline;

// Run if called directly
if (require.main === module) {
  main();
}