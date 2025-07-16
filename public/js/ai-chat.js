/**
 * AI Chat Module for Visual Function Editing
 * Uses Claude AI to improve and modify visual functions
 */

class AIChatManager {
    constructor() {
        this.currentSlideIndex = 0;
        this.currentSlide = null;
        this.currentVisualFunction = null;
        this.chatHistory = [];
        this.isProcessing = false;
    }

    // Get current slide data safely
    getCurrentSlideData() {
        // Try to get from global variables
        if (typeof currentSlideIndex !== 'undefined' && slides && slides[currentSlideIndex]) {
            return {
                index: currentSlideIndex,
                slide: slides[currentSlideIndex]
            };
        }
        
        // Try to get from selected slide in UI
        const activeSlideItem = document.querySelector('.slide-item.active');
        if (activeSlideItem && slides) {
            const slideElements = document.querySelectorAll('.slide-item');
            const index = Array.from(slideElements).indexOf(activeSlideItem);
            if (index >= 0 && slides[index]) {
                return {
                    index: index,
                    slide: slides[index]
                };
            }
        }
        
        // Fallback to first slide if available
        if (slides && slides.length > 0) {
            return {
                index: 0,
                slide: slides[0]
            };
        }
        
        return null;
    }

    // Initialize chat for current slide
    initializeChat(slideIndex = null, slide = null) {
        // Try to get current slide data if not provided
        if (slideIndex === null || slide === null) {
            const currentData = this.getCurrentSlideData();
            if (currentData) {
                slideIndex = currentData.index;
                slide = currentData.slide;
            }
        }
        
        if (!slide) {
            console.error('❌ Cannot initialize AI chat: No slide data available');
            this.showNoSlideError();
            return false;
        }
        
        this.currentSlideIndex = slideIndex;
        this.currentSlide = slide;
        this.currentVisualFunction = this.extractCurrentVisualFunction(slide);
        
        console.log(`🤖 AI Chat initialized for slide ${slideIndex + 1}:`, slide.title);
        console.log(`🎨 Current visual function:`, slide.visual?.type);
        
        this.populateChatWindow();
        return true;
    }

