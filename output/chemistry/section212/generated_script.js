// LESSON CONTENT - Educational video script and visual functions
const LESSON_CONTENT = {
  lessonSteps: [
    {
      speaker: "teacher",
      title: "Acids and Bases with Metals",
      content: "Chemical Reactions and Gas Evolution",
      content2: "Laboratory Investigation Methods",
      narration: "Hello students! I'm Professor Priya. Today we're going to explore how acids and bases react with metals through exciting laboratory experiments.",
      visualDuration: 5,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Activity 2.3 Setup",
      content: "Safety First - Teacher Assistance Required",
      content2: "Dilute Sulphuric Acid + Zinc Granules",
      visual: {
        type: "drawExperimentSetup",
        params: ["zinc_acid"]
      },
      narration: "Let's set up our first experiment. We'll use dilute sulphuric acid and zinc granules. Notice the safety apparatus - this requires careful handling.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "Initial Observations",
      content: "What's happening to the zinc?",
      content2: "Are those bubbles forming?",
      narration: "Professor, I can see bubbles forming on the surface of the zinc granules! What's causing this reaction?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Gas Evolution Process",
      content: "Hydrogen Gas Production",
      content2: "Acid + Metal → Salt + Hydrogen",
      visual: {
        type: "drawGasEvolution",
        params: ["H2SO4", "Zn"]
      },
      narration: "Excellent observation, Sneha! The bubbles are hydrogen gas being produced. The zinc is displacing hydrogen from the acid.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student2",
      title: "Testing the Gas",
      content: "Why pass it through soap solution?",
      content2: "What will the bubbles tell us?",
      narration: "Professor, why are we passing the gas through soap solution? How will this help us identify the gas?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Soap Solution Test",
      content: "Capturing Gas in Bubbles",
      content2: "Preparing for Identification Test",
      visual: {
        type: "drawSoapTest",
        params: ["hydrogen"]
      },
      narration: "Great question, Arjun! The soap solution captures the gas in bubbles, making it easier to test. Now let's bring a burning candle near the bubble.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "The Pop Test",
      content: "Pop sound heard!",
      content2: "What does this confirm?",
      narration: "Wow! There's a distinct 'pop' sound when the candle touches the bubble! This must be the hydrogen gas test, right?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Hydrogen Identification",
      content: "Characteristic 'Pop' Sound",
      content2: "Confirms H₂ Gas Evolution",
      visual: {
        type: "drawPopTest",
        params: ["positive"]
      },
      narration: "Absolutely correct! The pop sound is the characteristic test for hydrogen gas. This confirms our gas is indeed hydrogen.",
      visualDuration: 5,
      isComplex: true
    },
    {
      speaker: "teacher",
      title: "Chemical Equation",
      content: "Zn + H₂SO₄ → ZnSO₄ + H₂",
      content2: "Metal + Acid → Salt + Hydrogen",
      visual: {
        type: "drawChemicalEquation",
        params: ["Zn", "H2SO4", "ZnSO4", "H2"]
      },
      narration: "Let's write the chemical equation for this reaction. Zinc plus sulphuric acid gives zinc sulphate plus hydrogen gas.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student2",
      title: "Testing Other Acids",
      content: "What about HCl and CH₃COOH?",
      content2: "Will they behave similarly?",
      narration: "Professor, you mentioned testing with HCl and acetic acid too. Will they give the same results?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Comparing Different Acids",
      content: "HCl: Fast reaction, pop sound",
      content2: "CH₃COOH: Slower reaction, still pop sound",
      visual: {
        type: "drawAcidComparison",
        params: ["multiple"]
      },
      narration: "Good thinking! HCl reacts quickly with zinc and gives hydrogen. Acetic acid reacts slower but still produces hydrogen with the same pop test.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "What About Nitric Acid?",
      content: "HNO₃ behavior different?",
      content2: "Why might it be special?",
      narration: "What about nitric acid, Professor? Does it also produce hydrogen gas with metals?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Nitric Acid Exception",
      content: "HNO₃ is a Strong Oxidizing Agent",
      content2: "Usually NO hydrogen gas evolved",
      visual: {
        type: "drawNitricException",
        params: ["oxidizing"]
      },
      narration: "Excellent question! Nitric acid is special - it's a strong oxidizing agent. It usually doesn't produce hydrogen because it oxidizes the hydrogen to water.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "teacher",
      title: "Activity 2.4 - Bases with Metals",
      content: "Sodium Hydroxide + Zinc",
      content2: "Do bases also react with metals?",
      visual: {
        type: "drawBaseMetalSetup",
        params: ["NaOH", "Zn"]
      },
      narration: "Now let's explore something interesting - what happens when we react zinc with sodium hydroxide, a base?",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student2",
      title: "Surprising Results",
      content: "Bubbles forming with base too!",
      content2: "Pop sound again?",
      narration: "This is surprising! Even with the base, I can see gas bubbles forming. Will this also give a pop sound?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Base-Metal Reaction",
      content: "2NaOH + Zn → Na₂ZnO₂ + H₂",
      content2: "Sodium Zincate + Hydrogen Gas",
      visual: {
        type: "drawBaseEquation",
        params: ["NaOH", "Zn", "Na2ZnO2", "H2"]
      },
      narration: "Yes! Some metals like zinc and aluminum react with strong bases to produce hydrogen gas. The equation shows sodium zincate formation.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "General Pattern",
      content: "Both acids and bases can produce H₂",
      content2: "But not with all metals?",
      narration: "So both acids and bases can produce hydrogen gas with certain metals, but this doesn't happen with all metals, right?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Key Learnings Summary",
      content: "Reactive metals + Acids/Bases → H₂ gas",
      content2: "Pop test confirms hydrogen presence",
      visual: {
        type: "drawSummaryDiagram",
        params: ["complete"]
      },
      narration: "Perfect understanding! Only reactive metals produce hydrogen with acids and bases. The pop test is our reliable method to identify hydrogen gas.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "teacher",
      title: "Safety Reminders",
      content: "Always work with teacher supervision",
      content2: "Handle acids and bases carefully",
      narration: "Remember students, these experiments require proper safety measures and teacher guidance. Always handle chemicals with care.",
      visualDuration: 5,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Next Topic Preview",
      content: "Acids and Bases with Metal Carbonates",
      content2: "More exciting gas evolution reactions!",
      narration: "In our next lesson, we'll explore how acids and bases react with metal carbonates and bicarbonates. Get ready for more fascinating chemistry!",
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
function drawExperimentSetup(ctx, setupType) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  // Background
  ctx.fillStyle = '#f0f8ff';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Draw test tube
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(centerX - 80, centerY - 60, 40, 120, 5);
  ctx.stroke();
  
  // Draw acid solution
  ctx.fillStyle = '#ffeb3b';
  ctx.fillRect(centerX - 78, centerY + 20, 36, 38);
  
  // Draw zinc granules
  ctx.fillStyle = '#9e9e9e';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(centerX - 70 + (i % 2) * 20, centerY + 30 + Math.floor(i / 2) * 15, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw delivery tube
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 40, centerY - 40);
  ctx.lineTo(centerX + 50, centerY - 40);
  ctx.lineTo(centerX + 50, centerY + 40);
  ctx.stroke();
  
  // Draw soap solution container
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX + 60, centerY + 20, 60, 40);
  
  // Soap solution
  ctx.fillStyle = '#e3f2fd';
  ctx.fillRect(centerX + 62, centerY + 22, 56, 36);
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Dilute H₂SO₄', centerX - 60, centerY + 80);
  ctx.fillText('Zn granules', centerX - 60, centerY + 95);
  ctx.fillText('Soap solution', centerX + 90, centerY + 75);
  
  // Title
  ctx.fillStyle = '#1976d2';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Acid-Metal Reaction Setup', centerX, LAYOUT_MEDIA.y + 30);
  
  ctx.restore();
}

function drawGasEvolution(ctx, acid, metal) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Draw reaction equation visually
  ctx.fillStyle = '#2196f3';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Gas Evolution Process', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw molecular representation
  ctx.fillStyle = '#ff5722';
  ctx.font = '16px Arial';
  ctx.fillText('H₂SO₄', centerX - 150, centerY - 50);
  
  ctx.fillStyle = '#9e9e9e';
  ctx.fillText('Zn', centerX - 150, centerY);
  
  // Plus sign
  ctx.fillStyle = '#000';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('+', centerX - 100, centerY - 25);
  
  // Arrow
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 60, centerY - 25);
  ctx.lineTo(centerX - 20, centerY - 25);
  ctx.stroke();
  
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(centerX - 20, centerY - 25);
  ctx.lineTo(centerX - 30, centerY - 35);
  ctx.lineTo(centerX - 30, centerY - 15);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();
  
  // Products
  ctx.fillStyle = '#4caf50';
  ctx.font = '16px Arial';
  ctx.fillText('ZnSO₄', centerX + 50, centerY - 50);
  
  ctx.fillStyle = '#f44336';
  ctx.fillText('H₂', centerX + 50, centerY);
  
  ctx.fillStyle = '#000';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('+', centerX + 100, centerY - 25);
  
  // Gas bubbles animation
  ctx.fillStyle = 'rgba(255, 193, 7, 0.6)';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(centerX + 150 + (i % 3) * 15, centerY - 60 + (i % 4) * 20, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('H₂ gas bubbles', centerX + 165, centerY + 30);
  
  ctx.restore();
}

