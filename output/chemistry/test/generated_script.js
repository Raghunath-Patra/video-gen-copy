// LESSON CONTENT - Educational video script and visual functions
const LESSON_CONTENT = {
  lessonSteps: [
    {
      speaker: "teacher",
      title: "Understanding Krishna in Hindu Philosophy",
      content: "Divine Nature and Worship",
      content2: "Religious and Cultural Significance",
      narration: "Hello students! I'm Professor Sharma. Today we're exploring the concept of Krishna as God in Hindu philosophy and culture.",
      visualDuration: 5,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Krishna's Divine Attributes",
      content: "Supreme Being • Creator • Protector",
      content2: "Compassionate • Omnipresent • Eternal",
      visual: {
        type: "drawKrishnaAttributes",
        params: ["divine_qualities"]
      },
      narration: "In Hindu tradition, Krishna is revered as the Supreme Being with divine attributes that reflect his godhood.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "Student Inquiry",
      content: "What makes Krishna divine?",
      content2: "How is this expressed in texts?",
      narration: "Professor, what specific qualities and actions in religious texts establish Krishna's divine nature?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Scriptural Evidence",
      content: "Bhagavad Gita • Bhagavata Purana",
      content2: "Mahabharata • Vishnu Purana",
      visual: {
        type: "drawScripturalSources",
        params: ["sacred_texts"]
      },
      narration: "Krishna's divinity is established through various Hindu scriptures, particularly the Bhagavad Gita where he reveals his cosmic form.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student2",
      title: "Cultural Perspective",
      content: "Different traditions view this differently",
      content2: "How do we study this academically?",
      narration: "Sir, since different religious traditions have varying beliefs about divinity, how do we approach this topic academically?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Academic Approach",
      content: "Comparative Religion • Cultural Studies",
      content2: "Historical Context • Literary Analysis",
      visual: {
        type: "drawAcademicFramework",
        params: ["study_methods"]
      },
      narration: "Excellent question! We study religious beliefs through comparative religion, examining how different communities understand and express their faith.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "teacher",
      title: "Cultural Impact",
      content: "Art • Literature • Philosophy",
      content2: "Festivals • Music • Dance",
      visual: {
        type: "drawCulturalExpression",
        params: ["cultural_forms"]
      },
      narration: "Krishna's divine status has profoundly influenced Indian culture, inspiring countless works of art, literature, and philosophical thought.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "student1",
      title: "Understanding Devotion",
      content: "How do devotees express their faith?",
      content2: "What are the practices involved?",
      narration: "How do believers express their devotion to Krishna in their daily lives and religious practices?",
      visualDuration: 4,
      isComplex: false
    },
    {
      speaker: "teacher",
      title: "Devotional Practices",
      content: "Bhakti Yoga • Prayer • Meditation",
      content2: "Kirtans • Festivals • Service",
      visual: {
        type: "drawDevotionalPractices",
        params: ["worship_forms"]
      },
      narration: "Devotees express their faith through various practices including devotional singing, festivals like Janmashtami, and acts of service.",
      visualDuration: 6,
      isComplex: true
    },
    {
      speaker: "teacher",
      title: "Summary and Reflection",
      content: "Religious Studies Perspective",
      content2: "Respectful Academic Inquiry",
      narration: "Today we've explored how Krishna is understood as God within Hindu tradition, examining this through the lens of religious studies and cultural analysis.",
      visualDuration: 5,
      isComplex: false
    }
  ],

  speakers: {
    teacher: { voice: 'aditi', model: 'lightning-v2', name: 'Prof. Sharma', color: '#1a5276', gender: 'female' },
    student1: { voice: 'nikita', model: 'lightning-v2', name: 'Priya', color: '#a9dfbf', gender: 'female' },
    student2: { voice: 'lakshya', model: 'lightning-v2', name: 'Arjun', color: '#f39c12', gender: 'male' }
  }
};

