// LESSON CONTENT - Educational video script and visual functions
const LESSON_CONTENT = {
  lessonSteps: [
    {
      speaker: "teacher",
      title: "Metal Carbonates and Acids",
      content: "How do Metal Carbonates React with Acids?",
      content2: "Activity 2.5: Laboratory Investigation",
      narration: "Hello students! I'm Professor Priya. Today we're going to explore a fascinating reaction between metal carbonates and acids. Let's conduct Activity 2.5 to see what happens!",
      visualDuration: 5,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Setting Up the Experiment",
      content: "Test Tube A: Na₂CO₃ + HCl",
      content2: "Test Tube B: NaHCO₃ + HCl",
      visual: {
        type: "drawExperimentSetup",
        params: ["setup"]
      },
      narration: "We'll take two test tubes. In tube A, we'll add sodium carbonate. In tube B, we'll add sodium hydrogencarbonate. Then we'll add dilute hydrochloric acid to both.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "What Should We Observe?",
      content: "Will both tubes react the same way?",
      content2: "What gas might be produced?",
      narration: "Professor, will both test tubes show the same reaction? And what kind of gas do you think will be produced?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Observing the Reaction",
      content: "Brisk Effervescence!",
      content2: "Gas bubbles forming rapidly",
      visual: {
        type: "drawEffervescence",
        params: ["both"]
      },
      narration: "Excellent question! Watch carefully - both test tubes show brisk effervescence. That means gas bubbles are forming rapidly. This indicates a chemical reaction is taking place.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student2",
      title: "Identifying the Gas",
      content: "How can we identify this gas?",
      content2: "Is there a test we can do?",
      narration: "The bubbling looks exciting! But how can we identify what gas is being produced? Is there a specific test we can perform?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Testing with Lime Water",
      content: "Pass gas through Ca(OH)₂ solution",
      content2: "Lime water test for CO₂",
      visual: {
        type: "drawLimeWaterTest",
        params: ["clear"]
      },
      narration: "Great thinking! We'll pass the gas through lime water - that's calcium hydroxide solution. This is a classic test for carbon dioxide gas.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "Amazing Results!",
      content: "The lime water turned milky!",
      content2: "What does this mean?",
      narration: "Wow! The lime water has turned milky white! This is so cool - what exactly does this milky appearance tell us?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Lime Water Turns Milky",
      content: "CO₂ + Ca(OH)₂ → CaCO₃ + H₂O",
      content2: "White precipitate formation",
      visual: {
        type: "drawLimeWaterTest",
        params: ["milky"]
      },
      narration: "The milky appearance confirms our gas is carbon dioxide! When CO₂ reacts with calcium hydroxide, it forms insoluble calcium carbonate - that's the white precipitate we see.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "teacher",
      title: "Chemical Equations",
      content: "Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂",
      content2: "NaHCO₃ + HCl → NaCl + H₂O + CO₂",
      visual: {
        type: "drawChemicalEquations",
        params: ["reactions"]
      },
      narration: "Let's write the chemical equations. Sodium carbonate plus hydrochloric acid gives sodium chloride, water, and carbon dioxide. Similarly for sodium hydrogencarbonate.",
      visualDuration: 7,
      isComplex: true
    },
    {
      speaker: "student2",
      title: "Excess Carbon Dioxide",
      content: "What if we pass too much CO₂?",
      content2: "Will the milkiness remain?",
      narration: "I'm curious - what would happen if we kept passing carbon dioxide through the lime water for a long time? Would it stay milky forever?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Excess CO₂ Effect",
      content: "CaCO₃ + H₂O + CO₂ → Ca(HCO₃)₂",
      content2: "Milkiness disappears!",
      visual: {
        type: "drawExcessCO2",
        params: ["clear_again"]
      },
      narration: "Excellent observation! With excess CO₂, the white precipitate dissolves forming soluble calcium hydrogencarbonate. The milkiness actually disappears!",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "teacher",
      title: "Real-World Examples",
      content: "Limestone • Chalk • Marble",
      content2: "All are forms of CaCO₃",
      visual: {
        type: "drawRealWorldExamples",
        params: ["carbonates"]
      },
      narration: "This reaction is very important in nature! Limestone, chalk, and marble are all different forms of calcium carbonate. They all react with acids in the same way.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "General Pattern",
      content: "Is there a general rule?",
      content2: "Do all carbonates react similarly?",
      narration: "So professor, is there a general pattern here? Do all metal carbonates and hydrogencarbonates react with acids in the same way?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "General Reaction Pattern",
      content: "Metal Carbonate + Acid → Salt + CO₂ + H₂O",
      content2: "Universal reaction for all carbonates",
      visual: {
        type: "drawGeneralPattern",
        params: ["formula"]
      },
      narration: "Absolutely! All metal carbonates and hydrogencarbonates follow this pattern: they react with acids to produce a salt, carbon dioxide gas, and water. This is a fundamental reaction in chemistry!",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "teacher",
      title: "Key Learnings",
      content: "• CO₂ gas evolution • Lime water test",
      content2: "• Universal reaction pattern",
      narration: "Let's summarize our key learnings: metal carbonates react with acids producing CO₂ gas, we can test for CO₂ using lime water, and this follows a universal pattern for all carbonates.",
      visualDuration: 5,
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
function drawExperimentSetup(ctx, stage) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  // Background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Draw title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Activity 2.5: Metal Carbonates + Acids', centerX, LAYOUT_MEDIA.y + 40);
  
  // Test tube A
  const tubeWidth = 40;
  const tubeHeight = 120;
  
  // Test tube A
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - 120, centerY - 60, tubeWidth, tubeHeight);
  
  // Add Na2CO3 powder
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(centerX - 118, centerY + 40, 36, 18);
  
  // Test tube B
  ctx.strokeRect(centerX + 80, centerY - 60, tubeWidth, tubeHeight);
  
  // Add NaHCO3 powder
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(centerX + 82, centerY + 40, 36, 18);
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Test Tube A', centerX - 100, centerY + 90);
  ctx.fillText('Na₂CO₃', centerX - 100, centerY + 105);
  
  ctx.fillText('Test Tube B', centerX + 100, centerY + 90);
  ctx.fillText('NaHCO₃', centerX + 100, centerY + 105);
  
  // HCl bottle
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(centerX - 20, centerY - 100, 40, 60);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.fillText('HCl', centerX, centerY - 65);
  
  // Arrows showing addition
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 40, centerY - 50);
  ctx.lineTo(centerX - 90, centerY - 20);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX + 40, centerY - 50);
  ctx.lineTo(centerX + 90, centerY - 20);
  ctx.stroke();
  
  ctx.restore();
}

