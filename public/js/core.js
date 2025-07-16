// Core JavaScript functionality for Educational Video Generator

// Global variables
let currentStep = 1;
let currentProject = null;
let slides = [];
let currentSlideIndex = 0;
let workflowMode = 'simple';
let currentTab = 'projects';
let allProjects = [];
let projectToDelete = null;

// Global variables for visual functions and canvas
let currentVisualFunctions = {};
let previewCanvas = null;
let previewCtx = null;

// Initialize canvas for previews
function initializePreviewCanvas() {
    if (!previewCanvas) {
        previewCanvas = document.createElement('canvas');
        previewCanvas.width = 1000;
        previewCanvas.height = 700;
        previewCtx = previewCanvas.getContext('2d');
    }
    return { canvas: previewCanvas, ctx: previewCtx };
}

// Helper function to reconstruct visual functions from server data
function reconstructVisualFunctions(visualFunctionsData) {
    const reconstructedFunctions = {};
    
    if (!visualFunctionsData) {
        console.warn('⚠️ No visual functions data provided');
        return reconstructedFunctions;
    }
    
    Object.keys(visualFunctionsData).forEach(funcName => {
        try {
            const funcData = visualFunctionsData[funcName];
            
            if (typeof funcData === 'function') {
                // Already a function
                reconstructedFunctions[funcName] = funcData;
                console.log(`✅ Function ${funcName} already executable`);
            } else if (typeof funcData === 'string') {
                // Function as string - need to reconstruct
                console.log(`🔧 Reconstructing function: ${funcName}`);
                
                // Extract function body from string
                let funcBody = funcData;
                
                // Remove "function functionName(params) {" and trailing "}"
                const funcMatch = funcBody.match(/function\s+\w+\s*\([^)]*\)\s*\{([\s\S]*)\}$/);
                if (funcMatch) {
                    funcBody = funcMatch[1];
                } else {
                    // Try arrow function format
                    const arrowMatch = funcBody.match(/\([^)]*\)\s*=>\s*\{([\s\S]*)\}$/);
                    if (arrowMatch) {
                        funcBody = arrowMatch[1];
                    }
                }
                
                // Create new function with proper parameters
                // Most visual functions expect (ctx, ...params)
                reconstructedFunctions[funcName] = new Function('ctx', 'param1', 'param2', 'param3', funcBody);
                console.log(`✅ Successfully reconstructed function: ${funcName}`);
                
            } else {
                console.warn(`⚠️ Unexpected function type for ${funcName}:`, typeof funcData);
            }
        } catch (error) {
            console.error(`❌ Error reconstructing function ${funcName}:`, error);
            
            // Create a placeholder function that shows an error
            reconstructedFunctions[funcName] = function(ctx) {
                ctx.save();
                ctx.fillStyle = '#ff6b6b';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Error loading ${funcName}`, 500, 400);
                ctx.fillText('Check console for details', 500, 420);
                ctx.restore();
            };
        }
    });
    
    console.log(`🎨 Reconstructed ${Object.keys(reconstructedFunctions).length} visual functions`);
    return reconstructedFunctions;
}

// Helper functions for drawing preview components
function drawPreviewBackground(ctx, speaker) {
    const SPEAKER_BACKGROUNDS = {
        teacher: '#f8fafe',
        student1: '#f3e8ff',
        student2: '#fefaf8'
    };
    
    const backgroundColor = SPEAKER_BACKGROUNDS[speaker] || '#e9f0f4';
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 1000, 700);
}

function drawPreviewAvatars(ctx, activeSpeaker) {
    const LAYOUT = { AVATAR: { x: 30, y: 250, spacing: 70, size: 30 } };
    
    if (!currentProject || !currentProject.speakers) {
        console.warn('⚠️ No speakers data available for avatar rendering');
        return;
    }
    
    const speakerKeys = Object.keys(currentProject.speakers);
    
    speakerKeys.forEach((speaker, index) => {
        const config = currentProject.speakers[speaker];
        const isActive = speaker === activeSpeaker;
        const x = LAYOUT.AVATAR.x + LAYOUT.AVATAR.size / 2;
        const y = LAYOUT.AVATAR.y + (index * LAYOUT.AVATAR.spacing) + LAYOUT.AVATAR.size / 2;
        
        drawPreviewSingleAvatar(ctx, x, y, config, isActive);
    });
}

function drawPreviewSingleAvatar(ctx, x, y, config, isActive) {
    ctx.save();
    
    const radius = 15;
    
    if (isActive) {
        ctx.shadowColor = config.color;
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#fdbcb4' : lightenColor('#fdbcb4', 0.4);
    ctx.fill();
    
    ctx.lineWidth = isActive ? 3 : 1.5;
    ctx.strokeStyle = isActive ? config.color : lightenColor(config.color, 0.3);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    drawPreviewAvatarFace(ctx, x, y, radius * 0.8, isActive);
    
    ctx.fillStyle = isActive ? '#2c3e50' : lightenColor('#2c3e50', 0.4);
    ctx.font = `${isActive ? 'bold ' : ''}12px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(config.name, x, y + radius + 16);
    
    ctx.restore();
}

function drawPreviewAvatarFace(ctx, centerX, centerY, faceRadius, isActive) {
    ctx.save();
    
    const eyeColor = isActive ? '#2c3e50' : lightenColor('#2c3e50', 0.5);
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(centerX - faceRadius * 0.3, centerY - faceRadius * 0.2, faceRadius * 0.06, 0, Math.PI * 2);
    ctx.arc(centerX + faceRadius * 0.3, centerY - faceRadius * 0.2, faceRadius * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY + faceRadius * 0.1, faceRadius * 0.3, 0, Math.PI);
    ctx.stroke();
    
    ctx.restore();
}

function drawPreviewTextContent(ctx, step) {
    const LAYOUT = {
        TITLE: { x: 500, y: 75 },
        CONTENT: { x: 500, y: 120, width: 800 },
        CONTENT2: { x: 500, y: 145, width: 800 },
        MEDIA: { x: 200, y: 200, width: 600, height: 400 }
    };
    
    // Title
    ctx.fillStyle = '#1a5276';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(step.title, LAYOUT.TITLE.x, LAYOUT.TITLE.y);
    
    // Content
    ctx.fillStyle = '#2c3e50';
    if (step.content) {
        ctx.font = '22px Arial';
        wrapTextPreview(ctx, step.content, LAYOUT.CONTENT.x, LAYOUT.CONTENT.y, LAYOUT.CONTENT.width, 30);
    }
    if (step.content2) {
        ctx.font = '22px Arial';
        wrapTextPreview(ctx, step.content2, LAYOUT.CONTENT2.x, LAYOUT.CONTENT2.y + (step.content ? 30 : 0), LAYOUT.CONTENT2.width, 26);
    }
    
    // Draw media area border
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(LAYOUT.MEDIA.x, LAYOUT.MEDIA.y, LAYOUT.MEDIA.width, LAYOUT.MEDIA.height);
}

function wrapTextPreview(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    ctx.textAlign = 'center';

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}

function lightenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Enhanced updateSlidePreview function with actual visual rendering
function updateSlidePreview(slide, index) {
    const previewImage = document.getElementById('previewImage');
    
    console.log(`🖼️ Updating preview for slide ${index + 1}:`, slide.title);
    console.log(`🎨 Visual info:`, slide.visual);
    console.log(`🔧 Available visual functions:`, Object.keys(currentVisualFunctions));
    
    // Initialize canvas
    const { canvas, ctx } = initializePreviewCanvas();
    
    try {
        // Clear canvas
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, 1000, 700);
        
        // Draw background for speaker
        drawPreviewBackground(ctx, slide.speaker);
        
        // Draw avatars
        drawPreviewAvatars(ctx, slide.speaker);
        
        // Draw text content
        drawPreviewTextContent(ctx, slide);
        
        // Draw visual function if present
        if (slide.visual && slide.visual.type && currentVisualFunctions[slide.visual.type]) {
            console.log(`🎨 Executing visual function: ${slide.visual.type}`);
            
            try {
                // Execute the visual function
                if (slide.visual.params && slide.visual.params.length > 0) {
                    currentVisualFunctions[slide.visual.type](ctx, ...slide.visual.params);
                } else {
                    currentVisualFunctions[slide.visual.type](ctx);
                }
                
                console.log(`✅ Visual function executed successfully`);
            } catch (error) {
                console.error(`❌ Error executing visual function '${slide.visual.type}':`, error);
                
                // Draw error placeholder
                ctx.save();
                ctx.fillStyle = '#ff6b6b';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Error in ${slide.visual.type}()`, 500, 400);
                ctx.fillText(error.message, 500, 420);
                ctx.restore();
            }
        } else if (slide.visual && slide.visual.type) {
            console.warn(`⚠️ Visual function '${slide.visual.type}' not found`);
            
            // Draw missing function placeholder
            ctx.save();
            ctx.fillStyle = '#ff9800';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Missing visual: ${slide.visual.type}`, 500, 400);
            ctx.restore();
        }
        
        // Convert canvas to image and display
        const imageDataUrl = canvas.toDataURL('image/png');
        previewImage.innerHTML = `<img src="${imageDataUrl}" alt="Slide ${index + 1} Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        
    } catch (error) {
        console.error('❌ Error rendering preview:', error);
        previewImage.innerHTML = `
            <div style="text-align: center; color: #f44336; padding: 20px;">
                <p>🖼️ Preview Error</p>
                <p style="font-size: 0.9em; margin-top: 10px;">${slide.title}</p>
                <p style="font-size: 0.8em; color: #999;">${error.message}</p>
            </div>
        `;
    }
}

// Tab Management
function showTab(tabName) {
    currentTab = tabName;
    
    // Update navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    if (tabName === 'projects') {
        document.querySelectorAll('.nav-tab')[0].classList.add('active');
        document.getElementById('projectsTab').style.display = 'block';
        document.getElementById('createTab').style.display = 'none';
        loadProjects();
    } else if (tabName === 'create') {
        document.querySelectorAll('.nav-tab')[1].classList.add('active');
        document.getElementById('projectsTab').style.display = 'none';
        document.getElementById('createTab').style.display = 'block';
        selectWorkflow('simple');
    }
}

// Navigation functions
function goToStep(step) {
    // Always allow navigation when we have a project
    if (workflowMode === 'simple' && !currentProject) {
        // Switch to advanced mode if we're navigating with a project
        selectWorkflow('advanced');
    }
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Hide all step indicators
    document.querySelectorAll('.step').forEach(stepEl => {
        stepEl.classList.remove('active');
        if (parseInt(stepEl.dataset.step) < step) {
            stepEl.classList.add('completed');
        } else {
            stepEl.classList.remove('completed');
        }
    });
    
    // Show target section and activate step
    document.getElementById(`step${step}`).classList.add('active');
    const targetStepEl = document.querySelector(`[data-step="${step}"]`);
    if (targetStepEl) {
        targetStepEl.classList.add('active');
    }
    
    currentStep = step;
}

// Utility functions
function showProgress(containerId, text) {
    const container = document.getElementById(containerId);
    const textEl = document.getElementById(containerId.replace('Progress', 'ProgressText'));
    container.style.display = 'block';
    textEl.textContent = text;
    
    // Simulate progress
    const fillEl = document.getElementById(containerId.replace('Progress', 'ProgressFill'));
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 90) progress = 90;
        fillEl.style.width = progress + '%';
    }, 500);
    
    container.dataset.interval = interval;
}

function hideProgress(containerId) {
    const container = document.getElementById(containerId);
    const fillEl = document.getElementById(containerId.replace('Progress', 'ProgressFill'));
    
    fillEl.style.width = '100%';
    setTimeout(() => {
        container.style.display = 'none';
        fillEl.style.width = '0%';
        
        // Clear interval
        if (container.dataset.interval) {
            clearInterval(container.dataset.interval);
        }
    }, 500);
}

function showStatus(statusId, message, type) {
    const statusEl = document.getElementById(statusId);
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
}

function hideStatus(statusId) {
    const statusEl = document.getElementById(statusId);
    statusEl.style.display = 'none';
}

// File upload handler
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('contentInput').value = e.target.result;
        };
        reader.readAsText(file);
    }
}

// Modal management
function closeModal() {
    document.getElementById('projectModal').style.display = 'none';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    projectToDelete = null;
}

// Close modals when clicking outside
window.onclick = function(event) {
    const projectModal = document.getElementById('projectModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (event.target === projectModal) {
        closeModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
}


// Replace the downloadScriptPDFWithPreviews function in your core.js with this version

async function downloadScriptPDFWithPreviews() {
    if (!currentProject || !slides || slides.length === 0) {
        alert('No slides available for PDF export');
        return;
    }
    
    try {
        console.log('📄 Starting custom aspect ratio PDF generation...');
        showStatus('scriptStatus', '📄 Generating PDF with slide aspect ratio...', 'info');
        
        if (!window.jspdf) {
            throw new Error('jsPDF library not loaded');
        }
        
        const { jsPDF } = window.jspdf;
        
        // Calculate custom page dimensions to match slide aspect ratio
        // Original slide canvas: 1000x700 (10:7 ratio)
        const slideAspectRatio = 1000 / 700; // 1.428571...
        
        // Set page height and calculate width to maintain aspect ratio
        const pageHeight = 200; // mm (reasonable size for slides)
        const pageWidth = pageHeight * slideAspectRatio; // ~285.7mm
        
        console.log(`📐 Custom page dimensions: ${pageWidth.toFixed(1)}mm x ${pageHeight}mm`);
        
        // Create PDF with custom dimensions (landscape orientation)
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [pageWidth, pageHeight]
        });
        
        // Process each slide
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            console.log(`📄 Processing slide ${i + 1}: ${slide.title}`);
            
            showStatus('scriptStatus', `📄 Processing slide ${i + 1}/${slides.length}...`, 'info');
            
            // Add new page for each slide (except the first one)
            if (i > 0) {
                pdf.addPage();
            }
            
            // Generate the visual preview
            try {
                const previewImage = await generateSlidePreviewImage(slide, i);
                if (previewImage) {
                    // Add small margin for clean edges
                    const margin = 2; // Very small margin
                    
                    // Calculate image dimensions to fill the custom page
                    const imgWidth = pageWidth - (margin * 2);
                    const imgHeight = pageHeight - (margin * 2);
                    
                    // Position the image with small margin
                    const x = margin;
                    const y = margin;
                    
                    // Add the image to fill almost the entire page
                    pdf.addImage(previewImage, 'PNG', x, y, imgWidth, imgHeight);
                    
                    console.log(`✅ Added slide ${i + 1} to PDF`);
                }
            } catch (error) {
                console.error(`❌ Error generating preview for slide ${i + 1}:`, error);
                
                // Fallback: add a simple error message centered on page
                pdf.setFontSize(16);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`Slide ${i + 1} - Preview generation failed`, pageWidth / 2, pageHeight / 2, { align: 'center' });
            }
        }
        
        // Generate filename and download
        const projectTitle = currentProject?.title || slides[0]?.title || 'Educational Script';
        const safeTitle = projectTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const filename = `${safeTitle}_Slides_${new Date().toISOString().split('T')[0]}.pdf`;
        
        pdf.save(filename);
        
        console.log('✅ Custom aspect ratio PDF generated successfully');
        console.log(`📊 Final PDF stats: ${slides.length} slides, ${pageWidth.toFixed(1)}×${pageHeight}mm pages`);
        showStatus('scriptStatus', '✅ Perfect-fit slides PDF downloaded!', 'success');
        setTimeout(() => hideStatus('scriptStatus'), 3000);
        
    } catch (error) {
        console.error('❌ Error generating custom aspect PDF:', error);
        showStatus('scriptStatus', '❌ PDF generation failed: ' + error.message, 'error');
        alert('PDF generation failed: ' + error.message);
    }
}

// Alternative version with different size options
async function downloadScriptPDFWithPreviewsLarge() {
    if (!currentProject || !slides || slides.length === 0) {
        alert('No slides available for PDF export');
        return;
    }
    
    try {
        console.log('📄 Starting large custom aspect ratio PDF generation...');
        showStatus('scriptStatus', '📄 Generating large slide PDF...', 'info');
        
        if (!window.jspdf) {
            throw new Error('jsPDF library not loaded');
        }
        
        const { jsPDF } = window.jspdf;
        
        // Larger version - closer to A4 width but maintaining aspect ratio
        const slideAspectRatio = 1000 / 700; // 10:7 ratio
        const pageWidth = 280; // mm (close to A4 width: 297mm)
        const pageHeight = pageWidth / slideAspectRatio; // ~196mm
        
        console.log(`📐 Large page dimensions: ${pageWidth}mm x ${pageHeight.toFixed(1)}mm`);
        
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [pageWidth, pageHeight]
        });
        
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            
            if (i > 0) {
                pdf.addPage();
            }
            
            try {
                const previewImage = await generateSlidePreviewImage(slide, i);
                if (previewImage) {
                    const margin = 1;
                    const imgWidth = pageWidth - (margin * 2);
                    const imgHeight = pageHeight - (margin * 2);
                    
                    pdf.addImage(previewImage, 'PNG', margin, margin, imgWidth, imgHeight);
                }
            } catch (error) {
                console.error(`❌ Error generating preview for slide ${i + 1}:`, error);
            }
        }
        
        const projectTitle = currentProject?.title || slides[0]?.title || 'Educational Script';
        const safeTitle = projectTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const filename = `${safeTitle}_Large_Slides_${new Date().toISOString().split('T')[0]}.pdf`;
        
        pdf.save(filename);
        
        console.log('✅ Large custom aspect ratio PDF generated successfully');
        showStatus('scriptStatus', '✅ Large perfect-fit slides PDF downloaded!', 'success');
        setTimeout(() => hideStatus('scriptStatus'), 3000);
        
    } catch (error) {
        console.error('❌ Error generating large custom aspect PDF:', error);
        showStatus('scriptStatus', '❌ PDF generation failed: ' + error.message, 'error');
    }
}

// Keep the same generateSlidePreviewImage function
async function generateSlidePreviewImage(slide, slideIndex) {
    try {
        const { canvas, ctx } = initializePreviewCanvas();
        
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, 1000, 700);
        
        drawPreviewBackground(ctx, slide.speaker);
        drawPreviewAvatars(ctx, slide.speaker);
        drawPreviewTextContent(ctx, slide);
        
        if (slide.visual && slide.visual.type && currentVisualFunctions[slide.visual.type]) {
            try {
                if (slide.visual.params && slide.visual.params.length > 0) {
                    currentVisualFunctions[slide.visual.type](ctx, ...slide.visual.params);
                } else {
                    currentVisualFunctions[slide.visual.type](ctx);
                }
            } catch (error) {
                console.error(`❌ Error executing visual function '${slide.visual.type}':`, error);
                ctx.save();
                ctx.fillStyle = '#ff6b6b';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Error in ${slide.visual.type}()`, 500, 400);
                ctx.restore();
            }
        }
        
        return canvas.toDataURL('image/png');
        
    } catch (error) {
        console.error(`❌ Error generating preview image for slide ${slideIndex + 1}:`, error);
        return null;
    }
}

