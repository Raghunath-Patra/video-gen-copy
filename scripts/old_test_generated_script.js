// test_generated_script.js - Test the generated JavaScript content
const fs = require('fs');
const path = require('path');

function testGeneratedScript(scriptPath) {
  try {
    console.log('🧪 Testing generated script...');
    console.log(`📄 Script file: ${scriptPath}`);
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script file not found: ${scriptPath}`);
    }
    
    // Read the generated JavaScript content
    const jsContent = fs.readFileSync(scriptPath, 'utf8');
    console.log(`📏 Script length: ${jsContent.length} characters`);
    
    // Create a sandbox to evaluate the JavaScript content
    const sandbox = {
      module: { exports: {} },
      exports: {},
      require: () => ({}), // Mock require for safety
      console: { log: () => {} } // Mock console for safety
    };
    
    // Evaluate the JavaScript content in the sandbox
    console.log('🔍 Parsing JavaScript content...');
    const func = new Function('module', 'exports', 'require', 'console', jsContent);
    func(sandbox.module, sandbox.exports, sandbox.require, sandbox.console);
    
    // Extract the lesson content and visual functions
    const result = sandbox.module.exports;
    
    if (!result.LESSON_CONTENT) {
      throw new Error('Missing LESSON_CONTENT in generated script');
    }
    
    if (!result.visualFunctions) {
      throw new Error('Missing visualFunctions in generated script');
    }
    
    // Validate lesson content structure
    const lessonContent = result.LESSON_CONTENT;
    console.log(`✅ Found LESSON_CONTENT with ${lessonContent.lessonSteps?.length || 0} steps`);
    
    // Validate speakers
    if (lessonContent.speakers) {
      const speakers = Object.keys(lessonContent.speakers);
      console.log(`👥 Speakers: ${speakers.join(', ')}`);
    }
    
    // Validate visual functions
    const visualFunctions = Object.keys(result.visualFunctions);
    console.log(`🎨 Visual functions: ${visualFunctions.join(', ')}`);
    
    // Test that visual functions are actual functions
    let functionsValid = true;
    visualFunctions.forEach(funcName => {
      if (typeof result.visualFunctions[funcName] !== 'function') {
        console.error(`❌ ${funcName} is not a function`);
        functionsValid = false;
      } else {
        console.log(`✅ ${funcName} is a valid function`);
      }
    });
    
    // Validate lesson steps
    if (lessonContent.lessonSteps && Array.isArray(lessonContent.lessonSteps)) {
      console.log('\n📝 Lesson Steps Validation:');
      
      lessonContent.lessonSteps.forEach((step, index) => {
        const stepNum = index + 1;
        
        // Check required fields
        if (!step.speaker) console.error(`❌ Step ${stepNum}: Missing speaker`);
        if (!step.title) console.error(`❌ Step ${stepNum}: Missing title`);
        if (!step.narration) console.error(`❌ Step ${stepNum}: Missing narration`);
        if (!step.visualDuration) console.error(`❌ Step ${stepNum}: Missing visualDuration`);
        
        // Check visual function references
        if (step.visual && step.visual.type) {
          if (!result.visualFunctions[step.visual.type]) {
            console.error(`❌ Step ${stepNum}: Visual function '${step.visual.type}' not found`);
          } else {
            console.log(`✅ Step ${stepNum}: Visual function '${step.visual.type}' exists`);
          }
        }
        
        // Show step summary
        console.log(`   ${stepNum}. [${step.speaker}] ${step.title} (${step.visualDuration}s)`);
      });
    }
    
    // Create the final parsed content structure
    const parsedContent = {
      lessonSteps: lessonContent.lessonSteps,
      speakers: lessonContent.speakers,
      visualFunctions: result.visualFunctions
    };
    
    console.log('\n🎉 Script validation successful!');
    console.log('📊 Summary:');
    console.log(`   Lesson steps: ${parsedContent.lessonSteps.length}`);
    console.log(`   Speakers: ${Object.keys(parsedContent.speakers).length}`);
    console.log(`   Visual functions: ${Object.keys(parsedContent.visualFunctions).length}`);
    console.log(`   Functions valid: ${functionsValid ? 'Yes' : 'No'}`);
    
    return {
      success: true,
      parsedContent,
      functionsValid
    };
    
  } catch (error) {
    console.error('❌ Script validation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Command line usage
if (require.main === module) {
  const scriptPath = process.argv[2];
  
  if (!scriptPath) {
    console.log('Usage: node test_generated_script.js <path_to_generated_script.js>');
    process.exit(1);
  }
  
  const result = testGeneratedScript(scriptPath);
  
  if (!result.success) {
    process.exit(1);
  }
}

module.exports = { testGeneratedScript };