function drawEffervescence(ctx, intensity) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f0f8ff';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Brisk Effervescence Observed!', centerX, LAYOUT_MEDIA.y + 40);
  
  // Test tubes with reactions
  const tubeWidth = 40;
  const tubeHeight = 120;
  
  // Test tube A
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - 120, centerY - 60, tubeWidth, tubeHeight);
  
  // Reaction mixture
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(centerX - 118, centerY + 20, 36, 38);
  
  // Gas bubbles
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 8; i++) {
    const bubbleX = centerX - 110 + Math.random() * 20;
    const bubbleY = centerY + 20 - Math.random() * 60;
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, 2 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Test tube B
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX + 80, centerY - 60, tubeWidth, tubeHeight);
  
  // Reaction mixture
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(centerX + 82, centerY + 20, 36, 38);
  
  // Gas bubbles
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 8; i++) {
    const bubbleX = centerX + 90 + Math.random() * 20;
    const bubbleY = centerY + 20 - Math.random() * 60;
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, 2 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CO₂ gas bubbles', centerX - 100, centerY + 90);
  ctx.fillText('CO₂ gas bubbles', centerX + 100, centerY + 90);
  
  // Effervescence indicator
  ctx.fillStyle = '#e74c3c';
  ctx.font = '14px Arial';
  ctx.fillText('Fizzing!', centerX - 100, centerY - 80);
  ctx.fillText('Fizzing!', centerX + 100, centerY - 80);
  
  ctx.restore();
}

