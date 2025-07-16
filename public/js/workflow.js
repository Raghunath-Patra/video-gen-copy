// Workflow Management JavaScript

// Workflow selection
function selectWorkflow(mode) {
    workflowMode = mode;
    
    // Update UI based on workflow
    document.querySelectorAll('.workflow-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Find and select the correct workflow card
    const cards = document.querySelectorAll('.workflow-card');
    if (mode === 'simple' && cards[0]) {
        cards[0].classList.add('selected');
    } else if (mode === 'advanced' && cards[1]) {
        cards[1].classList.add('selected');
    }
    
    const quickActions = document.getElementById('quickActions');
    const advancedActions = document.getElementById('advancedActions');
    const pipelineSteps = document.getElementById('pipelineSteps');
    
    if (mode === 'simple') {
        quickActions.style.display = 'flex';
        advancedActions.style.display = 'none';
        pipelineSteps.style.display = 'none';
    } else {
        quickActions.style.display = 'none';
        advancedActions.style.display = 'block';
        pipelineSteps.style.display = 'flex';
    }
    
    console.log(`Switched to ${mode} workflow mode`);
}

// Simple workflow: Complete video generation
async function generateCompleteVideo() {
    const content = document.getElementById('contentInput').value.trim();
    if (!content) {
        showStatus('scriptStatus', 'Please enter some content first.', 'error');
        return;
    }

    showProgress('scriptProgress', 'Generating complete video (script + visuals + audio)... This may take 5-15 minutes.');
    
    try {
        const response = await fetch('/api/generate-video-complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content })
        });

        const result = await response.json();
        
        if (result.success) {
            hideProgress('scriptProgress');
            showStatus('scriptStatus', '🎉 Complete video generated successfully! Check your projects.', 'success');
            
            // Auto-refresh projects if we're on that tab
            if (currentTab === 'projects') {
                setTimeout(refreshProjects, 2000);
            }
        } else {
            throw new Error(result.error || 'Failed to generate video');
        }
    } catch (error) {
        hideProgress('scriptProgress');
        showStatus('scriptStatus', `❌ Error: ${error.message}`, 'error');
    }
}

// Simple workflow: Script only generation
async function generateScriptOnly() {
    const content = document.getElementById('contentInput').value.trim();
    if (!content) {
        showStatus('scriptStatus', 'Please enter some content first.', 'error');
        return;
    }

    showProgress('scriptProgress', 'Generating script and visuals...');
    
    try {
        const response = await fetch('/api/generate-script', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content })
        });

        const result = await response.json();
        
        if (result.success) {
            hideProgress('scriptProgress');
            showStatus('scriptStatus', '✅ Script generated successfully! Check your projects.', 'success');
            
            // Auto-refresh projects if we're on that tab
            if (currentTab === 'projects') {
                setTimeout(refreshProjects, 2000);
            }
        } else {
            throw new Error(result.error || 'Failed to generate script');
        }
    } catch (error) {
        hideProgress('scriptProgress');
        showStatus('scriptStatus', `❌ Error: ${error.message}`, 'error');
    }
}

// Advanced workflow: Step 1 - Generate Script
async function generateScript() {
    const content = document.getElementById('contentInput').value.trim();
    if (!content) {
        showStatus('scriptStatus', 'Please enter some content first.', 'error');
        return;
    }

    // Ensure we're in advanced mode
    if (workflowMode === 'simple') {
        selectWorkflow('advanced');
    }

    showProgress('scriptProgress', 'Generating script and visuals...');
    
    try {
        const response = await fetch('/api/generate-script', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content })
        });

        const result = await response.json();
        
        if (result.success) {
            currentProject = result.data;
            slides = result.data.lessonSteps;
            
            hideProgress('scriptProgress');
            showStatus('scriptStatus', '✅ Script generated successfully! Moving to editor...', 'success');
            
            setTimeout(() => {
                populateSlides();
                generatePreviews();
                goToStep(2);
            }, 1500);
        } else {
            throw new Error(result.error || 'Failed to generate script');
        }
    } catch (error) {
        hideProgress('scriptProgress');
        showStatus('scriptStatus', `❌ Error: ${error.message}`, 'error');
    }
}

// Step 2: Populate slides in editor
function populateSlides() {
    const slidesList = document.getElementById('slidesList');
    slidesList.innerHTML = '';
    
    if (!slides || slides.length === 0) {
        slidesList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No slides available</p>';
        return;
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
        
        slideEl.innerHTML = `
            <div class="slide-header">
                <span>Slide ${index + 1}</span>
                <span>${slide.speaker}</span>
            </div>
            <div class="slide-content">
                <div class="slide-title">${slide.title || 'Untitled Slide'}</div>
                <div class="slide-speaker">Speaker: ${speakerName}</div>
                <div class="slide-text">${(slide.content || '') + ' ' + (slide.content2 || '')}</div>
            </div>
        `;
        
        slidesList.appendChild(slideEl);
    });
    
    if (slides.length > 0) {
        selectSlide(0);
    }
}

// Select a slide for editing
function selectSlide(index) {
    // Update active slide
    document.querySelectorAll('.slide-item').forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    currentSlideIndex = index;
    const slide = slides[index];
    
    // Update preview
    updateSlidePreview(slide, index);
    
    // Update edit controls
    const editControls = document.getElementById('editControls');
    const editTextarea = document.getElementById('editTextarea');
    
    editControls.style.display = 'block';
    editTextarea.value = JSON.stringify(slide, null, 2);
}

// Generate preview images
async function generatePreviews() {
    if (!currentProject) return;
    
    try {
        const response = await fetch('/api/generate-previews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ projectId: currentProject.projectId })
        });

        const result = await response.json();
        
        if (result.success) {
            currentProject.previewImages = result.previewImages;
            // Refresh current slide preview
            if (slides[currentSlideIndex]) {
                updateSlidePreview(slides[currentSlideIndex], currentSlideIndex);
            }
        }
    } catch (error) {
        console.error('Failed to generate previews:', error);
    }
}

// Save slide edits
function saveSlideEdit() {
    const editTextarea = document.getElementById('editTextarea');
    try {
        const updatedSlide = JSON.parse(editTextarea.value);
        slides[currentSlideIndex] = updatedSlide;
        
        // Update the slide display
        populateSlides();
        selectSlide(currentSlideIndex);
        
        showStatus('scriptStatus', '✅ Slide updated successfully!', 'success');
        setTimeout(() => hideStatus('scriptStatus'), 2000);
    } catch (error) {
        showStatus('scriptStatus', '❌ Invalid JSON format. Please check your edits.', 'error');
    }
}

// Chat functionality
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.style.display = chatWindow.style.display === 'none' ? 'block' : 'none';
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    if (!message) return;
    
    const chatMessages = document.getElementById('chatMessages');
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = message;
    chatMessages.appendChild(userMsg);
    
    // Simulate AI response (you can implement actual LLM integration here)
    setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.className = 'chat-message assistant';
        aiMsg.textContent = 'I understand you want to modify this slide. This feature will be available soon with full LLM integration for visual and content editing.';
        chatMessages.appendChild(aiMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
    
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Start new project
function startNew() {
    currentProject = null;
    slides = [];
    currentSlideIndex = 0;
    document.getElementById('contentInput').value = '';
    document.getElementById('videoResult').style.display = 'none';
    hideProgress('scriptProgress');
    hideProgress('videoProgress');
    hideStatus('scriptStatus');
    hideStatus('videoStatus');
    goToStep(1);
}