// VISUAL FUNCTIONS - Canvas drawing code for educational diagrams
function drawKrishnaAttributes(ctx, attributeType) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  // Clear the drawing area
  ctx.fillStyle = '#fff8dc';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Draw title
  ctx.fillStyle = '#8b4513';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Divine Attributes of Krishna', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw central circle
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#8b4513';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Krishna', centerX, centerY - 5);
  ctx.fillText('as God', centerX, centerY + 15);
  
  // Draw attribute circles around center
  const attributes = [
    { text: 'Supreme\nBeing', angle: 0, color: '#ff6b6b' },
    { text: 'Creator', angle: Math.PI / 3, color: '#4ecdc4' },
    { text: 'Protector', angle: 2 * Math.PI / 3, color: '#45b7d1' },
    { text: 'Omnipresent', angle: Math.PI, color: '#96ceb4' },
    { text: 'Eternal', angle: 4 * Math.PI / 3, color: '#ffeaa7' },
    { text: 'Compassionate', angle: 5 * Math.PI / 3, color: '#dda0dd' }
  ];
  
  const radius = 120;
  
  attributes.forEach(attr => {
    const x = centerX + Math.cos(attr.angle) * radius;
    const y = centerY + Math.sin(attr.angle) * radius;
    
    // Draw connecting line
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Draw attribute circle
    ctx.fillStyle = attr.color;
    ctx.beginPath();
    ctx.arc(x, y, 35, 0, Math.PI * 2);
    ctx.fill();
    
    // Add text
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const lines = attr.text.split('\n');
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y - 5 + index * 15);
    });
  });
  
  ctx.restore();
}

function drawScripturalSources(ctx, sourceType) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f5f5dc';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#8b4513';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Scriptural Sources about Krishna', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw books
  const books = [
    { title: 'Bhagavad Gita', subtitle: 'Krishna\'s teachings', x: centerX - 120, y: centerY - 60, color: '#ff7f50' },
    { title: 'Bhagavata Purana', subtitle: 'Life stories', x: centerX + 120, y: centerY - 60, color: '#98fb98' },
    { title: 'Mahabharata', subtitle: 'Epic narrative', x: centerX - 120, y: centerY + 60, color: '#87ceeb' },
    { title: 'Vishnu Purana', subtitle: 'Cosmic stories', x: centerX + 120, y: centerY + 60, color: '#dda0dd' }
  ];
  
  books.forEach(book => {
    // Draw book
    ctx.fillStyle = book.color;
    ctx.fillRect(book.x - 60, book.y - 30, 120, 60);
    
    // Book outline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(book.x - 60, book.y - 30, 120, 60);
    
    // Book spine
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(book.x - 50, book.y - 30);
    ctx.lineTo(book.x - 50, book.y + 30);
    ctx.stroke();
    
    // Text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(book.title, book.x, book.y - 5);
    ctx.font = '10px Arial';
    ctx.fillText(book.subtitle, book.x, book.y + 10);
  });
  
  ctx.restore();
}

function drawAcademicFramework(ctx, methodType) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f0f8ff';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#191970';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Academic Study of Religious Beliefs', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw methodology framework
  const methods = [
    { name: 'Comparative\nReligion', x: centerX - 150, y: centerY - 80, color: '#ff6b6b' },
    { name: 'Cultural\nStudies', x: centerX + 150, y: centerY - 80, color: '#4ecdc4' },
    { name: 'Historical\nContext', x: centerX - 150, y: centerY + 80, color: '#45b7d1' },
    { name: 'Literary\nAnalysis', x: centerX + 150, y: centerY + 80, color: '#96ceb4' }
  ];
  
  // Center methodology circle
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#000';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Academic', centerX, centerY - 5);
  ctx.fillText('Approach', centerX, centerY + 15);
  
  methods.forEach(method => {
    // Draw connecting line
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(method.x, method.y);
    ctx.stroke();
    
    // Draw method circle
    ctx.fillStyle = method.color;
    ctx.beginPath();
    ctx.arc(method.x, method.y, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Add method text
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const lines = method.name.split('\n');
    lines.forEach((line, index) => {
      ctx.fillText(line, method.x, method.y - 5 + index * 15);
    });
  });
  
  ctx.restore();
}

