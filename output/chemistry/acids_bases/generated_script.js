// LESSON CONTENT - Educational video script and visual functions
const LESSON_CONTENT = {
  lessonSteps: [
    {
      speaker: "teacher",
      title: "Understanding Acids and Bases",
      content: "Chemical Properties of Acids and Bases",
      content2: "Laboratory Testing Methods",
      narration: "Hello students! I'm Professor Priya. Today we're exploring the fascinating world of acids and bases through practical laboratory testing.",
      visualDuration: 5,
      isComplex: false
    },
    {
      speaker: "student1",
      title: "Starting Our Investigation",
      content: "What are we testing today?",
      content2: "Acids and bases in the lab",
      narration: "Professor, what exactly are we going to test today? I see we have many different solutions here.",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Activity 2.1: Testing with Indicators",
      content: "HCl • H₂SO₄ • HNO₃ • CH₃COOH",
      content2: "NaOH • Ca(OH)₂ • KOH • Mg(OH)₂ • NH₄OH",
      narration: "Great question, Sneha! We have acids like hydrochloric acid, sulfuric acid, nitric acid, and acetic acid. We also have bases like sodium hydroxide, calcium hydroxide, potassium hydroxide, magnesium hydroxide, and ammonium hydroxide.",
      visualDuration: 6,
      isComplex: false
    },
    {
      speaker: "student2",
      title: "Our Testing Tools",
      content: "Red litmus • Blue litmus",
      content2: "Phenolphthalein • Methyl orange",
      narration: "And these are our indicators, right? Red litmus, blue litmus, phenolphthalein, and methyl orange. How do they work exactly?",
      visualDuration: 5,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "How Indicators Work",
      content: "Indicators change color",
      content2: "Different colors = Different nature",
      narration: "Excellent observation, Arjun! Indicators are special substances that change color when they come in contact with acids or bases. Let's test hydrochloric acid first.",
      visualDuration: 5,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Testing HCl with Indicators",
      content: "Hydrochloric Acid (HCl)",
      content2: "Observing color changes",
      visual: {
        type: "drawIndicatorTest",
        params: ["HCl"]
      },
      narration: "Watch carefully as I add a drop of HCl to each indicator. Red litmus shows no change, blue litmus turns red, phenolphthalein remains colorless, and methyl orange turns red.",
      visualDuration: 7,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "Observing the Pattern",
      content: "Blue litmus turns red!",
      content2: "This must be acidic",
      narration: "I can see the blue litmus paper turning red! And the methyl orange is also red. This tells us that HCl is acidic, right?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Testing NaOH with Indicators",
      content: "Sodium Hydroxide (NaOH)",
      content2: "Comparing with acid results",
      visual: {
        type: "drawIndicatorTest",
        params: ["NaOH"]
      },
      narration: "Exactly right, Sneha! Now let's test sodium hydroxide and see the difference. Red litmus turns blue, blue litmus shows no change, phenolphthalein turns pink, and methyl orange turns yellow.",
      visualDuration: 7,
      isComplex: true
    },
    {
      speaker: "student2",
      title: "Comparing Results",
      content: "Completely opposite colors!",
      content2: "Bases vs Acids",
      narration: "Wow! The colors are completely opposite to what we saw with HCl. So bases give different color changes than acids?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Acid vs Base Comparison",
      content: "Pattern Recognition",
      content2: "Acids vs Bases",
      visual: {
        type: "drawAcidBaseComparison"
      },
      narration: "Perfect observation, Arjun! Let's summarize the patterns. Acids turn blue litmus red and methyl orange red, while keeping red litmus unchanged and phenolphthalein colorless.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "Understanding the Pattern",
      content: "Bases do the opposite",
      content2: "Red litmus → Blue, Phenolphthalein → Pink",
      narration: "And bases turn red litmus blue, phenolphthalein pink, and methyl orange yellow, while keeping blue litmus unchanged!",
      visualDuration: 5,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Introducing Olfactory Indicators",
      content: "Smell-based indicators",
      content2: "Onion • Vanilla • Clove",
      narration: "Excellent! Now, there's another fascinating type of indicator called olfactory indicators. These work based on smell changes rather than color changes.",
      visualDuration: 5,
      isComplex: false
    },
    {
      speaker: "student2",
      title: "Activity 2.2 Setup",
      content: "Onion-soaked cloth strips",
      content2: "Overnight in the fridge",
      narration: "So we prepared these cloth strips by soaking them with chopped onions overnight in the fridge. What happens when we test them?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Testing Olfactory Indicators",
      content: "Onion smell test",
      content2: "Acid vs Base reaction",
      visual: {
        type: "drawOlfactoryIndicators",
        params: ["onion"]
      },
      narration: "Great setup, Arjun! When we add HCl to the onion-soaked cloth, the onion smell is retained. But when we add NaOH, the smell is destroyed or masked.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "Testing Vanilla and Clove",
      content: "Vanilla essence and clove oil",
      content2: "Same pattern observed",
      narration: "We tested vanilla essence and clove oil too. They both keep their smell in acidic solutions but lose their smell in basic solutions!",
      visualDuration: 5,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Olfactory Indicator Conclusion",
      content: "Smell retained in acids",
      content2: "Smell destroyed in bases",
      narration: "Exactly right, Sneha! Onion, vanilla, and clove all act as olfactory indicators. Their characteristic smells are retained in acidic solutions but diminished in basic solutions.",
      visualDuration: 5,
      isComplex: false
    },
    {
      speaker: "student2",
      title: "Practical Applications",
      content: "Helpful for visually impaired",
      content2: "Alternative testing method",
      narration: "This is amazing! Olfactory indicators would be especially helpful for visually impaired students to distinguish between acids and bases.",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Key Learnings Summary",
      content: "Multiple ways to test acids and bases",
      content2: "Visual and olfactory indicators",
      narration: "Wonderful insight, Arjun! Today we learned that we can identify acids and bases using both visual indicators like litmus and phenolphthalein, and olfactory indicators like onion, vanilla, and clove.",
      visualDuration: 6,
      isComplex: false
    },
    {
      speaker: "student1",
      title: "Looking Forward",
      content: "What's next in our study?",
      content2: "More chemical properties?",
      narration: "This was fascinating, Professor! What other chemical properties of acids and bases will we explore next?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Preview of Next Topic",
      content: "Reactions and applications",
      content2: "Real-world examples",
      narration: "Great question, Sneha! Next, we'll explore how acids and bases react with metals, carbonates, and each other. We'll also see their applications in daily life. Keep experimenting!",
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
  
  // Test tube positions and colors based on substance
  const tubes = testSubstance === 'HCl' ? [
    { x: centerX - 120, label: 'Red Litmus', color: '#ff4757', result: 'No change' },
    { x: centerX - 40, label: 'Blue Litmus', color: '#ff4757', result: 'Turns red' },
    { x: centerX + 40, label: 'Phenolphthalein', color: '#ffffff', result: 'Colorless' },
    { x: centerX + 120, label: 'Methyl Orange', color: '#ff4757', result: 'Turns red' }
  ] : [
    { x: centerX - 120, label: 'Red Litmus', color: '#3742fa', result: 'Turns blue' },
    { x: centerX - 40, label: 'Blue Litmus', color: '#3742fa', result: 'No change' },
    { x: centerX + 40, label: 'Phenolphthalein', color: '#ff69b4', result: 'Turns pink' },
    { x: centerX + 120, label: 'Methyl Orange', color: '#ffa502', result: 'Turns yellow' }
  ];
  
  tubes.forEach(tube => {
    // Draw test tube outline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(tube.x - tubeWidth/2, centerY - tubeHeight/2, tubeWidth, tubeHeight);
    ctx.stroke();
    
    // Fill with indicator color
    ctx.fillStyle = tube.color;
    ctx.fillRect(tube.x - tubeWidth/2 + 2, centerY - tubeHeight/2 + 2, tubeWidth - 4, tubeHeight - 4);
    
    // Add black border if white
    if (tube.color === '#ffffff') {
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(tube.x - tubeWidth/2 + 2, centerY - tubeHeight/2 + 2, tubeWidth - 4, tubeHeight - 4);
      ctx.stroke();
    }
    
    // Add label
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tube.label, tube.x, centerY + tubeHeight/2 + 20);
    
    // Add result
    ctx.font = '10px Arial';
    ctx.fillText(tube.result, tube.x, centerY + tubeHeight/2 + 35);
  });
  
  // Add title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Testing ${testSubstance} with Indicators`, centerX, LAYOUT_MEDIA.y + 30);
  
  // Add substance label
  ctx.fillStyle = testSubstance === 'HCl' ? '#e74c3c' : '#3498db';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(testSubstance === 'HCl' ? 'ACID' : 'BASE', centerX, LAYOUT_MEDIA.y + 55);
  
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
  
  // Draw main title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('ACIDS vs BASES', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw vertical divider
  ctx.strokeStyle = '#bdc3c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, LAYOUT_MEDIA.y + 60);
  ctx.lineTo(centerX, LAYOUT_MEDIA.y + LAYOUT_MEDIA.height - 20);
  ctx.stroke();
  
  // Acid side
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('ACIDS', LAYOUT_MEDIA.x + 30, LAYOUT_MEDIA.y + 80);
  
  ctx.fillStyle = '#000';
  ctx.font = '13px Arial';
  ctx.fillText('• Turn blue litmus RED', LAYOUT_MEDIA.x + 30, LAYOUT_MEDIA.y + 110);
  ctx.fillText('• Keep red litmus unchanged', LAYOUT_MEDIA.x + 30, LAYOUT_MEDIA.y + 135);
  ctx.fillText('• Colorless with phenolphthalein', LAYOUT_MEDIA.x + 30, LAYOUT_MEDIA.y + 160);
  ctx.fillText('• Turn methyl orange RED', LAYOUT_MEDIA.x + 30, LAYOUT_MEDIA.y + 185);
  
  // Examples
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('Examples:', LAYOUT_MEDIA.x + 30, LAYOUT_MEDIA.y + 210);
  ctx.fillStyle = '#000';
  ctx.font = '11px Arial';
  ctx.fillText('HCl, H₂SO₄, HNO₃, CH₃COOH', LAYOUT_MEDIA.x + 30, LAYOUT_MEDIA.y + 230);
  
  // Base side
  ctx.textAlign = 'left';
  ctx.fillStyle = '#3498db';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('BASES', centerX + 30, LAYOUT_MEDIA.y + 80);
  
  ctx.fillStyle = '#000';
  ctx.font = '13px Arial';
  ctx.fillText('• Turn red litmus BLUE', centerX + 30, LAYOUT_MEDIA.y + 110);
  ctx.fillText('• Keep blue litmus unchanged', centerX + 30, LAYOUT_MEDIA.y + 135);
  ctx.fillText('• Turn phenolphthalein PINK', centerX + 30, LAYOUT_MEDIA.y + 160);
  ctx.fillText('• Turn methyl orange YELLOW', centerX + 30, LAYOUT_MEDIA.y + 185);
  
  // Examples
  ctx.fillStyle = '#2980b9';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('Examples:', centerX + 30, LAYOUT_MEDIA.y + 210);
  ctx.fillStyle = '#000';
  ctx.font = '11px Arial';
  ctx.fillText('NaOH, Ca(OH)₂, KOH, Mg(OH)₂', centerX + 30, LAYOUT_MEDIA.y + 230);
  
  ctx.restore();
}

function drawOlfactoryIndicators(ctx, indicatorType) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  // Background
  ctx.fillStyle = '#f0f8f0';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Draw title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Olfactory Indicators', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw subtitle
  ctx.fillStyle = '#7f8c8d';
  ctx.font = '14px Arial';
  ctx.fillText('Indicators that work by smell changes', centerX, LAYOUT_MEDIA.y + 65);
  
  // Draw three indicators
  const indicators = [
    { x: centerX - 150, name: 'Onion', color: '#8b4513' },
    { x: centerX, name: 'Vanilla', color: '#deb887' },
    { x: centerX + 150, name: 'Clove', color: '#654321' }
  ];
  
  indicators.forEach(indicator => {
    // Draw indicator representation
    ctx.fillStyle = indicator.color;
    ctx.beginPath();
    ctx.arc(indicator.x, centerY - 30, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Add pattern for texture
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(indicator.x, centerY - 30, 20, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add name
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(indicator.name, indicator.x, centerY + 10);
  });
  
  // Draw test results section
  ctx.fillStyle = '#34495e';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Test Results', centerX, centerY + 50);
  
  // Acid result
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(centerX - 120, centerY + 70, 100, 40);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('In ACID', centerX - 70, centerY + 85);
  ctx.fillText('Smell RETAINED', centerX - 70, centerY + 100);
  
  // Base result
  ctx.fillStyle = '#3498db';
  ctx.fillRect(centerX + 20, centerY + 70, 100, 40);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('In BASE', centerX + 70, centerY + 85);
  ctx.fillText('Smell DESTROYED', centerX + 70, centerY + 100);
  
  // Draw arrows
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 70, centerY + 115);
  ctx.lineTo(centerX - 70, centerY + 130);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX + 70, centerY + 115);
  ctx.lineTo(centerX + 70, centerY + 130);
  ctx.stroke();
  
  // Final note
  ctx.fillStyle = '#27ae60';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Helpful for visually impaired students!', centerX, centerY + 150);
  
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
};