// Add this enhanced function to your core.js to fix preview images for all projects

// ENHANCED: updateSlidePreview function with better visual function loading
function updateSlidePreview(slide, index) {
    const previewImage = document.getElementById('previewImage');
    
    console.log(`🖼️ Updating preview for slide ${index + 1}:`, slide.title);
    console.log(`🎨 Visual info:`, slide.visual);
    console.log(`🔧 Available visual functions:`, Object.keys(currentVisualFunctions));
    console.log(`📊 Current project status:`, currentProject?.status);
    
    // Initialize canvas
    const { canvas, ctx } = initializePreviewCanvas();
    
    try {
        // Clear canvas
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, 1000, 700);
        
        // Draw background for speaker
        drawPreviewBackground(ctx, slide.speaker);
        
        // Draw avatars
        drawPreviewAvatars(ctx, slide.speaker);
        
        // Draw text content
        drawPreviewTextContent(ctx, slide);
        
        // ENHANCED: Try to draw visual function with better error handling
        if (slide.visual && slide.visual.type) {
            console.log(`🎨 Attempting to execute visual function: ${slide.visual.type}`);
            
            // Check if function exists
            if (currentVisualFunctions[slide.visual.type]) {
                try {
                    // Execute the visual function
                    if (slide.visual.params && slide.visual.params.length > 0) {
                        currentVisualFunctions[slide.visual.type](ctx, ...slide.visual.params);
                    } else {
                        currentVisualFunctions[slide.visual.type](ctx);
                    }
                    
                    console.log(`✅ Visual function executed successfully: ${slide.visual.type}`);
                } catch (error) {
                    console.error(`❌ Error executing visual function '${slide.visual.type}':`, error);
                    drawVisualErrorPlaceholder(ctx, slide.visual.type, error.message);
                }
            } else {
                console.warn(`⚠️ Visual function '${slide.visual.type}' not found in currentVisualFunctions`);
                console.log(`📋 Available functions:`, Object.keys(currentVisualFunctions));
                
                // Try to reload visual functions for this project
                if (currentProject && currentProject.projectId) {
                    console.log(`🔄 Attempting to reload visual functions for project: ${currentProject.projectId}`);
                    reloadVisualFunctionsForPreview(slide, index);
                    return; // Exit early, reloadVisualFunctionsForPreview will call updateSlidePreview again
                } else {
                    drawVisualMissingPlaceholder(ctx, slide.visual.type);
                }
            }
        } else {
            console.log(`ℹ️ No visual function specified for slide ${index + 1}`);
        }
        
        // Convert canvas to image and display
        const imageDataUrl = canvas.toDataURL('image/png');
        previewImage.innerHTML = `<img src="${imageDataUrl}" alt="Slide ${index + 1} Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        
    } catch (error) {
        console.error('❌ Error rendering preview:', error);
        previewImage.innerHTML = `
            <div style="text-align: center; color: #f44336; padding: 20px;">
                <p>🖼️ Preview Error</p>
                <p style="font-size: 0.9em; margin-top: 10px;">${slide.title}</p>
                <p style="font-size: 0.8em; color: #999;">${error.message}</p>
                <button onclick="retrySlidePreview(${index})" style="margin-top: 10px; padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

// NEW: Function to reload visual functions for projects without videos
async function reloadVisualFunctionsForPreview(slide, index) {
    try {
        console.log(`🔄 Reloading visual functions for preview...`);
        
        if (!currentProject || !currentProject.projectId) {
            console.error('❌ No current project to reload visual functions from');
            return;
        }
        
        // Fetch the script data again to get visual functions
        const response = await fetch(`/api/project/${currentProject.projectId}/script`);
        const result = await response.json();
        
        if (result.success && result.visualFunctions) {
            console.log(`✅ Reloaded visual functions:`, Object.keys(result.visualFunctions));
            
            // Update currentVisualFunctions with the reloaded functions
            currentVisualFunctions = reconstructVisualFunctions(result.visualFunctions);
            
            console.log(`🔧 Reconstructed visual functions:`, Object.keys(currentVisualFunctions));
            
            // Now retry the preview
            updateSlidePreview(slide, index);
        } else {
            console.error('❌ Failed to reload visual functions:', result.error);
            drawVisualErrorPlaceholder(
                initializePreviewCanvas().ctx, 
                slide.visual?.type || 'unknown', 
                'Failed to reload visual functions'
            );
        }
        
    } catch (error) {
        console.error('❌ Error reloading visual functions:', error);
    }
}

// Helper function to draw error placeholder
function drawVisualErrorPlaceholder(ctx, functionName, errorMessage) {
    ctx.save();
    
    // Draw error background
    ctx.fillStyle = '#ffebee';
    ctx.fillRect(200, 200, 600, 400);
    
    // Draw border
    ctx.strokeStyle = '#f44336';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 200, 600, 400);
    
    // Draw error icon and text
    ctx.fillStyle = '#f44336';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️', 500, 350);
    
    ctx.font = '16px Arial';
    ctx.fillText(`Error in ${functionName}()`, 500, 380);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    const errorLines = errorMessage.split(' ').reduce((lines, word) => {
        const lastLine = lines[lines.length - 1];
        if (lastLine && (lastLine + ' ' + word).length < 40) {
            lines[lines.length - 1] = lastLine + ' ' + word;
        } else {
            lines.push(word);
        }
        return lines;
    }, []);
    
    errorLines.forEach((line, i) => {
        ctx.fillText(line, 500, 410 + (i * 15));
    });
    
    ctx.restore();
}