function drawSoapTest(ctx, gasType) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#e8f5e8';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#388e3c';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Gas Collection in Soap Bubbles', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw gas delivery tube
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 100, centerY - 50);
  ctx.lineTo(centerX - 20, centerY - 50);
  ctx.lineTo(centerX - 20, centerY + 10);
  ctx.stroke();
  
  // Draw soap solution container
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - 50, centerY + 10, 100, 60);
  
  // Soap solution
  ctx.fillStyle = '#b3e5fc';
  ctx.fillRect(centerX - 48, centerY + 12, 96, 56);
  
  // Draw gas bubbles of different sizes
  const bubbles = [
    { x: centerX - 30, y: centerY - 20, r: 15 },
    { x: centerX + 10, y: centerY - 30, r: 20 },
    { x: centerX + 50, y: centerY - 10, r: 12 },
    { x: centerX - 10, y: centerY - 40, r: 18 }
  ];
  
  bubbles.forEach(bubble => {
    // Bubble outline
    ctx.strokeStyle = '#00bcd4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
    ctx.stroke();
    
    // Bubble interior (gas-filled)
    ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
    ctx.fill();
    
    // H₂ label in bubble
    ctx.fillStyle = '#d32f2f';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('H₂', bubble.x, bubble.y + 3);
  });
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Gas from reaction', centerX - 60, centerY - 70);
  ctx.fillText('Soap solution', centerX, centerY + 85);
  ctx.fillText('Gas-filled bubbles', centerX + 70, centerY - 50);
  
  ctx.restore();
}

