document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatForm = document.getElementById('chatForm');
    const chatMessages = document.getElementById('chatMessages');
    const chatContainer = document.getElementById('chatContainer');
    
    // Set initial timestamp for welcome message
    document.getElementById('welcomeTimestamp').textContent = getCurrentTime();

    // Auto-resize the textarea based on content
    chatInput.addEventListener('input', function() {
        // Reset height to recalculate
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        
        // Toggle button state
        if (this.value.trim() !== '') {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    });

    // Handle Enter key for submission, Shift+Enter for new line
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default new line
            if (chatInput.value.trim() !== '') {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // Form Submit Event Handler
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const question = chatInput.value.trim();
        if (!question) return;

        // Visual reset immediately after storing the value
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');
        
        // Add the user's message to the UI
        addMessage(question, 'user');

        // Show typing indicator while waiting for response
        const typingId = showTypingIndicator();

        try {
            // Configure Request Options
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question })
            };

            // Call the local backend endpoint
            const response = await fetch('https://akhilbhatt768-campusai.hf.space/query', requestOptions);

            // Hide typing indicator when request finishes
            removeElement(typingId);

            if (!response.ok) {
                throw new Error(`Connection failed with status ${response.status}`);
            }

            const data = await response.json();
            
            // Accommodate expected/common JSON response keys 
            const answer = data.answer || data.response || data.message || Object.values(data)[0];
            const citations = data.citation || data.citations || data.source || null;

            if (answer) {
                addMessage(answer, 'ai', false, citations);
            } else {
                addMessage("I'm sorry, I couldn't process an answer from the backend.", 'ai', true);
            }

        } catch (error) {
            console.error('Error fetching API:', error);
            removeElement(typingId);
            
            // Display Error Message smoothly
            const errorMsg = `Failed to connect with CampusAI Backend. Please ensure the server is running on http://localhost:8000.\n\nDetail: ${error.message}`;
            addMessage(errorMsg, 'ai', true);
        }
    });

    /**
     * Appends a new message bubble to the chat container
     * @param {string} text - The message body
     * @param {string} sender - 'user' or 'ai'
     * @param {boolean} isError - Triggers error styling
     * @param {string|Array} citations - Citation text or links
     */
    function addMessage(text, sender, isError = false, citations = null) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${sender}-message`;

        const timeString = getCurrentTime();

        let avatarHtml = '';
        if (sender === 'ai') {
            avatarHtml = `
                <div class="message-avatar">
                    <div class="logo-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                        <i class="bi bi-robot"></i>
                    </div>
                </div>
            `;
        }

        const errorClass = isError ? 'error' : '';
        const safeText = escapeHtml(text).replace(/\n/g, '<br>');
        
        let citationHtml = '';
        if (citations) {
            // Support strings or arrays of citations
            const citationText = typeof citations === 'string' ? citations : JSON.stringify(citations);
            citationHtml = `
                <div class="citation-box">
                    <i class="bi bi-journal-text"></i> <em>Source: ${escapeHtml(citationText)}</em>
                </div>
            `;
        }

        messageWrapper.innerHTML = `
            ${avatarHtml}
            <div class="message-content">
                <div class="message-bubble ${errorClass}">
                    <p class="mb-0">${safeText}</p>
                </div>
                ${citationHtml}
                <div class="message-meta">
                    <span class="timestamp">${timeString}</span>
                </div>
            </div>
        `;

        chatMessages.appendChild(messageWrapper);
        scrollToBottom();
    }

    /**
     * Appends an animated typing indicator
     * @returns {string} ID of typing elements wrapper to remove later
     */
    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ai-message`;
        messageWrapper.id = id;

        messageWrapper.innerHTML = `
            <div class="message-avatar">
                <div class="logo-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                    <i class="bi bi-robot"></i>
                </div>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;

        chatMessages.appendChild(messageWrapper);
        scrollToBottom();
        return id;
    }

    // Helper functions
    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
});