// Helper function to draw missing function placeholder
function drawVisualMissingPlaceholder(ctx, functionName) {
    ctx.save();
    
    // Draw missing background
    ctx.fillStyle = '#fff3e0';
    ctx.fillRect(200, 200, 600, 400);
    
    // Draw border
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 200, 600, 400);
    
    // Draw missing icon and text
    ctx.fillStyle = '#ff9800';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔍', 500, 350);
    
    ctx.font = '16px Arial';
    ctx.fillText(`Missing: ${functionName}()`, 500, 380);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('Visual function not loaded', 500, 410);
    ctx.fillText('Try refreshing or check console', 500, 425);
    
    ctx.restore();
}

// NEW: Retry function for failed previews
function retrySlidePreview(index) {
    if (slides && slides[index]) {
        console.log(`🔄 Retrying preview for slide ${index + 1}`);
        updateSlidePreview(slides[index], index);
    }
}

// ENHANCED: populateSlides function with better visual function loading
function populateSlides() {
    const slidesList = document.getElementById('slidesList');
    slidesList.innerHTML = '';
    
    if (!slides || slides.length === 0) {
        slidesList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No slides available</p>';
        return;
    }
    
    console.log(`📋 Populating ${slides.length} slides...`);
    console.log(`🔧 Visual functions available:`, Object.keys(currentVisualFunctions));
    
    // Ensure visual functions are loaded
    if (Object.keys(currentVisualFunctions).length === 0 && currentProject && currentProject.projectId) {
        console.log(`⚠️ No visual functions loaded, attempting to load them...`);
        loadVisualFunctionsForProject();
    }
    
    slides.forEach((slide, index) => {
        const slideEl = document.createElement('div');
        slideEl.className = 'slide-item';
        slideEl.onclick = () => selectSlide(index);
        
        // Safe access to speaker name with fallback
        let speakerName = slide.speaker;
        if (currentProject && currentProject.speakers && currentProject.speakers[slide.speaker]) {
            speakerName = currentProject.speakers[slide.speaker].name || slide.speaker;
        }
        
        // Visual indicator for slides with visual functions
        const hasVisual = slide.visual && slide.visual.type;
        const visualIndicator = hasVisual ? '🎨' : '📝';
        
        slideEl.innerHTML = `
            <div class="slide-header">
                <span>${visualIndicator} Slide ${index + 1}</span>
                <span>${slide.speaker}</span>
            </div>
            <div class="slide-content">
                <div class="slide-title">${slide.title || 'Untitled Slide'}</div>
                <div class="slide-speaker">Speaker: ${speakerName}</div>
                <div class="slide-text">${(slide.content || '') + ' ' + (slide.content2 || '')}</div>
                ${hasVisual ? `<div class="slide-visual" style="font-size: 0.8em; color: #e74c3c; margin-top: 5px;">Visual: ${slide.visual.type}</div>` : ''}
            </div>
        `;
        
        slidesList.appendChild(slideEl);
    });
    
    if (slides.length > 0) {
        selectSlide(0);
    }
}