function drawPopTest(ctx, result) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#fff3e0';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#ff6f00';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Hydrogen Gas Pop Test', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw soap bubble
  ctx.strokeStyle = '#00bcd4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX - 50, centerY, 40, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.fillStyle = 'rgba(255, 235, 59, 0.4)';
  ctx.fill();
  
  // H₂ in bubble
  ctx.fillStyle = '#d32f2f';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('H₂', centerX - 50, centerY + 5);
  
  // Draw burning candle
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(centerX + 20, centerY - 40, 6, 60);
  
  // Candle flame
  ctx.fillStyle = '#ff5722';
  ctx.beginPath();
  ctx.ellipse(centerX + 23, centerY - 45, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffc107';
  ctx.beginPath();
  ctx.ellipse(centerX + 23, centerY - 42, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  
  if (result === 'positive') {
    // Draw explosion effect
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 3;
    const rays = 8;
    for (let i = 0; i < rays; i++) {
      const angle = (i * Math.PI * 2) / rays;
      const startX = centerX - 50 + Math.cos(angle) * 45;
      const startY = centerY + Math.sin(angle) * 45;
      const endX = centerX - 50 + Math.cos(angle) * 65;
      const endY = centerY + Math.sin(angle) * 65;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    // POP text
    ctx.fillStyle = '#ff1744';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('POP!', centerX, centerY - 80);
  }
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('Gas bubble', centerX - 50, centerY + 60);
  ctx.fillText('Burning candle', centerX + 23, centerY + 40);
  
  ctx.restore();
}

function drawChemicalEquation(ctx, reactant1, reactant2, product1, product2) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f3e5f5';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#7b1fa2';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Chemical Equation', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw equation
  ctx.fillStyle = '#1976d2';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  
  // Reactants
  ctx.fillText(reactant1, centerX - 120, centerY - 20);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('+', centerX - 60, centerY - 20);
  
  ctx.fillStyle = '#ff5722';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(reactant2, centerX - 20, centerY - 20);
  
  // Arrow
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 120, centerY + 20);
  ctx.lineTo(centerX + 40, centerY + 20);
  ctx.stroke();
  
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(centerX + 40, centerY + 20);
  ctx.lineTo(centerX + 25, centerY + 10);
  ctx.lineTo(centerX + 25, centerY + 30);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();
  
  // Products
  ctx.fillStyle = '#4caf50';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(product1, centerX + 80, centerY + 60);
  
  ctx.fillStyle = '#000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('+', centerX + 140, centerY + 60);
  
  ctx.fillStyle = '#f44336';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(product2, centerX + 180, centerY + 60);
  
  // State labels
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.fillText('(s)', centerX - 95, centerY - 5);
  ctx.fillText('(aq)', centerX + 5, centerY - 5);
  ctx.fillText('(aq)', centerX + 105, centerY + 75);
  ctx.fillText('(g)', centerX + 205, centerY + 75);
  
  // General form
  ctx.fillStyle = '#333';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Metal + Acid → Salt + Hydrogen gas', centerX, centerY + 120);
  
  ctx.restore();
}

