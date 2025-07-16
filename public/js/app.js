// Main App Initialization JavaScript

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Educational Video Generator Starting...');
    
    // Initialize drag and drop functionality
    initializeDragAndDrop();
    
    // Initialize chat functionality
    initializeChatInput();
    
    // Initialize with projects tab
    showTab('projects');
    
    console.log('✨ Enhanced Educational Video Generator Loaded!');
    console.log('🆕 Features: Project Management, Resume Functionality, Video Playback');
    console.log('🎨 NEW: Visual Preview System with Canvas Rendering!');
    console.log('📄 NEW: PDF Export Functionality Added!');
    
    // Check server health on startup
    checkServerHealth();
});

// Initialize drag and drop functionality
function initializeDragAndDrop() {
    const fileUpload = document.querySelector('.file-upload');
    
    if (fileUpload) {
        fileUpload.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.backgroundColor = '#e3f2fd';
        });
        
        fileUpload.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.backgroundColor = '';
        });
        
        fileUpload.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.backgroundColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        document.getElementById('contentInput').value = event.target.result;
                    };
                    reader.readAsText(file);
                } else {
                    showStatus('scriptStatus', 'Please upload a .md or .txt file.', 'error');
                }
            }
        });
    }
}

// Initialize chat input functionality
function initializeChatInput() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
}

// Check server health
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Server health check passed');
            console.log(`📊 Projects in memory: ${result.projects}`);
            console.log(`🔑 API Keys: Anthropic=${result.env.hasAnthropicKey}, Smallest=${result.env.hasSmallestKey}`);
        } else {
            console.warn('⚠️ Server health check failed');
        }
    } catch (error) {
        console.error('❌ Server health check error:', error);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter in content textarea to generate script
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const contentInput = document.getElementById('contentInput');
        if (document.activeElement === contentInput && contentInput.value.trim()) {
            if (workflowMode === 'simple') {
                generateCompleteVideo();
            } else {
                generateScript();
            }
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});

// Auto-save functionality for content input
let autoSaveTimeout;
document.addEventListener('input', function(e) {
    if (e.target.id === 'contentInput') {
        // Clear existing timeout
        clearTimeout(autoSaveTimeout);
        
        // Set new timeout for auto-save
        autoSaveTimeout = setTimeout(() => {
            const content = e.target.value.trim();
            if (content) {
                // Save to localStorage as backup
                localStorage.setItem('videoGenerator_autoSave', content);
                console.log('💾 Content auto-saved to localStorage');
            }
        }, 2000); // Save after 2 seconds of inactivity
    }
});

// Load auto-saved content on page load
window.addEventListener('load', function() {
    const autoSavedContent = localStorage.getItem('videoGenerator_autoSave');
    const contentInput = document.getElementById('contentInput');
    
    if (autoSavedContent && contentInput && !contentInput.value.trim()) {
        contentInput.value = autoSavedContent;
        console.log('📂 Auto-saved content restored');
        
        // Show notification
        setTimeout(() => {
            showStatus('scriptStatus', '📂 Auto-saved content restored from previous session', 'info');
            setTimeout(() => hideStatus('scriptStatus'), 3000);
        }, 1000);
    }
});

// Error handling for fetch requests
window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Unhandled promise rejection:', e.reason);
    
    // Show user-friendly error message
    if (e.reason && e.reason.message) {
        showStatus('scriptStatus', `❌ Error: ${e.reason.message}`, 'error');
    }
});

// Performance monitoring
let performanceMetrics = {
    scriptGeneration: [],
    videoGeneration: [],
    projectLoad: []
};

// Helper function to log performance
function logPerformance(operation, startTime) {
    const duration = Date.now() - startTime;
    
    if (performanceMetrics[operation]) {
        performanceMetrics[operation].push(duration);
    }
    
    console.log(`⚡ ${operation} completed in ${duration}ms`);
    
    // Keep only last 10 measurements
    if (performanceMetrics[operation] && performanceMetrics[operation].length > 10) {
        performanceMetrics[operation] = performanceMetrics[operation].slice(-10);
    }
}

// Debounce function for search/filter functionality
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add loading states to buttons
function addLoadingState(buttonElement, originalText) {
    buttonElement.disabled = true;
    buttonElement.textContent = '🔄 Loading...';
    
    return function removeLoadingState() {
        buttonElement.disabled = false;
        buttonElement.textContent = originalText;
    };
}

// Utility function for copying text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('📋 Text copied to clipboard');
        return true;
    } catch (error) {
        console.error('❌ Failed to copy to clipboard:', error);
        return false;
    }
}

// Check for browser compatibility
function checkBrowserCompatibility() {
    const requiredFeatures = [
        'fetch',
        'Promise',
        'localStorage',
        'Canvas'
    ];
    
    const unsupportedFeatures = requiredFeatures.filter(feature => {
        switch (feature) {
            case 'fetch':
                return !window.fetch;
            case 'Promise':
                return !window.Promise;
            case 'localStorage':
                return !window.localStorage;
            case 'Canvas':
                return !document.createElement('canvas').getContext;
            default:
                return false;
        }
    });
    
    if (unsupportedFeatures.length > 0) {
        console.warn('⚠️ Browser compatibility issues:', unsupportedFeatures);
        alert('Your browser may not support all features. Please use a modern browser like Chrome, Firefox, or Safari.');
    } else {
        console.log('✅ Browser compatibility check passed');
    }
}

// Run browser compatibility check
checkBrowserCompatibility();

// Export functions for global access
window.videoGenerator = {
    // Core functions
    showTab,
    goToStep,
    selectWorkflow,
    
    // Project functions
    loadProjects,
    refreshProjects,
    openProject,
    deleteProject,
    resumeProject,
    editProjectScript,
    
    // Workflow functions
    generateCompleteVideo,
    generateScriptOnly,
    generateScript,
    generateVideo,
    
    // Utility functions
    showStatus,
    hideStatus,
    showProgress,
    hideProgress,
    downloadVideo,
    downloadPDF,
    
    // Data
    currentProject: () => currentProject,
    slides: () => slides,
    performanceMetrics: () => performanceMetrics
};

console.log('🎬 Video Generator API exposed on window.videoGenerator');
console.log('💡 Use window.videoGenerator to access functions programmatically');