// NEW: Load visual functions for projects that don't have them loaded
async function loadVisualFunctionsForProject() {
    if (!currentProject || !currentProject.projectId) {
        console.warn('⚠️ No current project to load visual functions for');
        return;
    }
    
    try {
        console.log(`🔄 Loading visual functions for project: ${currentProject.projectId}`);
        
        const response = await fetch(`/api/project/${currentProject.projectId}/script`);
        const result = await response.json();
        
        if (result.success && result.visualFunctions) {
            console.log(`✅ Loaded visual functions:`, Object.keys(result.visualFunctions));
            
            // Reconstruct and store visual functions
            currentVisualFunctions = reconstructVisualFunctions(result.visualFunctions);
            
            console.log(`🔧 Final visual functions available:`, Object.keys(currentVisualFunctions));
            
            // Update current project with visual functions
            if (currentProject) {
                currentProject.visualFunctions = currentVisualFunctions;
            }
            
            return true;
        } else {
            console.error('❌ Failed to load visual functions:', result.error);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error loading visual functions:', error);
        return false;
    }
}

// Make functions globally available
window.retrySlidePreview = retrySlidePreview;
window.loadVisualFunctionsForProject = loadVisualFunctionsForProject;

// Make functions globally available
window.downloadScriptPDFWithPreviews = downloadScriptPDFWithPreviews;
window.downloadScriptPDFWithPreviewsLarge = downloadScriptPDFWithPreviewsLarge;