function drawCulturalExpression(ctx, expressionType) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#fff5ee';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#8b4513';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Cultural Impact of Krishna Worship', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw cultural elements
  const elements = [
    { name: 'Art', icon: '🎨', x: centerX - 120, y: centerY - 80 },
    { name: 'Literature', icon: '📚', x: centerX + 120, y: centerY - 80 },
    { name: 'Music', icon: '🎵', x: centerX - 180, y: centerY },
    { name: 'Philosophy', icon: '💭', x: centerX, y: centerY - 120 },
    { name: 'Dance', icon: '💃', x: centerX + 180, y: centerY },
    { name: 'Festivals', icon: '🎉', x: centerX - 120, y: centerY + 80 },
    { name: 'Architecture', icon: '🏛️', x: centerX + 120, y: centerY + 80 }
  ];
  
  // Central circle
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#000';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Krishna', centerX, centerY - 5);
  ctx.fillText('Culture', centerX, centerY + 10);
  
  elements.forEach(element => {
    // Draw element circle
    ctx.fillStyle = '#e6e6fa';
    ctx.beginPath();
    ctx.arc(element.x, element.y, 35, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#9370db';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add icon (represented as text)
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(element.icon, element.x, element.y - 5);
    
    // Add label
    ctx.font = '10px Arial';
    ctx.fillText(element.name, element.x, element.y + 15);
    
    // Connect to center
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(element.x, element.y);
    ctx.stroke();
  });
  
  ctx.restore();
}

function drawDevotionalPractices(ctx, practiceType) {
  const LAYOUT_MEDIA = { x: 200, y: 200, width: 600, height: 400 };
  
  ctx.save();
  
  ctx.fillStyle = '#f0fff0';
  ctx.fillRect(LAYOUT_MEDIA.x, LAYOUT_MEDIA.y, LAYOUT_MEDIA.width, LAYOUT_MEDIA.height);
  
  const centerX = LAYOUT_MEDIA.x + LAYOUT_MEDIA.width / 2;
  const centerY = LAYOUT_MEDIA.y + LAYOUT_MEDIA.height / 2;
  
  // Title
  ctx.fillStyle = '#006400';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Devotional Practices', centerX, LAYOUT_MEDIA.y + 40);
  
  // Draw practice categories
  const practices = [
    { name: 'Bhakti Yoga', desc: 'Path of devotion', x: centerX - 120, y: centerY - 60, color: '#ff69b4' },
    { name: 'Prayer', desc: 'Daily worship', x: centerX + 120, y: centerY - 60, color: '#40e0d0' },
    { name: 'Meditation', desc: 'Spiritual focus', x: centerX - 120, y: centerY + 60, color: '#98fb98' },
    { name: 'Kirtans', desc: 'Devotional songs', x: centerX + 120, y: centerY + 60, color: '#ffd700' }
  ];
  
  // Center circle
  ctx.fillStyle = '#8a2be2';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Devotional', centerX, centerY - 5);
  ctx.fillText('Life', centerX, centerY + 15);
  
  practices.forEach(practice => {
    // Draw practice box
    ctx.fillStyle = practice.color;
    ctx.fillRect(practice.x - 50, practice.y - 25, 100, 50);
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(practice.x - 50, practice.y - 25, 100, 50);
    
    // Add text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(practice.name, practice.x, practice.y - 5);
    ctx.font = '10px Arial';
    ctx.fillText(practice.desc, practice.x, practice.y + 10);
    
    // Connect to center
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(practice.x, practice.y);
    ctx.stroke();
  });
  
  ctx.restore();
}

// Export the lesson content and visual functions
module.exports = {
  LESSON_CONTENT,
  visualFunctions: {
    drawKrishnaAttributes,
    drawScripturalSources,
    drawAcademicFramework,
    drawCulturalExpression,
    drawDevotionalPractices
  }
};