function drawAcidComparison(ctx, type) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f1f8e9';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#558b2f';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Comparison of Different Acids with Zinc', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw three test tubes
  const acids = [
    { name: 'H₂SO₄', x: centerX - 80, rate: 'Fast', color: '#ffeb3b' },
    { name: 'HCl', x: centerX, rate: 'Fast', color: '#81c784' },
    { name: 'CH₃COOH', x: centerX + 80, rate: 'Slow', color: '#ffab91' }
  ];
  
  acids.forEach(acid => {
    // Test tube
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(acid.x - 20, centerY - 60, 40, 80);
    
    // Acid solution
    ctx.fillStyle = acid.color;
    ctx.fillRect(acid.x - 18, centerY - 20, 36, 38);
    
    // Zinc granules
    ctx.fillStyle = '#9e9e9e';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(acid.x - 10 + (i % 2) * 20, centerY - 10 + Math.floor(i / 2) * 15, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Gas bubbles (more for faster reactions)
    ctx.fillStyle = 'rgba(255, 193, 7, 0.7)';
    const bubbleCount = acid.rate === 'Fast' ? 6 : 3;
    for (let i = 0; i < bubbleCount; i++) {
      ctx.beginPath();
      ctx.arc(acid.x - 15 + (i % 3) * 10, centerY - 80 - (i % 2) * 15, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Labels
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(acid.name, acid.x, centerY + 35);
    ctx.fillText(acid.rate, acid.x, centerY + 50);
    
    // Pop test result
    ctx.fillStyle = '#4caf50';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('POP!', acid.x, centerY - 100);
  });
  
  // Common result
  ctx.fillStyle = '#d32f2f';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('All produce H₂ gas with characteristic pop sound', centerX, centerY + 80);
  
  ctx.restore();
}

function drawNitricException(ctx, type) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#fce4ec';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#c2185b';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Nitric Acid - The Exception', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw HNO₃ test tube
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - 40, centerY - 60, 40, 80);
  
  // Nitric acid solution
  ctx.fillStyle = '#ffcdd2';
  ctx.fillRect(centerX - 38, centerY - 20, 36, 38);
  
  // Zinc granules
  ctx.fillStyle = '#9e9e9e';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(centerX - 30 + (i % 2) * 20, centerY - 10 + Math.floor(i / 2) * 15, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Different gas (NO₂/NO)
  ctx.fillStyle = 'rgba(255, 87, 34, 0.7)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(centerX - 25 + (i % 2) * 10, centerY - 80 - (i % 2) * 15, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('HNO₃', centerX - 20, centerY + 35);
  ctx.fillText('NO H₂ gas!', centerX - 20, centerY + 50);
  
  // Brown gas label
  ctx.fillStyle = '#ff5722';
  ctx.font = '10px Arial';
  ctx.fillText('NO₂/NO', centerX - 20, centerY - 100);
  
  // Explanation box
  ctx.strokeStyle = '#c2185b';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX + 60, centerY - 60, 140, 120);
  
  ctx.fillStyle = '#f8bbd9';
  ctx.fillRect(centerX + 62, centerY - 58, 136, 116);
  
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Why no H₂?', centerX + 70, centerY - 40);
  ctx.fillText('• HNO₃ is strong', centerX + 70, centerY - 20);
  ctx.fillText('  oxidizing agent', centerX + 70, centerY - 5);
  ctx.fillText('• Oxidizes H₂', centerX + 70, centerY + 15);
  ctx.fillText('  to H₂O', centerX + 70, centerY + 30);
  ctx.fillText('• Produces brown', centerX + 70, centerY + 45);
  ctx.fillText('  NO₂ gas instead', centerX + 70, centerY + 60);
  
  ctx.restore();
}

