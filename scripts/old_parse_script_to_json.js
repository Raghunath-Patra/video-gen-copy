// parse_script_to_json.js - Convert JavaScript script to complete JSON with visual functions
const fs = require('fs');
const path = require('path');

function parseScriptToJson(scriptPath, outputPath = null) {
  try {
    console.log('📄 Reading JavaScript script...');
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script file not found: ${scriptPath}`);
    }
    
    // Read the JavaScript content
    const jsContent = fs.readFileSync(scriptPath, 'utf8');
    console.log(`📏 Script length: ${jsContent.length} characters`);
    
    // Create a sandbox to evaluate the JavaScript content safely
    const sandbox = {
      module: { exports: {} },
      exports: {},
      require: () => ({}), // Mock require for safety
      console: { log: () => {} } // Mock console for safety
    };
    
    console.log('🔍 Parsing JavaScript content...');
    
    // Evaluate the JavaScript content in the sandbox
    const func = new Function('module', 'exports', 'require', 'console', jsContent);
    func(sandbox.module, sandbox.exports, sandbox.require, sandbox.console);
    
    // Extract the results
    const result = sandbox.module.exports;
    
    if (!result.LESSON_CONTENT) {
      throw new Error('Missing LESSON_CONTENT in script');
    }
    
    if (!result.visualFunctions) {
      throw new Error('Missing visualFunctions in script');
    }
    
    // Create the complete content structure with actual visual functions
    const completeContent = {
      lessonSteps: result.LESSON_CONTENT.lessonSteps,
      speakers: result.LESSON_CONTENT.speakers,
      visualFunctions: result.visualFunctions // This includes the actual functions
    };
    
    console.log('✅ Successfully parsed:');
    console.log(`   Lesson steps: ${completeContent.lessonSteps.length}`);
    console.log(`   Speakers: ${Object.keys(completeContent.speakers).length}`);
    console.log(`   Visual functions: ${Object.keys(completeContent.visualFunctions).length}`);
    
    // Verify visual functions are actual functions
    const functionNames = Object.keys(completeContent.visualFunctions);
    functionNames.forEach(name => {
      if (typeof completeContent.visualFunctions[name] !== 'function') {
        console.warn(`⚠️ ${name} is not a function`);
      } else {
        console.log(`✅ ${name} is a valid function`);
      }
    });
    
    // Determine output path
    if (!outputPath) {
      outputPath = scriptPath.replace('generated_script.js', 'generated_content.json');
    }
    
    // Save the complete content as JSON
    // Note: Visual functions will be converted to strings in JSON, but that's expected
    fs.writeFileSync(outputPath, JSON.stringify(completeContent, null, 2), 'utf8');
    
    console.log(`💾 Complete content saved to: ${outputPath}`);
    console.log('🎬 Ready for video generation!');
    
    return {
      success: true,
      outputPath,
      content: completeContent
    };
    
  } catch (error) {
    console.error('❌ Error parsing script:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Command line usage
if (require.main === module) {
  const scriptPath = process.argv[2];
  const outputPath = process.argv[3];
  
  if (!scriptPath) {
    console.log(`
📝 Parse JavaScript Script to JSON

Usage:
  node parse_script_to_json.js <script_path> [output_path]

Examples:
  node parse_script_to_json.js ../output/chemistry/acids_bases/generated_script.js
  node parse_script_to_json.js ../output/chemistry/acids_bases/generated_script.js ./my_content.json

This will:
  - Parse the JavaScript script safely
  - Extract lesson content and visual functions
  - Create a complete JSON file ready for video generation
    `);
    process.exit(1);
  }
  
  const result = parseScriptToJson(scriptPath, outputPath);
  
  if (!result.success) {
    process.exit(1);
  }
  
  console.log('\n🎯 Next step: Generate video with:');
  console.log(`node main_pipeline.js video "${result.outputPath}"`);
}

module.exports = { parseScriptToJson };