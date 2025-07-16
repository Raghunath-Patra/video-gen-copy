// Complete Projects Management JavaScript

async function loadProjects() {
    const projectsGrid = document.getElementById('projectsGrid');
    const projectsLoading = document.getElementById('projectsLoading');
    const projectsEmpty = document.getElementById('projectsEmpty');
    
    // Show loading
    projectsLoading.style.display = 'block';
    projectsGrid.style.display = 'none';
    projectsEmpty.style.display = 'none';
    
    try {
        const response = await fetch('/api/projects');
        const result = await response.json();
        
        if (result.success) {
            allProjects = result.projects;
            displayProjects(allProjects);
        } else {
            throw new Error(result.error || 'Failed to load projects');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsLoading.style.display = 'none';
        projectsEmpty.style.display = 'block';
        projectsEmpty.innerHTML = `
            <h3>❌ Error Loading Projects</h3>
            <p>${error.message}</p>
            <button class="btn" onclick="loadProjects()" style="margin-top: 20px;">
                🔄 Retry
            </button>
        `;
    }
}

function displayProjects(projects) {
    const projectsGrid = document.getElementById('projectsGrid');
    const projectsLoading = document.getElementById('projectsLoading');
    const projectsEmpty = document.getElementById('projectsEmpty');
    
    projectsLoading.style.display = 'none';
    
    if (projects.length === 0) {
        projectsGrid.style.display = 'none';
        projectsEmpty.style.display = 'block';
        return;
    }
    
    projectsEmpty.style.display = 'none';
    projectsGrid.style.display = 'grid';
    
    projectsGrid.innerHTML = projects.map(project => createProjectCard(project)).join('');
}

function createProjectCard(project) {
    const createdDate = new Date(project.createdAt).toLocaleDateString();
    const statusText = {
        'completed': 'Video Ready',
        'script_ready': 'Script Ready',
        'input_only': 'Input Only',
        'empty': 'Empty'
    }[project.status] || 'Unknown';
    
    const statusEmoji = {
        'completed': '✅',
        'script_ready': '📝',
        'input_only': '📄',
        'empty': '❓'
    }[project.status] || '❓';
    
    return `
        <div class="project-card ${project.status}" onclick="openProject('${project.projectId}')">
            <div class="project-header">
                <div>
                    <div class="project-title">${project.title}</div>
                    <div style="font-size: 0.8em; color: #999;">ID: ${project.projectId.substring(0, 8)}...</div>
                </div>
                <div class="project-status ${project.status}">
                    ${statusEmoji} ${statusText}
                </div>
            </div>
            
            <div class="project-meta">
                <span>📅 ${createdDate}</span>
                <span>📋 ${project.lessonStepsCount} steps</span>
                ${project.hasVideo ? `<span>🎬 ${project.videoFiles.length} video(s)</span>` : ''}
            </div>
            
            <div class="project-actions" onclick="event.stopPropagation();">
                ${getProjectActions(project)}
            </div>
        </div>
    `;
}

function getProjectActions(project) {
    let actions = [];
    
    if (project.status === 'completed') {
        actions.push(`<button class="project-btn secondary" onclick="playVideo('${project.projectId}')">▶️ Play</button>`);
        actions.push(`<button class="project-btn" onclick="downloadVideo('${project.projectId}')">⬇️ Download</button>`);
        actions.push(`<button class="project-btn warning" onclick="editProjectScript('${project.projectId}')">✏️ Edit Script</button>`);
    } else if (project.status === 'script_ready') {
        actions.push(`<button class="project-btn secondary" onclick="resumeProject('${project.projectId}')">▶️ Continue</button>`);
        actions.push(`<button class="project-btn warning" onclick="resumeProject('${project.projectId}')">✏️ Edit Script</button>`);
    } else if (project.status === 'input_only') {
        actions.push(`<button class="project-btn secondary" onclick="resumeProject('${project.projectId}')">▶️ Generate Script</button>`);
        actions.push(`<button class="project-btn warning" onclick="resumeProject('${project.projectId}')">✏️ Edit Input</button>`);
    }
    
    actions.push(`<button class="project-btn danger" onclick="deleteProject('${project.projectId}')">🗑️ Delete</button>`);
    
    return actions.join('');
}

// Edit script for completed projects with visual function loading
async function editProjectScript(projectId) {
    try {
        console.log(`🔧 Loading script for project: ${projectId}`);
        
        // First try the direct script endpoint
        console.log(`🔍 Trying direct script endpoint...`);
        const scriptResponse = await fetch(`/api/project/${projectId}/script`);
        const scriptResult = await scriptResponse.json();
        
        console.log('📊 Direct script result:', scriptResult);
        
        if (scriptResult.success && scriptResult.lessonStepsCount > 0) {
            console.log(`✅ Direct script load successful: ${scriptResult.lessonStepsCount} steps`);
            console.log(`🎨 Visual functions loaded:`, Object.keys(scriptResult.visualFunctions || {}));
            
            // CRITICAL: Store visual functions globally for preview rendering
            currentVisualFunctions = reconstructVisualFunctions(scriptResult.visualFunctions);
            
            console.log(`🔧 Final currentVisualFunctions:`, Object.keys(currentVisualFunctions));
            
            // Set up the complete project data
            currentProject = { 
                projectId: projectId,
                speakers: scriptResult.speakers || {},
                visualFunctions: currentVisualFunctions, // Use processed functions
                status: 'completed'
            };
            
            slides = scriptResult.lessonSteps || [];
            
            console.log('📝 Setting slides array:', slides);
            console.log('🔧 Current project setup complete');
            
            // Ensure we have speakers data
            if (Object.keys(currentProject.speakers).length === 0) {
                console.warn('⚠️ No speakers data found, loading default speakers');
                currentProject.speakers = {
                    teacher: { voice: 'aditi', model: 'lightning-v2', name: 'Prof. Priya', color: '#1a5276', gender: 'female' },
                    student1: { voice: 'nikita', model: 'lightning-v2', name: 'Sneha', color: '#a9dfbf', gender: 'female' },
                    student2: { voice: 'lakshya', model: 'lightning-v2', name: 'Arjun', color: '#f39c12', gender: 'male' }
                };
            }
            
            // Switch to create tab and advanced workflow
            showTab('create');
            selectWorkflow('advanced');
            
            populateSlides();
            goToStep(2);
            showStatus('scriptStatus', '✅ Script loaded for editing! You can modify and regenerate the video.', 'success');
            
            // Initialize preview canvas
            initializePreviewCanvas();
            
            return;
        }
        
        // Fallback to resume endpoint if direct script load fails
        console.log(`🔄 Falling back to resume endpoint...`);
        
        const response = await fetch(`/api/project/${projectId}/resume`);
        const result = await response.json();
        
        if (result.success) {
            console.log('📊 Received project data from resume:', result.data);
            
            // Process visual functions from resume data
            currentVisualFunctions = reconstructVisualFunctions(result.data.visualFunctions);
            
            // Set up the complete project data
            currentProject = { 
                projectId: projectId,
                speakers: result.data.speakers || {},
                visualFunctions: currentVisualFunctions,
                projectDir: result.data.projectInfo?.projectPath || '',
                status: result.data.projectInfo?.status || 'unknown'
            };
            
            slides = result.data.lessonSteps || [];
            
            // Ensure we have speakers data
            if (Object.keys(currentProject.speakers).length === 0) {
                console.warn('⚠️ No speakers data found, loading default speakers');
                currentProject.speakers = {
                    teacher: { voice: 'aditi', model: 'lightning-v2', name: 'Prof. Priya', color: '#1a5276', gender: 'female' },
                    student1: { voice: 'nikita', model: 'lightning-v2', name: 'Sneha', color: '#a9dfbf', gender: 'female' },
                    student2: { voice: 'lakshya', model: 'lightning-v2', name: 'Arjun', color: '#f39c12', gender: 'male' }
                };
            }
            
            if (slides.length === 0) {
                console.error('❌ No slides loaded! Check script file structure.');
                showStatus('scriptStatus', '⚠️ No slides found in project. The script file may be corrupted.', 'error');
            } else {
                console.log(`✅ Loaded ${slides.length} slides successfully`);
            }
            
            // Switch to create tab and advanced workflow
            showTab('create');
            selectWorkflow('advanced');
            
            populateSlides();
            goToStep(2);
            showStatus('scriptStatus', '✅ Script loaded for editing! You can modify and regenerate the video.', 'success');
            
            // Initialize preview canvas
            initializePreviewCanvas();
            
        } else {
            throw new Error(result.error || 'Failed to load project script');
        }
    } catch (error) {
        console.error('❌ Error loading project script:', error);
        alert('Error loading project script: ' + error.message);
    }
}

async function openProject(projectId) {
    try {
        const response = await fetch(`/api/project/${projectId}`);
        const result = await response.json();
        
        if (result.success) {
            showProjectDetails(result.project);
        } else {
            throw new Error(result.error || 'Failed to load project details');
        }
    } catch (error) {
        console.error('Error loading project details:', error);
        alert('Error loading project details: ' + error.message);
    }
}

function showProjectDetails(project) {
    const modal = document.getElementById('projectModal');
    const modalContent = document.getElementById('modalContent');
    
    const createdDate = new Date(project.createdAt).toLocaleString();
    const statusText = {
        'completed': 'Video Ready',
        'script_ready': 'Script Ready', 
        'input_only': 'Input Only',
        'empty': 'Empty'
    }[project.status] || 'Unknown';
    
    modalContent.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h4 style="color: #1976d2; margin-bottom: 10px;">${project.title}</h4>
            <p><strong>Status:</strong> ${statusText}</p>
            <p><strong>Created:</strong> ${createdDate}</p>
            <p><strong>Lesson Steps:</strong> ${project.lessonStepsCount}</p>
            <p><strong>Speakers:</strong> ${project.speakers.join(', ')}</p>
            ${project.visualFunctions.length > 0 ? `<p><strong>Visual Functions:</strong> ${project.visualFunctions.join(', ')}</p>` : ''}
            ${project.hasVideo ? `<p><strong>Videos:</strong> ${project.videoFiles.join(', ')}</p>` : ''}
        </div>
        
        <div style="text-align: center;">
            ${project.status === 'completed' ? `
                <div style="margin-bottom: 15px;">
                    <button class="btn secondary" onclick="playVideo('${project.projectId}'); closeModal();">
                        ▶️ Play Video
                    </button>
                    <button class="btn" onclick="downloadVideo('${project.projectId}');" style="margin-left: 10px;">
                        ⬇️ Download Video
                    </button>
                </div>
                <div style="margin-bottom: 15px;">
                    <button class="btn" onclick="downloadPDF('${project.projectId}')" style="background: #e74c3c; color: white; font-weight: bold;">
                        📄 Download PDF Report
                    </button>
                </div>
                <div>
                    <button class="btn warning" onclick="editProjectScript('${project.projectId}'); closeModal();">
                        ✏️ Edit Script
                    </button>
                </div>
            ` : project.status === 'script_ready' ? `
                <div>
                    <button class="btn secondary" onclick="resumeProject('${project.projectId}'); closeModal();">
                        ▶️ Continue Project
                    </button>
                    <button class="btn" onclick="downloadPDF('${project.projectId}')" style="background: #e74c3c; color: white; margin-left: 10px;">
                        📄 Download PDF
                    </button>
                </div>
                <div style="margin-top: 10px;">
                    <button class="btn warning" onclick="resumeProject('${project.projectId}'); closeModal();">
                        ✏️ Edit Script
                    </button>
                </div>
            ` : `
                <button class="btn warning" onclick="resumeProject('${project.projectId}'); closeModal();">
                    ✏️ ${project.status === 'input_only' ? 'Generate Script' : 'Continue Project'}
                </button>
            `}
            
            <button class="btn" style="background: #f44336; margin-left: 15px;" onclick="deleteProject('${project.projectId}'); closeModal();">
                🗑️ Delete
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
}

async function resumeProject(projectId) {
    try {
        const response = await fetch(`/api/project/${projectId}/resume`);
        const result = await response.json();
        
        if (result.success) {
            // Set up the complete project data
            currentProject = { 
                projectId: projectId,
                speakers: result.data.speakers || {},
                visualFunctions: result.data.visualFunctions || {},
                projectDir: result.data.projectInfo?.projectPath || '',
                status: result.data.projectInfo?.status || 'unknown'
            };
            
            // Switch to create tab and navigate to appropriate step
            showTab('create');
            
            if (result.resumeStep === 2) {
                // Resume at script editor
                slides = result.data.lessonSteps || [];
                selectWorkflow('advanced');
                
                // Ensure we have speakers data before populating slides
                if (Object.keys(currentProject.speakers).length === 0) {
                    console.warn('No speakers data found, loading default speakers');
                    currentProject.speakers = {
                        teacher: { voice: 'aditi', model: 'lightning-v2', name: 'Prof. Priya', color: '#1a5276', gender: 'female' },
                        student1: { voice: 'nikita', model: 'lightning-v2', name: 'Sneha', color: '#a9dfbf', gender: 'female' },
                        student2: { voice: 'lakshya', model: 'lightning-v2', name: 'Arjun', color: '#f39c12', gender: 'male' }
                    };
                }
                
                populateSlides();
                goToStep(2);
                showStatus('scriptStatus', '✅ Project resumed! Continue editing your script.', 'success');
            } else if (result.resumeStep === 3) {
                // Resume at video result
                selectWorkflow('advanced');
                goToStep(3);
                
                // Show the video if available
                const videoResult = document.getElementById('videoResult');
                const videoPlayer = document.getElementById('generatedVideo');
                videoPlayer.src = `/api/video/${projectId}`;
                videoResult.style.display = 'block';
                
                showStatus('videoStatus', '✅ Project resumed! Your video is ready.', 'success');
            } else {
                // Resume at input step
                if (result.data.inputContent) {
                    document.getElementById('contentInput').value = result.data.inputContent;
                }
                selectWorkflow('advanced');
                goToStep(1);
                showStatus('scriptStatus', '✅ Project resumed! Continue from where you left off.', 'success');
            }
        } else {
            throw new Error(result.error || 'Failed to resume project');
        }
    } catch (error) {
        console.error('Error resuming project:', error);
        alert('Error resuming project: ' + error.message);
    }
}

function playVideo(projectId) {
    // Switch to create tab and show video
    showTab('create');
    selectWorkflow('advanced');
    goToStep(3);
    
    const videoResult = document.getElementById('videoResult');
    const videoPlayer = document.getElementById('generatedVideo');
    
    videoPlayer.src = `/api/video/${projectId}`;
    videoResult.style.display = 'block';
    
    // Set current project for download functionality
    currentProject = { projectId: projectId };
}

function deleteProject(projectId) {
    projectToDelete = projectId;
    document.getElementById('deleteModal').style.display = 'block';
}

async function confirmDelete() {
    if (!projectToDelete) return;
    
    try {
        const response = await fetch(`/api/project/${projectToDelete}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeDeleteModal();
            refreshProjects();
            showStatus('scriptStatus', '✅ Project deleted successfully.', 'success');
        } else {
            throw new Error(result.error || 'Failed to delete project');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project: ' + error.message);
    }
}

function refreshProjects() {
    loadProjects();
}

// Advanced project filtering and search
function filterProjects(filterType) {
    let filteredProjects = [...allProjects];
    
    switch (filterType) {
        case 'completed':
            filteredProjects = allProjects.filter(p => p.status === 'completed');
            break;
        case 'script_ready':
            filteredProjects = allProjects.filter(p => p.status === 'script_ready');
            break;
        case 'input_only':
            filteredProjects = allProjects.filter(p => p.status === 'input_only');
            break;
        case 'recent':
            filteredProjects = allProjects.filter(p => {
                const projectDate = new Date(p.createdAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return projectDate > weekAgo;
            });
            break;
        case 'all':
        default:
            filteredProjects = allProjects;
            break;
    }
    
    displayProjects(filteredProjects);
}

// Search projects by title or content
function searchProjects(searchTerm) {
    if (!searchTerm.trim()) {
        displayProjects(allProjects);
        return;
    }
    
    const filteredProjects = allProjects.filter(project => 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.speakers.some(speaker => speaker.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    displayProjects(filteredProjects);
}

// Sort projects
function sortProjects(sortBy) {
    let sortedProjects = [...allProjects];
    
    switch (sortBy) {
        case 'date_asc':
            sortedProjects.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'date_desc':
            sortedProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'title_asc':
            sortedProjects.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title_desc':
            sortedProjects.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'steps_asc':
            sortedProjects.sort((a, b) => a.lessonStepsCount - b.lessonStepsCount);
            break;
        case 'steps_desc':
            sortedProjects.sort((a, b) => b.lessonStepsCount - a.lessonStepsCount);
            break;
        default:
            // Default to newest first
            sortedProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    
    allProjects = sortedProjects;
    displayProjects(allProjects);
}

// Bulk operations
function selectAllProjects(select = true) {
    const checkboxes = document.querySelectorAll('.project-checkbox');
    checkboxes.forEach(cb => cb.checked = select);
    updateBulkActions();
}

function updateBulkActions() {
    const selectedProjects = document.querySelectorAll('.project-checkbox:checked');
    const bulkActionsDiv = document.getElementById('bulkActions');
    
    if (!bulkActionsDiv) return; // Element might not exist
    
    if (selectedProjects.length > 0) {
        bulkActionsDiv.style.display = 'block';
        bulkActionsDiv.innerHTML = `
            <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <span>${selectedProjects.length} project(s) selected</span>
                <button class="btn" onclick="bulkDelete()" style="margin-left: 15px; background: #f44336;">
                    🗑️ Delete Selected
                </button>
                <button class="btn" onclick="selectAllProjects(false)" style="margin-left: 10px;">
                    Clear Selection
                </button>
            </div>
        `;
    } else {
        bulkActionsDiv.style.display = 'none';
    }
}

async function bulkDelete() {
    const selectedProjects = Array.from(document.querySelectorAll('.project-checkbox:checked'))
        .map(cb => cb.dataset.projectId);
    
    if (selectedProjects.length === 0) return;
    
    const confirmed = confirm(`Are you sure you want to delete ${selectedProjects.length} project(s)? This action cannot be undone.`);
    
    if (!confirmed) return;
    
    try {
        const deletePromises = selectedProjects.map(projectId => 
            fetch(`/api/project/${projectId}`, { method: 'DELETE' })
        );
        
        await Promise.all(deletePromises);
        
        showStatus('scriptStatus', `✅ ${selectedProjects.length} project(s) deleted successfully.`, 'success');
        refreshProjects();
        
    } catch (error) {
        console.error('Error in bulk delete:', error);
        showStatus('scriptStatus', `❌ Error deleting projects: ${error.message}`, 'error');
    }
}

// Export project data
async function exportProject(projectId, format = 'json') {
    try {
        const response = await fetch(`/api/project/${projectId}`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load project data');
        }
        
        const project = result.project;
        let exportData, filename, mimeType;
        
        switch (format) {
            case 'json':
                exportData = JSON.stringify(project, null, 2);
                filename = `project_${projectId.slice(0, 8)}.json`;
                mimeType = 'application/json';
                break;
            case 'csv':
                exportData = convertProjectToCSV(project);
                filename = `project_${projectId.slice(0, 8)}.csv`;
                mimeType = 'text/csv';
                break;
            default:
                throw new Error('Unsupported export format');
        }
        
        // Download the file
        const blob = new Blob([exportData], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log(`✅ Project exported as ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting project:', error);
        alert('Error exporting project: ' + error.message);
    }
}

function convertProjectToCSV(project) {
    const headers = ['Step', 'Title', 'Speaker', 'Content', 'Narration', 'Duration', 'Visual Type'];
    const rows = [headers];
    
    if (project.lessonSteps) {
        project.lessonSteps.forEach((step, index) => {
            rows.push([
                index + 1,
                step.title || '',
                step.speaker || '',
                (step.content || '') + ' ' + (step.content2 || ''),
                step.narration || '',
                step.visualDuration || 4,
                step.visual?.type || ''
            ]);
        });
    }
    
    return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

// Duplicate project
async function duplicateProject(projectId) {
    try {
        const response = await fetch(`/api/project/${projectId}/duplicate`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('scriptStatus', '✅ Project duplicated successfully!', 'success');
            refreshProjects();
        } else {
            throw new Error(result.error || 'Failed to duplicate project');
        }
        
    } catch (error) {
        console.error('❌ Error duplicating project:', error);
        alert('Error duplicating project: ' + error.message);
    }
}

// Project statistics
function getProjectStatistics() {
    if (!allProjects || allProjects.length === 0) {
        return {
            total: 0,
            completed: 0,
            scriptReady: 0,
            inputOnly: 0,
            empty: 0,
            totalSteps: 0,
            totalVideos: 0
        };
    }
    
    return {
        total: allProjects.length,
        completed: allProjects.filter(p => p.status === 'completed').length,
        scriptReady: allProjects.filter(p => p.status === 'script_ready').length,
        inputOnly: allProjects.filter(p => p.status === 'input_only').length,
        empty: allProjects.filter(p => p.status === 'empty').length,
        totalSteps: allProjects.reduce((sum, p) => sum + p.lessonStepsCount, 0),
        totalVideos: allProjects.filter(p => p.hasVideo).length
    };
}

// Display project statistics (optional feature)
function displayProjectStatistics() {
    const stats = getProjectStatistics();
    console.log('📊 Project Statistics:', stats);
    
    // You can display this in the UI if needed
    return stats;
}