function drawLimeWaterTest(ctx, state) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Testing Gas with Lime Water', centerX, LAYOUT_MEDIA.y + 40);
  
  // Reaction test tube
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - 150, centerY - 60, 40, 120);
  
  // Reaction mixture
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(centerX - 148, centerY + 20, 36, 38);
  
  // Delivery tube
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 110, centerY - 30);
  ctx.lineTo(centerX - 50, centerY - 30);
  ctx.lineTo(centerX - 50, centerY + 20);
  ctx.stroke();
  
  // Lime water test tube
  ctx.strokeRect(centerX - 80, centerY, 50, 100);
  
  // Lime water
  if (state === 'clear') {
    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(centerX - 78, centerY + 40, 46, 58);
  } else {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(centerX - 78, centerY + 40, 46, 58);
  }
  
  // Gas bubbles in lime water
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) {
    const bubbleX = centerX - 65 + Math.random() * 20;
    const bubbleY = centerY + 50 + Math.random() * 30;
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CO₂ gas', centerX - 130, centerY + 120);
  ctx.fillText('Ca(OH)₂', centerX - 55, centerY + 120);
  
  if (state === 'milky') {
    ctx.fillStyle = '#e74c3c';
    ctx.font = '14px Arial';
    ctx.fillText('Turns Milky!', centerX - 55, centerY + 140);
  }
  
  // Arrow showing gas flow
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 90, centerY - 30);
  ctx.lineTo(centerX - 70, centerY - 30);
  ctx.stroke();
  
  ctx.restore();
}

function drawChemicalEquations(ctx, type) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Chemical Equations', centerX, LAYOUT_MEDIA.y + 40);
  
  // Test tube A reaction
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Test Tube A:', LAYOUT_MEDIA.x + 50, centerY - 60);
  
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('Na₂CO₃(s) + 2HCl(aq) → 2NaCl(aq) + H₂O(l) + CO₂(g)', LAYOUT_MEDIA.x + 50, centerY - 40);
  
  // Test tube B reaction
  ctx.fillStyle = '#3498db';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Test Tube B:', LAYOUT_MEDIA.x + 50, centerY - 10);
  
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('NaHCO₃(s) + HCl(aq) → NaCl(aq) + H₂O(l) + CO₂(g)', LAYOUT_MEDIA.x + 50, centerY + 10);
  
  // Lime water test
  ctx.fillStyle = '#27ae60';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Lime Water Test:', LAYOUT_MEDIA.x + 50, centerY + 40);
  
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('Ca(OH)₂(aq) + CO₂(g) → CaCO₃(s) + H₂O(l)', LAYOUT_MEDIA.x + 50, centerY + 60);
  ctx.fillText('(Lime water)                    (White precipitate)', LAYOUT_MEDIA.x + 50, centerY + 75);
  
  // Visual indicators
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.arc(LAYOUT_MEDIA.x + 30, centerY - 60, 8, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#4ecdc4';
  ctx.beginPath();
  ctx.arc(LAYOUT_MEDIA.x + 30, centerY - 10, 8, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#45b7d1';
  ctx.beginPath();
  ctx.arc(LAYOUT_MEDIA.x + 30, centerY + 40, 8, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawExcessCO2(ctx, state) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Effect of Excess CO₂', centerX, LAYOUT_MEDIA.y + 40);
  
  // Test tube with lime water
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - 25, centerY - 60, 50, 120);
  
  // Lime water - clear again
  ctx.fillStyle = '#f0f8ff';
  ctx.fillRect(centerX - 23, centerY + 20, 46, 38);
  
  // Equation
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CaCO₃(s) + H₂O(l) + CO₂(g) → Ca(HCO₃)₂(aq)', centerX, centerY + 100);
  ctx.fillText('(Precipitate dissolves - milkiness disappears)', centerX, centerY + 120);
  
  // Arrow showing process
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 100, centerY - 30);
  ctx.lineTo(centerX - 50, centerY - 30);
  ctx.stroke();
  
  ctx.fillStyle = '#e74c3c';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Excess CO₂', centerX - 125, centerY - 30);
  
  ctx.fillStyle = '#27ae60';
  ctx.fillText('Clear again!', centerX + 80, centerY);
  
  ctx.restore();
}

