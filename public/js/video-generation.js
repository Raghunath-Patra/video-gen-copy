// Video Generation JavaScript

// Step 3: Generate Video
async function generateVideo() {
    const generateBtn = document.getElementById('generateVideoBtn');
    generateBtn.disabled = true;
    generateBtn.textContent = '🔄 Generating...';
    
    showProgress('videoProgress', 'Generating video with optimized processing...');
    
    try {
        if (currentProject && currentProject.projectId) {
            // Advanced workflow - use existing project
            console.log('Using advanced workflow with project:', currentProject.projectId);
            
            const response = await fetch('/api/generate-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    projectId: currentProject.projectId,
                    slides: slides 
                })
            });

            const result = await response.json();
            
            if (result.success) {
                hideProgress('videoProgress');
                showStatus('videoStatus', '🎉 Video generated successfully!', 'success');
                
                // Show video player
                const videoResult = document.getElementById('videoResult');
                const videoPlayer = document.getElementById('generatedVideo');
                
                videoPlayer.src = `/api/video/${currentProject.projectId}`;
                videoResult.style.display = 'block';
                
                generateBtn.textContent = '✅ Video Generated';
                
                // Auto-refresh projects if we're on that tab
                if (currentTab === 'projects') {
                    setTimeout(refreshProjects, 2000);
                }
            } else {
                throw new Error(result.error || 'Failed to generate video');
            }
        } else {
            // Fallback to complete workflow if no project
            console.log('No project found, using complete workflow');
            
            const content = document.getElementById('contentInput').value.trim();
            if (!content) {
                throw new Error('No content available for video generation');
            }
            
            const response = await fetch('/api/generate-video-complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: content })
            });

            const result = await response.json();
            
            if (result.success) {
                hideProgress('videoProgress');
                showStatus('videoStatus', '🎉 Video generated successfully! Check your projects.', 'success');
                
                // Show success message
                const videoResult = document.getElementById('videoResult');
                videoResult.style.display = 'block';
                
                // Hide video player since we don't have direct access to the file
                const videoPlayer = document.getElementById('generatedVideo');
                videoPlayer.style.display = 'none';
                
                generateBtn.textContent = '✅ Video Generated';
                
                // Auto-refresh projects if we're on that tab
                if (currentTab === 'projects') {
                    setTimeout(refreshProjects, 2000);
                }
            } else {
                throw new Error(result.error || 'Failed to generate video');
            }
        }
        
    } catch (error) {
        hideProgress('videoProgress');
        showStatus('videoStatus', `❌ Error: ${error.message}`, 'error');
        generateBtn.disabled = false;
        generateBtn.textContent = '🎥 Generate Final Video';
    }
}

// Download video (overloaded to work with current project)
function downloadVideo(projectId = null) {
    const id = projectId || (currentProject ? currentProject.projectId : null);
    if (id) {
        window.open(`/api/download/${id}`, '_blank');
    } else {
        alert('No project selected for download');
    }
}