function drawBaseMetalSetup(ctx, base, metal) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#e8f5e8';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#2e7d32';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Base-Metal Reaction Setup', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw test tube
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(centerX - 80, centerY - 60, 40, 120, 5);
  ctx.stroke();
  
  // Draw base solution
  ctx.fillStyle = '#c8e6c9';
  ctx.fillRect(centerX - 78, centerY + 20, 36, 38);
  
  // Draw zinc granules
  ctx.fillStyle = '#9e9e9e';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(centerX - 70 + (i % 2) * 20, centerY + 30 + Math.floor(i / 2) * 15, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Heat source (Bunsen burner)
  ctx.fillStyle = '#ff5722';
  ctx.fillRect(centerX - 90, centerY + 70, 20, 10);
  
  // Flame
  ctx.fillStyle = '#2196f3';
  ctx.beginPath();
  ctx.ellipse(centerX - 80, centerY + 65, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Gas bubbles
  ctx.fillStyle = 'rgba(255, 193, 7, 0.7)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(centerX - 70 + (i % 2) * 15, centerY - 10 - (i % 3) * 12, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Delivery tube
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 40, centerY - 40);
  ctx.lineTo(centerX + 50, centerY - 40);
  ctx.lineTo(centerX + 50, centerY + 40);
  ctx.stroke();
  
  // Soap solution container
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX + 60, centerY + 20, 60, 40);
  
  ctx.fillStyle = '#e3f2fd';
  ctx.fillRect(centerX + 62, centerY + 22, 56, 36);
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('NaOH solution', centerX - 60, centerY + 80);
  ctx.fillText('Zn granules', centerX - 60, centerY + 95);
  ctx.fillText('Heat', centerX - 80, centerY + 95);
  ctx.fillText('Soap solution', centerX + 90, centerY + 75);
  
  ctx.restore();
}