    // Show error when no slide is available
    showNoSlideError() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="chat-message assistant">
                <strong>🤖 AI Assistant:</strong><br>
                ❌ No slide is currently selected. Please select a slide first and try again.
                <br><br>
                <button onclick="aiChat.retryInitialization()" 
                        style="background: #1976d2; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                    🔄 Retry
                </button>
            </div>
        `;
    }

    // Retry initialization
    retryInitialization() {
        const success = this.initializeChat();
        if (!success) {
            this.showNoSlideError();
        }
    }

    // Extract the current visual function code
    extractCurrentVisualFunction(slide) {
        if (!slide.visual || !slide.visual.type) {
            return null;
        }

        const functionName = slide.visual.type;
        
        // Try to get from currentVisualFunctions first
        if (typeof currentVisualFunctions !== 'undefined' && currentVisualFunctions && currentVisualFunctions[functionName]) {
            const func = currentVisualFunctions[functionName];
            return {
                name: functionName,
                code: func.toString(),
                params: slide.visual.params || []
            };
        }

        // Fallback: generate a placeholder function
        return {
            name: functionName,
            code: `function ${functionName}(ctx, param1, param2) {
    // This is a placeholder function
    ctx.save();
    ctx.fillStyle = '#3498db';
    ctx.fillRect(300, 300, 400, 200);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('${functionName}', 500, 410);
    ctx.restore();
}`,
            params: slide.visual.params || []
        };
    }

    // Populate chat window with current context
    populateChatWindow() {
        const chatMessages = document.getElementById('chatMessages');
        
        if (!this.currentVisualFunction) {
            chatMessages.innerHTML = `
                <div class="chat-message assistant">
                    <strong>🤖 AI Assistant:</strong><br>
                    This slide doesn't have a visual function. I can help you create one! 
                    What kind of educational diagram would you like to add?
                    <br><br>
                    <strong>Slide:</strong> ${this.currentSlide?.title || 'Unknown'}
                </div>
            `;
        } else {
            chatMessages.innerHTML = `
                <div class="chat-message assistant">
                    <strong>🤖 AI Assistant:</strong><br>
                    I can see you have a visual function called <code>${this.currentVisualFunction.name}</code>. 
                    I can help you modify it, improve it, or completely redesign it. 
                    What changes would you like me to make?
                    <br><br>
                    <strong>Slide:</strong> ${this.currentSlide?.title || 'Unknown'}
                    <br><br>
                    <strong>Current function:</strong>
                    <div style="background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 5px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto;">
                        ${this.formatCodeForDisplay(this.currentVisualFunction.code)}
                    </div>
                </div>
            `;
        }

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Format code for display
    formatCodeForDisplay(code) {
        return code
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/  /g, '&nbsp;&nbsp;');
    }

    // Send message to AI with better error handling
    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message || this.isProcessing) {
            return;
        }

        // Ensure we have current slide data
        if (!this.currentSlide) {
            const success = this.initializeChat();
            if (!success) {
                this.addMessageToChat('assistant', '❌ No slide is currently selected. Please select a slide first.');
                return;
            }
        }

        this.isProcessing = true;
        chatInput.value = '';
        chatInput.disabled = true;

        // Add user message to chat
        this.addMessageToChat('user', message);
        
        // Show processing indicator
        this.addMessageToChat('assistant', '🤖 Thinking...', 'processing');

        try {
            // Prepare context for AI
            const context = this.prepareAIContext(message);
            
            // Send to AI
            const response = await this.callClaudeAI(context);
            
            // Remove processing message
            this.removeProcessingMessage();
            
            // Parse and handle AI response
            await this.handleAIResponse(response, message);

        } catch (error) {
            console.error('❌ AI Chat Error:', error);
            this.removeProcessingMessage();
            
            let errorMessage = 'Sorry, I encountered an error. Please try again.';
            if (error.message.includes('API key')) {
                errorMessage = 'AI service is not configured. Please contact support.';
            } else if (error.message.includes('rate limit')) {
                errorMessage = 'Too many requests. Please wait a moment and try again.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            
            this.addMessageToChat('assistant', `❌ ${errorMessage}`);
        } finally {
            this.isProcessing = false;
            chatInput.disabled = false;
            chatInput.focus();
        }
    }

    // Prepare context for AI with null checks
    prepareAIContext(userMessage) {
        // Safely access slide properties with fallbacks
        const slideContext = {
            slideNumber: (this.currentSlideIndex || 0) + 1,
            title: this.currentSlide?.title || 'Untitled Slide',
            content: this.currentSlide?.content || 'No content',
            content2: this.currentSlide?.content2 || '',
            narration: this.currentSlide?.narration || 'No narration',
            speaker: this.currentSlide?.speaker || 'unknown',
            visual: this.currentSlide?.visual || null
        };

        const prompt = `You are an expert at creating HTML5 Canvas drawing functions for educational videos.

CURRENT SLIDE CONTEXT:
- Slide ${slideContext.slideNumber}: "${slideContext.title}"
- Content: "${slideContext.content}"
- Additional Content: "${slideContext.content2}"
- Narration: "${slideContext.narration}"
- Speaker: ${slideContext.speaker}

CURRENT VISUAL FUNCTION:
${this.currentVisualFunction ? `
Function Name: ${this.currentVisualFunction.name}
Parameters: ${JSON.stringify(this.currentVisualFunction.params)}

Current Code:
\`\`\`javascript
${this.currentVisualFunction.code}
\`\`\`
` : 'No visual function currently exists for this slide.'}

USER REQUEST: "${userMessage}"

REQUIREMENTS:
1. Create or modify a JavaScript function that draws educational content using HTML5 Canvas
2. The function should accept (ctx, ...params) as parameters
3. Use canvas drawing commands: ctx.beginPath, ctx.arc, ctx.fillRect, ctx.strokeRect, etc.
4. Ensure all coordinates fit within the media area: x: 200, y: 200, width: 600, height: 400
5. Use ctx.save() and ctx.restore() to preserve context state
6. Make the drawing educational, clear, and relevant to the slide content
7. Use appropriate colors, fonts, and layouts
8. Return ONLY the complete JavaScript function code - no explanations or markdown

IMPORTANT: Respond with ONLY the JavaScript function code. Start with "function" and end with the closing brace.`;

        return prompt;
    }

    // Call Claude AI
    async callClaudeAI(prompt) {
        const response = await fetch('/api/ai-chat/visual-edit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                slideIndex: this.currentSlideIndex,
                projectId: (typeof currentProject !== 'undefined' && currentProject) ? currentProject.projectId : null
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'AI request failed');
        }

        return result.updatedCode;
    }

    // Handle AI response
    async handleAIResponse(updatedCode, userMessage) {
        try {
            // Validate the response
            if (!updatedCode || typeof updatedCode !== 'string') {
                throw new Error('Invalid response from AI');
            }

            // Extract function name from code
            const functionNameMatch = updatedCode.match(/function\s+(\w+)\s*\(/);
            if (!functionNameMatch) {
                throw new Error('Could not extract function name from AI response');
            }

            const functionName = functionNameMatch[1];
            
            // Show the updated code to user
            this.addMessageToChat('assistant', `✅ I've updated the visual function! Here's the new code:

<div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; font-family: monospace; font-size: 12px; max-height: 300px; overflow-y: auto; border-left: 4px solid #28a745;">
${this.formatCodeForDisplay(updatedCode)}
</div>

<div style="margin-top: 15px;">
<button onclick="aiChat.applyUpdatedFunction('${functionName}', \`${this.escapeForInlineJS(updatedCode)}\`)" 
        style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
    ✅ Apply Changes
</button>
<button onclick="aiChat.previewUpdatedFunction('${functionName}', \`${this.escapeForInlineJS(updatedCode)}\`)" 
        style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
    👁️ Preview Only
</button>
</div>`);

            // Store the updated function for potential application
            this.pendingUpdate = {
                functionName: functionName,
                code: updatedCode,
                userMessage: userMessage
            };

        } catch (error) {
            console.error('❌ Error handling AI response:', error);
            this.addMessageToChat('assistant', `❌ Error processing the AI response: ${error.message}. Please try a different request.`);
        }
    }

    // Escape code for inline JavaScript
    escapeForInlineJS(code) {
        return code
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$/g, '\\$');
    }

    // Preview updated function
    async previewUpdatedFunction(functionName, code) {
        try {
            console.log(`👁️ Previewing updated function: ${functionName}`);
            
            // Create temporary function
            const tempFunction = new Function('ctx', 'param1', 'param2', 'param3', 
                code.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, '').replace(/\}$/, '')
            );

            // Temporarily update currentVisualFunctions
            let originalFunction = null;
            if (typeof currentVisualFunctions !== 'undefined' && currentVisualFunctions) {
                originalFunction = currentVisualFunctions[functionName];
                currentVisualFunctions[functionName] = tempFunction;
            }

            // Update the preview if updateSlidePreview function exists
            if (typeof updateSlidePreview === 'function' && this.currentSlide) {
                updateSlidePreview(this.currentSlide, this.currentSlideIndex);
            }

            // Restore original function after a delay
            setTimeout(() => {
                if (typeof currentVisualFunctions !== 'undefined' && currentVisualFunctions) {
                    if (originalFunction) {
                        currentVisualFunctions[functionName] = originalFunction;
                    } else {
                        delete currentVisualFunctions[functionName];
                    }
                }
                console.log(`🔄 Restored original function for preview: ${functionName}`);
                
                // Refresh preview
                if (typeof updateSlidePreview === 'function' && this.currentSlide) {
                    updateSlidePreview(this.currentSlide, this.currentSlideIndex);
                }
            }, 5000);

            this.addMessageToChat('assistant', '👁️ Preview applied! The preview will revert to the original in 5 seconds. Click "Apply Changes" to make it permanent.');

        } catch (error) {
            console.error('❌ Error previewing function:', error);
            this.addMessageToChat('assistant', `❌ Preview failed: ${error.message}`);
        }
    }

    // Apply updated function permanently
    async applyUpdatedFunction(functionName, code) {
        try {
            console.log(`✅ Applying updated function: ${functionName}`);
            
            // Create the new function
            const newFunction = new Function('ctx', 'param1', 'param2', 'param3', 
                code.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, '').replace(/\}$/, '')
            );

            // Update currentVisualFunctions
            if (typeof currentVisualFunctions !== 'undefined') {
                if (!currentVisualFunctions) {
                    currentVisualFunctions = {};
                }
                currentVisualFunctions[functionName] = newFunction;
            }

            // Update the slide's visual reference if needed
            if (this.currentSlide) {
                if (this.currentSlide.visual && this.currentSlide.visual.type === functionName) {
                    // Visual function name is already correct
                } else if (!this.currentSlide.visual) {
                    // Add visual function to slide
                    this.currentSlide.visual = {
                        type: functionName,
                        params: []
                    };
                } else {
                    // Update visual function name
                    this.currentSlide.visual.type = functionName;
                }

                // Update slides array if it exists
                if (typeof slides !== 'undefined' && slides && this.currentSlideIndex < slides.length) {
                    slides[this.currentSlideIndex] = this.currentSlide;
                }
            }

            // Update the preview
            if (typeof updateSlidePreview === 'function' && this.currentSlide) {
                updateSlidePreview(this.currentSlide, this.currentSlideIndex);
            }

            // Update the slide editor display if functions exist
            if (typeof populateSlides === 'function') {
                populateSlides();
            }
            if (typeof selectSlide === 'function') {
                selectSlide(this.currentSlideIndex);
            }

            this.addMessageToChat('assistant', '✅ Changes applied successfully! The visual function has been updated and the preview refreshed.');

            // Clear pending update
            this.pendingUpdate = null;

        } catch (error) {
            console.error('❌ Error applying function:', error);
            this.addMessageToChat('assistant', `❌ Failed to apply changes: ${error.message}`);
        }
    }

    // Add message to chat
    addMessageToChat(sender, message, messageId = null) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${sender}`;
        if (messageId) {
            messageEl.id = messageId;
        }
        
        if (sender === 'user') {
            messageEl.innerHTML = `<strong>You:</strong><br>${message}`;
        } else {
            messageEl.innerHTML = message;
        }
        
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Remove processing message
    removeProcessingMessage() {
        const processingMsg = document.getElementById('processing');
        if (processingMsg) {
            processingMsg.remove();
        }
    }

    // Handle enter key in chat input
    handleChatKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }
}

// Create global instance
const aiChat = new AIChatManager();

// Enhanced toggle chat function
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) {
        console.error('❌ Chat window not found');
        return;
    }
    
    const isVisible = chatWindow.style.display !== 'none';
    
    if (isVisible) {
        chatWindow.style.display = 'none';
    } else {
        chatWindow.style.display = 'block';
        
        // Initialize chat for current slide
        const success = aiChat.initializeChat();
        if (!success) {
            console.warn('⚠️ Could not initialize AI chat with current slide data');
        }
    }
}

// Enhanced send chat message function
function sendChatMessage() {
    aiChat.sendMessage();
}

// Handle enter key in chat input
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(event) {
            aiChat.handleChatKeyPress(event);
        });
    }
});

// Make functions globally available
window.aiChat = aiChat;
window.toggleChat = toggleChat;
window.sendChatMessage = sendChatMessage;