function drawRealWorldExamples(ctx, type) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Real-World Examples of CaCO₃', centerX, LAYOUT_MEDIA.y + 40);
  
  // Limestone
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(centerX - 150, centerY - 40, 60, 80);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Limestone', centerX - 120, centerY + 60);
  
  // Chalk
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(centerX - 30, centerY - 20, 60, 40);
  ctx.fillStyle = '#000';
  ctx.fillText('Chalk', centerX, centerY + 40);
  
  // Marble
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(centerX + 90, centerY - 50, 60, 90);
  ctx.fillStyle = '#000';
  ctx.fillText('Marble', centerX + 120, centerY + 60);
  
  // Chemical formula
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('All contain CaCO₃', centerX, centerY + 100);
  
  // Reaction arrows
  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const x = centerX - 120 + i * 120;
    ctx.beginPath();
    ctx.moveTo(x, centerY + 80);
    ctx.lineTo(x, centerY + 100);
    ctx.stroke();
  }
  
  ctx.fillStyle = '#27ae60';
  ctx.font = '12px Arial';
  ctx.fillText('+ Acid → Salt + CO₂ + H₂O', centerX, centerY + 130);
  
  ctx.restore();
}

function drawGeneralPattern(ctx, type) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f0f8ff';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('General Reaction Pattern', centerX, LAYOUT_MEDIA.y + 50);
  
  // Main equation box
  ctx.fillStyle = '#e8f5e8';
  ctx.fillRect(centerX - 250, centerY - 40, 500, 80);
  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 3;
  ctx.strokeRect(centerX - 250, centerY - 40, 500, 80);
  
  // General equation
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Metal Carbonate + Acid → Salt + Carbon dioxide + Water', centerX, centerY - 10);
  ctx.fillText('OR', centerX, centerY + 10);
  ctx.fillText('Metal Hydrogencarbonate + Acid → Salt + CO₂ + H₂O', centerX, centerY + 30);
  
  // Examples
  ctx.fillStyle = '#3498db';
  ctx.font = '14px Arial';
  ctx.fillText('Examples:', centerX, centerY + 80);
  
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('• CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂', centerX, centerY + 100);
  ctx.fillText('• MgCO₃ + 2HCl → MgCl₂ + H₂O + CO₂', centerX, centerY + 120);
  ctx.fillText('• KHCO₃ + HCl → KCl + H₂O + CO₂', centerX, centerY + 140);
  
  // Key points
  ctx.fillStyle = '#e74c3c';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Key Points:', LAYOUT_MEDIA.x + 50, centerY + 180);
  ctx.fillText('• Always produces CO₂ gas', LAYOUT_MEDIA.x + 70, centerY + 200);
  ctx.fillText('• Test CO₂ with lime water', LAYOUT_MEDIA.x + 70, centerY + 220);
  ctx.fillText('• Universal pattern for all carbonates', LAYOUT_MEDIA.x + 70, centerY + 240);
  
  ctx.restore();
}

// Export the lesson content and visual functions
module.exports = {
  LESSON_CONTENT,
  visualFunctions: {
    drawExperimentSetup,
    drawEffervescence,
    drawLimeWaterTest,
    drawChemicalEquations,
    drawExcessCO2,
    drawRealWorldExamples,
    drawGeneralPattern
  }
};