function drawBaseEquation(ctx, base, metal, product1, product2) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f1f8e9';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#388e3c';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Base-Metal Reaction Equation', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw equation
  ctx.fillStyle = '#1976d2';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  
  // Reactants
  ctx.fillText('2NaOH', centerX - 120, centerY - 40);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('+', centerX - 60, centerY - 40);
  
  ctx.fillStyle = '#9e9e9e';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Zn', centerX - 20, centerY - 40);
  
  // Arrow
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 120, centerY);
  ctx.lineTo(centerX + 40, centerY);
  ctx.stroke();
  
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(centerX + 40, centerY);
  ctx.lineTo(centerX + 25, centerY - 10);
  ctx.lineTo(centerX + 25, centerY + 10);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();
  
  // Products
  ctx.fillStyle = '#4caf50';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Na₂ZnO₂', centerX + 80, centerY + 40);
  
  ctx.fillStyle = '#000';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('+', centerX + 140, centerY + 40);
  
  ctx.fillStyle = '#f44336';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('H₂', centerX + 180, centerY + 40);
  
  // Product names
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.fillText('Sodium Zincate', centerX + 80, centerY + 60);
  ctx.fillText('Hydrogen Gas', centerX + 180, centerY + 60);
  
  // Note
  ctx.fillStyle = '#d32f2f';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Note: Only some metals react with bases', centerX, centerY + 100);
  
  ctx.restore();
}

function drawSummaryDiagram(ctx, type) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f3e5f5';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#7b1fa2';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Summary: Metal Reactions', centerX, LAYOUT_MEDIA.y + 30);
  
  // Draw two reaction pathways
  // Acids pathway
  ctx.fillStyle = '#1976d2';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('ACIDS', centerX - 150, centerY - 80);
  
  ctx.strokeStyle = '#1976d2';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - 200, centerY - 100, 100, 60);
  
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('Metal + Acid', centerX - 150, centerY - 85);
  ctx.fillText('→ Salt + H₂', centerX - 150, centerY - 70);
  
  // Bases pathway
  ctx.fillStyle = '#388e3c';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('BASES', centerX + 150, centerY - 80);
  
  ctx.strokeStyle = '#388e3c';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX + 100, centerY - 100, 100, 60);
  
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('Metal + Base', centerX + 150, centerY - 85);
  ctx.fillText('→ Salt + H₂', centerX + 150, centerY - 70);
  
  // Common result
  ctx.fillStyle = '#ff5722';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('H₂ Gas Evolution', centerX, centerY);
  
  // Pop test
  ctx.strokeStyle = '#ff5722';
  ctx.lineWidth = 3;
  ctx.strokeRect(centerX - 80, centerY + 20, 160, 40);
  
  ctx.fillStyle = '#fff3e0';
  ctx.fillRect(centerX - 78, centerY + 22, 156, 36);
  
  ctx.fillStyle = '#000';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Pop Test Confirms H₂', centerX, centerY + 45);
  
  // Key points
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('• Only reactive metals produce H₂', LAYOUT_MEDIA.x + 20, centerY + 90);
  ctx.fillText('• HNO₃ is an exception (oxidizing agent)', LAYOUT_MEDIA.x + 20, centerY + 110);
  ctx.fillText('• Not all metals react with bases', LAYOUT_MEDIA.x + 20, centerY + 130);
  
  ctx.restore();
}

// Export the lesson content and visual functions
module.exports = {
  LESSON_CONTENT,
  visualFunctions: {
    drawExperimentSetup,
    drawGasEvolution,
    drawSoapTest,
    drawPopTest,
    drawChemicalEquation,
    drawAcidComparison,
    drawNitricException,
    drawBaseMetalSetup,
    drawBaseEquation,
    drawSummaryDiagram
  }
};