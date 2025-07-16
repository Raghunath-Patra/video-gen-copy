// enhanced_content_generator.js - Better visual function handling
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class EnhancedContentGenerator {
  constructor() {
    this.exampleInputPath = '/Users/rajshekhar.bhat/int_video/input/split_chapters/cbse/x/jesc1dd/jesc101/01_introduction_chunknown.md';
    this.exampleOutputPath = '/Users/rajshekhar.bhat/int_video/examples/example_dynamic_content.json';
  }

  readFileContent(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      return fs.readFileSync(filePath, 'utf8').trim();
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      throw error;
    }
  }

  // Create example content structure with JavaScript-style visual functions
  createExampleOutput() {
    return `
// LESSON CONTENT - Educational video script and visual functions
const LESSON_CONTENT = {
  lessonSteps: [
    {
      speaker: "teacher",
      title: "Understanding Acids and Bases",
      content: "Chemical Properties of Acids and Bases",
      content2: "Laboratory Testing Methods",
      narration: "Hello students! I'm Professor Priya. Today we're exploring the fascinating world of acids and bases.",
      visualDuration: 5,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Activity 2.1: Testing with Indicators",
      content: "Red litmus • Blue litmus",
      content2: "Phenolphthalein • Methyl orange",
      visual: {
        type: "drawIndicatorTest",
        params: ["HCl"]
      },
      narration: "Let's test hydrochloric acid with our four indicators and observe the color changes.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "Observation Results",
      content: "Blue litmus turns red!",
      content2: "What does this mean?",
      narration: "I can see the blue litmus paper turning red! What does this tell us about HCl?",
      visualDuration: 4,
      isComplex: false
    }
  ],

  speakers: {
    teacher: { voice: 'aditi', model: 'lightning-v2', name: 'Prof. Priya', color: '#1a5276', gender: 'female' },
    student1: { voice: 'nikita', model: 'lightning-v2', name: 'Sneha', color: '#a9dfbf', gender: 'female' },
    student2: { voice: 'lakshya', model: 'lightning-v2', name: 'Arjun', color: '#f39c12', gender: 'male' }
  }
};

// VISUAL FUNCTIONS - Canvas drawing code for educational diagrams
function drawIndicatorTest(ctx, testSubstance) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  // Clear the drawing area
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Draw four test tubes representing different indicators
  const tubeWidth = 40;
  const tubeHeight = 120;
  const spacing = 80;
  
  // Test tube positions
  const tubes = [
    { x: centerX - 120, label: 'Red Litmus', color: testSubstance === 'HCl' ? '#ff4757' : '#ff4757' },
    { x: centerX - 40, label: 'Blue Litmus', color: testSubstance === 'HCl' ? '#ff4757' : '#3742fa' },
    { x: centerX + 40, label: 'Phenolphthalein', color: testSubstance === 'HCl' ? '#ffffff' : '#ff69b4' },
    { x: centerX + 120, label: 'Methyl Orange', color: testSubstance === 'HCl' ? '#ff4757' : '#ffa502' }
  ];
  
  tubes.forEach(tube => {
    // Draw test tube outline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(tube.x - tubeWidth/2, centerY - tubeHeight/2, tubeWidth, tubeHeight);
    
    // Fill with indicator color
    ctx.fillStyle = tube.color;
    ctx.fillRect(tube.x - tubeWidth/2 + 2, centerY - tubeHeight/2 + 2, tubeWidth - 4, tubeHeight - 4);
    
    // Add label
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tube.label, tube.x, centerY + tubeHeight/2 + 20);
  });
  
  // Add title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(\`Testing \${testSubstance} with Indicators\`, centerX, LAYOUT_MEDIA.y + 30);
  
  ctx.restore();
}

function drawAcidBaseComparison(ctx) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  // Background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Draw comparison table
  ctx.fillStyle = '#000';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('ACIDS vs BASES', centerX, LAYOUT_MEDIA.y + 40);
  
  // Acid side
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('ACIDS', LAYOUT_MEDIA.x + 50, centerY - 80);
  
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('• Turn blue litmus RED', LAYOUT_MEDIA.x + 50, centerY - 60);
  ctx.fillText('• Keep red litmus unchanged', LAYOUT_MEDIA.x + 50, centerY - 40);
  ctx.fillText('• Colorless with phenolphthalein', LAYOUT_MEDIA.x + 50, centerY - 20);
  ctx.fillText('• Turn methyl orange RED', LAYOUT_MEDIA.x + 50, centerY);
  
  // Base side
  ctx.fillStyle = '#3498db';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('BASES', centerX + 50, centerY - 80);
  
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('• Turn red litmus BLUE', centerX + 50, centerY - 60);
  ctx.fillText('• Keep blue litmus unchanged', centerX + 50, centerY - 40);
  ctx.fillText('• Turn phenolphthalein PINK', centerX + 50, centerY - 20);
  ctx.fillText('• Turn methyl orange YELLOW', centerX + 50, centerY);
  
  ctx.restore();
}

function drawOlfactoryIndicators(ctx, indicatorType) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f0f8f0';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Draw title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Olfactory Indicators', centerX, LAYOUT_MEDIA.y + 40);
  
  if (indicatorType === 'onion') {
    // Draw onion
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.ellipse(centerX - 100, centerY, 30, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Onion layers
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(centerX - 100, centerY, 25, 35, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Onion', centerX - 100, centerY + 60);
  }
  
  // Draw test results
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(centerX + 20, centerY - 40, 60, 30);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Acid', centerX + 50, centerY - 20);
  ctx.fillText('Smell retained', centerX + 50, centerY - 5);
  
  ctx.fillStyle = '#3498db';
  ctx.fillRect(centerX + 20, centerY + 20, 60, 30);
  ctx.fillStyle = '#fff';
  ctx.fillText('Base', centerX + 50, centerY + 40);
  ctx.fillText('Smell destroyed', centerX + 50, centerY + 55);
  
  ctx.restore();
}

// Export the lesson content and visual functions
module.exports = {
  LESSON_CONTENT,
  visualFunctions: {
    drawIndicatorTest,
    drawAcidBaseComparison,
    drawOlfactoryIndicators
  }
};`;
  }

  async generateDynamicContent(inputContent) {
    try {
      console.log('🤖 Generating dynamic content with LLM...');
      
      // Create example for the LLM
      const exampleOutput = this.createExampleOutput();
      
      const prompt = `You are an expert educational video content generator. Create dynamic content for an educational video based on the input text.

INPUT CONTENT:
${inputContent}

REQUIREMENTS:
1. Generate a complete lesson step array with natural teacher-student conversations
2. Create appropriate visual functions using HTML5 Canvas drawing commands
3. Include proper speaker alternation and timing
4. Generate chemical equations where relevant
5. Create engaging dialogues that explain concepts clearly

IMPORTANT: Output the content in JavaScript module format, NOT JSON. Follow this exact structure:

${exampleOutput}

VISUAL FUNCTION GUIDELINES:
- Write actual JavaScript functions, not JSON strings
- Use HTML5 Canvas drawing commands (ctx.beginPath, ctx.arc, ctx.lineTo, etc.)
- Functions should accept (ctx, ...params) as parameters
- Ensure all drawing coordinates fit within the media area: x: 200, y: 200, width: 600, height: 400
- Plan visual layouts to avoid overlapping elements
- Create step-by-step visual progressions for experiments
- Use appropriate colors and styling for educational content

CONVERSATION GUIDELINES:
- Start with teacher introduction
- Include natural student questions and reactions
- Alternate speakers appropriately
- End with summary and preview of next topic
- Use appropriate visual durations (3-7 seconds typically)
- Mark complex slides with isComplex: true

OUTPUT FORMAT:
Return the complete JavaScript module code with LESSON_CONTENT object and visual functions. 
Do NOT wrap in markdown code blocks - return plain JavaScript code that can be directly executed.

Generate the content:`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 32000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      let generatedContent = message.content[0].text;
      
      // Clean up the response - remove any markdown formatting
      generatedContent = generatedContent.trim();
      if (generatedContent.startsWith('```javascript')) {
        generatedContent = generatedContent.replace(/^```javascript\n/, '').replace(/\n```$/, '');
      } else if (generatedContent.startsWith('```')) {
        generatedContent = generatedContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      console.log('✅ Dynamic content generated successfully');
      return generatedContent;
      
    } catch (error) {
      console.error('❌ Error generating dynamic content:', error);
      throw error;
    }
  }

  // Parse the generated JavaScript content to extract lesson steps and visual functions
  parseGeneratedContent(jsContent) {
    try {
      // Create a sandbox to evaluate the JavaScript content
      const sandbox = {
        module: { exports: {} },
        exports: {},
        require: () => ({}), // Mock require for safety
        console: { log: () => {} } // Mock console for safety
      };
      
      // Evaluate the JavaScript content in the sandbox
      const func = new Function('module', 'exports', 'require', 'console', jsContent);
      func(sandbox.module, sandbox.exports, sandbox.require, sandbox.console);
      
      // Extract the lesson content and visual functions
      const result = sandbox.module.exports;
      
      if (!result.LESSON_CONTENT || !result.visualFunctions) {
        throw new Error('Generated content missing LESSON_CONTENT or visualFunctions');
      }
      
      // Convert back to the expected format for the video generator
      const parsedContent = {
        lessonSteps: result.LESSON_CONTENT.lessonSteps,
        speakers: result.LESSON_CONTENT.speakers,
        visualFunctions: result.visualFunctions
      };
      
      // Validate the structure
      this.validateContent(parsedContent);
      
      return parsedContent;
      
    } catch (error) {
      console.error('❌ Error parsing generated JavaScript content:', error);
      throw new Error(`Failed to parse generated content: ${error.message}`);
    }
  }

  validateContent(content) {
    // Basic validation
    if (!content.lessonSteps || !Array.isArray(content.lessonSteps)) {
      throw new Error('Invalid content: lessonSteps must be an array');
    }
    
    if (content.lessonSteps.length === 0) {
      throw new Error('Invalid content: lessonSteps cannot be empty');
    }
    
    // Validate each lesson step
    content.lessonSteps.forEach((step, index) => {
      if (!step.speaker || !step.title || !step.narration) {
        throw new Error(`Invalid lesson step ${index}: missing required fields`);
      }
      
      if (!['teacher', 'student1', 'student2'].includes(step.speaker)) {
        throw new Error(`Invalid lesson step ${index}: invalid speaker "${step.speaker}"`);
      }
      
      if (typeof step.visualDuration !== 'number' || step.visualDuration <= 0) {
        throw new Error(`Invalid lesson step ${index}: visualDuration must be a positive number`);
      }
    });
    
    // Validate visual functions
    if (content.visualFunctions) {
      Object.keys(content.visualFunctions).forEach(functionName => {
        if (typeof content.visualFunctions[functionName] !== 'function') {
          throw new Error(`Invalid visual function '${functionName}': must be a function`);
        }
      });
    }
    
    console.log('✅ Content validation passed');
  }

  saveContent(content, filename) {
    try {
      const outputPath = filename || `dynamic_content_${Date.now()}.json`;
      fs.writeFileSync(outputPath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`💾 Dynamic content saved to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('❌ Error saving content:', error);
      throw error;
    }
  }

  // Enhanced method that handles both generation and parsing
  async generateAndParseContent(inputContent) {
    try {
      console.log('🎯 Starting enhanced content generation...');
      
      // Generate the JavaScript content
      const jsContent = await this.generateDynamicContent(inputContent);
      
      // Parse it into the expected format
      const parsedContent = this.parseGeneratedContent(jsContent);
      
      console.log('✅ Content generation and parsing completed successfully');
      return parsedContent;
      
    } catch (error) {
      console.error('❌ Error in enhanced content generation:', error);
      throw error;
    }
  }

  loadContent(filename) {
    try {
      const content = JSON.parse(fs.readFileSync(filename, 'utf8'));
      this.validateContent(content);
      return content;
    } catch (error) {
      console.error('❌ Error loading content:', error);
      throw error;
    }
  }
}

module.exports = EnhancedContentGenerator;