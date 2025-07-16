// simplified_main_pipeline.js - Clean script-only workflow
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const EnhancedContentGenerator = require('./content_generator');
const DirectScriptVideoGenerator = require('./direct_script_video_generator');

class SimplifiedVideoPipeline {
  constructor() {
    this.contentGenerator = new EnhancedContentGenerator();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
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
      console.log(`   Output: ${outputPath}`);
      
      return outputPath;
    } catch (error) {
      console.error(`Error resolving output path: ${error.message}`);
      const fallbackPath = path.join(process.cwd(), 'output', videoName || `video_${Date.now()}`);
      console.log(`   Fallback: ${fallbackPath}`);
      return fallbackPath;
    }
  }

  // NEW: Generate script only (no redundant JSON)
  async generateScriptOnly(inputFilePath, options = {}) {
    try {
      console.log('📝 Generating script only...\n');
      
      // Step 1: Read input content
      console.log('📖 Reading input content...');
      const inputContent = this.readInputFile(inputFilePath);
      console.log(`   Input length: ${inputContent.length} characters`);
      
      // Step 2: Resolve output path
      const outputDir = this.resolveOutputPath(inputFilePath, options.videoName);
      const scriptPath = path.join(outputDir, 'generated_script.js');
      
      // Step 3: Generate JavaScript content
      console.log('\n🤖 Generating script and visual functions...');
      const jsContent = await this.contentGenerator.generateDynamicContent(inputContent);
      
      // Step 4: Save the JavaScript script
      await fs.promises.mkdir(outputDir, { recursive: true });
      fs.writeFileSync(scriptPath, jsContent, 'utf8');
      console.log(`✅ Script saved to: ${scriptPath}`);
      
      // Step 5: Parse and validate
      console.log('\n🔍 Validating content...');
      const parsedContent = this.contentGenerator.parseGeneratedContent(jsContent);
      console.log(`   Generated ${parsedContent.lessonSteps.length} lesson steps`);
      console.log(`   Visual functions: ${Object.keys(parsedContent.visualFunctions || {}).join(', ')}`);
      
      console.log('\n🎯 Script Generation Complete!');
      console.log(`📄 Generated script: ${scriptPath}`);
      console.log(`\n📝 Next steps:`);
      console.log(`   1. Review/edit: ${scriptPath}`);
      console.log(`   2. Generate previews: node scripts/visual_preview_tool.js "${scriptPath}"`);
      console.log(`   3. Generate video: node scripts/direct_script_video_generator.js "${scriptPath}"`);
      
      this.closeReadline();
      
      return {
        scriptPath,
        outputDir,
        parsedContent
      };
      
    } catch (error) {
      console.error('❌ Script generation error:', error);
      this.closeReadline();
      throw error;
    }
  }

  // Generate video directly from script
  async generateVideoFromScript(scriptPath, options = {}) {
    try {
      console.log(`🎬 Generating video from script: ${scriptPath}`);
      
      const generator = new DirectScriptVideoGenerator(scriptPath, options);
      const videoPath = await generator.generate();
      
      console.log(`✅ Video generation complete!`);
      console.log(`📹 Video saved: ${videoPath}`);
      
      return videoPath;
      
    } catch (error) {
      console.error('❌ Video generation error:', error);
      throw error;
    }
  }

  // Complete workflow: input -> script -> video
  async generateComplete(inputFilePath, options = {}) {
    try {
      console.log('🚀 Starting complete workflow...\n');
      
      // Step 1: Generate script
      const scriptResult = await this.generateScriptOnly(inputFilePath, options);
      
      // Step 2: Ask user for approval
      console.log('\n🤔 Review the generated script...');
      const approval = await this.askQuestion('Generate video now? (y/n/preview): ');
      
      if (approval.toLowerCase() === 'n') {
        console.log('❌ Video generation cancelled. Script saved for later use.');
        this.closeReadline();
        return { scriptPath: scriptResult.scriptPath, cancelled: true };
      }
      
      if (approval.toLowerCase() === 'preview') {
        console.log('🖼️ Generate previews with:');
        console.log(`   node scripts/visual_preview_tool.js "${scriptResult.scriptPath}"`);
        this.closeReadline();
        return { scriptPath: scriptResult.scriptPath, previewRequested: true };
      }
      
      // Step 3: Generate video
      console.log('\n🎬 Proceeding with video generation...');
      const videoPath = await this.generateVideoFromScript(scriptResult.scriptPath, options);
      
      console.log('\n🎉 Complete workflow finished!');
      console.log(`📄 Script: ${scriptResult.scriptPath}`);
      console.log(`📹 Video: ${videoPath}`);
      
      this.closeReadline();
      
      return {
        scriptPath: scriptResult.scriptPath,
        videoPath,
        outputDir: scriptResult.outputDir
      };
      
    } catch (error) {
      console.error('❌ Complete workflow error:', error);
      this.closeReadline();
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
    const pipeline = new SimplifiedVideoPipeline();
    
    if (args.length === 0) {
      console.log(`
🎬 Simplified Video Generation Pipeline

RECOMMENDED WORKFLOW:
1. Generate script only:
   node scripts/main_pipeline.js script <input_file.md> [video_name]

2. Generate visual previews:
   node scripts/visual_preview_tool.js <generated_script.js>

3. Generate video from script:
   node scripts/direct_script_video_generator.js <generated_script.js> [video_name]

QUICK COMMANDS:
- Generate script only:
  node scripts/main_pipeline.js script input/chemistry/chemical_reactions.md "acids_bases"

- Complete workflow (script + video):
  node scripts/main_pipeline.js complete input/chemistry/chemical_reactions.md "acids_bases"

- Generate video from existing script:
  node scripts/main_pipeline.js video output/chemistry/acids_bases/generated_script.js

- List available input files:
  node scripts/main_pipeline.js list [subject]

EXAMPLES:
  node scripts/main_pipeline.js script input/chemistry/chemical_reactions.md
  node scripts/visual_preview_tool.js output/chemistry/chemical_reactions/generated_script.js
  node scripts/direct_script_video_generator.js output/chemistry/chemical_reactions/generated_script.js

🎯 This workflow eliminates redundant JSON files and works directly with JavaScript!
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
        console.log(`📝 Generating script from: ${inputFile}`);
        const scriptResult = await pipeline.generateScriptOnly(inputFile, { videoName: outputName });
        break;

      case 'video':
        if (!inputFile) {
          throw new Error('Script file required for video command');
        }
        console.log(`🎬 Generating video from script: ${inputFile}`);
        const videoPath = await pipeline.generateVideoFromScript(inputFile, { videoName: outputName });
        break;

      case 'complete':
        if (!inputFile) {
          throw new Error('Input file required for complete command');
        }
        console.log(`🚀 Running complete workflow from: ${inputFile}`);
        const completeResult = await pipeline.generateComplete(inputFile, { videoName: outputName });
        break;

      case 'list':
        pipeline.listInputFiles(inputFile);
        break;

      default:
        throw new Error(`Unknown command: ${command}. Use: script, video, complete, or list`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Run without arguments to see usage help');
    process.exit(1);
  }
}

// Export for use as module
module.exports = SimplifiedVideoPipeline;

// Run if called directly
if (require.main === module) {
  main();
}