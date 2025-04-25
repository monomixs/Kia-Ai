// DOM Elements
const usernameDialog = document.getElementById('username-dialog');
const usernameInput = document.getElementById('username-input');
const submitUsername = document.getElementById('submit-username');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const historyBtn = document.getElementById('history-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const settingsBtn = document.getElementById('settings-btn');
const historySidebar = document.getElementById('history-sidebar');
const settingsSidebar = document.getElementById('settings-sidebar');
const closeHistory = document.getElementById('close-history');
const closeSettings = document.getElementById('close-settings');
const chatHistoryList = document.getElementById('chat-history-list');
const themeButtons = document.querySelectorAll('.theme-btn');
const showScrollbarCheckbox = document.getElementById('show-scrollbar');

// State variables
const apiKey = "AIzaSyDOz6JfqZ7ywz1Is7eg5Fv7_0FFNamTZ6Y"; // API key hardcoded
let username = localStorage.getItem('chat_username') || '';
let currentChatId = generateUniqueId();
let chatHistory = JSON.parse(localStorage.getItem('chat_history')) || [];
const supportedLanguages = [
    'Python', 'JavaScript', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust', 'Kotlin', 'Swift', 
    'TypeScript', 'Ruby', 'PHP', 'HTML', 'CSS', 'SQL', 'Bash', 'PowerShell', 'Perl', 'R', 
    'Dart', 'Lua', 'Haskell', 'Scala', 'Elixir', 'Julia', 'Groovy', 'Objective-C', 'F#', 
    'Shell', 'XML', 'YAML', 'JSON', 'Visual Basic', 'Assembly', 'VHDL', 'Verilog', 'COBOL', 
    'Fortran', 'Scratch', 'Ada', 'Nim', 'D', 'Crystal', 'OCaml', 'Elm', 'Lisp', 'Scheme', 
    'Common Lisp', 'Prolog', 'Smalltalk', 'Eiffel', 'Rexx', 'AWK', 'PostScript', 'ActionScript', 
    'LabVIEW', 'Mathematica', 'Wolfram', 'T-SQL', 'PL/SQL', 'Apex', 'Solidity', 'Vyper', 'Hack', 
    'CoffeeScript', 'LiveScript', 'Q#', 'Zig', 'Ballerina', 'Red', 'PureScript', 'PASCAL', 
    'Delphi', 'Logo', 'Modula-2', 'Simula', 'Mercury', 'Boo', 'Io', 'Ring', 'Pony', 'Tcl', 
    'Haxe', 'Algol', 'Datalog', 'Falcon', 'Oz', 'Genie', 'MoonScript', 'Rebol', 'Pike', 'Xojo', 
    'Harbour', 'Inform', 'Max/MSP', 'Vala', 'OpenCL', 'GLSL', 'Brainfuck'
];

// Initialize the app
function init() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'default';
    document.body.setAttribute('data-theme', savedTheme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }
    });
    
    // Check for scrollbar visibility setting
    const showScrollbar = localStorage.getItem('show_scrollbar') === 'true';
    showScrollbarCheckbox.checked = showScrollbar;
    
    // Create custom scrollbar
    createCustomScrollbar();
    
    // Check if username is not set
    if (!username) {
        showUsernameDialog();
    } else {
        // Get the initial conversation history, which now includes our Gen Z greeting
        const initialHistory = initializeConversationHistory();
        
        // Initialize with our Gen Z style welcome message
        addAIMessage(initialHistory[1].parts[0].text);
        
        // Generate a new chat ID for this session
        currentChatId = generateUniqueId();
        
        // Save this conversation history to localStorage
        saveConversationHistory(initialHistory);
        
        // Update chat history list
        updateChatHistoryList();
    }
    
    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Username dialog
    submitUsername.addEventListener('click', handleUsernameSubmission);
    usernameInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleUsernameSubmission();
    });
    
    // Chat input
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight < 150) ? chatInput.scrollHeight + 'px' : '150px';
    });
    
    // Navigation buttons
    historyBtn.addEventListener('click', toggleHistorySidebar);
    settingsBtn.addEventListener('click', toggleSettingsSidebar);
    newChatBtn.addEventListener('click', startNewChat);
    closeHistory.addEventListener('click', () => historySidebar.classList.remove('visible'));
    closeSettings.addEventListener('click', () => settingsSidebar.classList.remove('visible'));
    
    // Theme buttons
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Update active state
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Scrollbar visibility toggle
    showScrollbarCheckbox.addEventListener('change', () => {
        const isVisible = showScrollbarCheckbox.checked;
        localStorage.setItem('show_scrollbar', isVisible);
        const scrollbar = document.querySelector('.custom-scrollbar');
        if (scrollbar) {
            scrollbar.classList.toggle('visible', isVisible);
        }
    });
    
    // Handle window resize for custom scrollbar
    window.addEventListener('resize', updateScrollbarThumbPosition);
}

function handleUsernameSubmission() {
    const name = usernameInput.value.trim();
    if (name) {
        username = name;
        localStorage.setItem('chat_username', username);
        usernameDialog.classList.add('hidden');
        
        // Get the initial conversation history with Gen Z style welcome message
        const initialHistory = initializeConversationHistory();
        
        // Add the Gen Z style welcome message
        addAIMessage(initialHistory[1].parts[0].text);
        
        // Generate a new chat ID for this session
        currentChatId = generateUniqueId();
        
        // Save this conversation history to localStorage
        saveConversationHistory(initialHistory);
    } else {
        usernameInput.focus();
        animateShake(usernameInput);
    }
}

function showUsernameDialog() {
    usernameInput.value = username;
    usernameDialog.classList.remove('hidden');
    usernameInput.focus();
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addUserMessage(message);
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        // Call the Gemini API
        const response = await callGeminiAPI(message);
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Process and display the AI response
        if (response) {
            addAIMessage(response);
            
            // Save chat to history
            saveMessageToHistory(message, response);
            
            // Update history sidebar if open
            if (historySidebar.classList.contains('visible')) {
                updateChatHistoryList();
            }
        } else {
            throw new Error('No response from AI');
        }
    } catch (error) {
        console.error('Error:', error);
        typingIndicator.remove();
        addAIMessage("I'm sorry, I encountered an error while processing your request. Please try again.");
    }
    
    // Scroll to bottom
    scrollToBottom();
}

async function callGeminiAPI(message) {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        // Load conversation history from localStorage
        let conversationHistory = getConversationHistory();
        
        // Add user message to history
        conversationHistory.push({
            role: 'user',
            parts: [{ text: message }]
        });
        
        // Save immediately to preserve the message
        saveConversationHistory(conversationHistory);
        
        // For the API call, use a context window of the most recent messages
        // Using more messages (30+) provides more memory but may hit token limits
        // with very long conversations
        const messageHistory = conversationHistory.slice(-30);
        
        const payload = {
            contents: messageHistory,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message || 'API Error');
        }
        
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            
            // Extract the response
            const aiResponse = data.candidates[0].content.parts[0].text;
            
            // Add AI response to conversation history
            conversationHistory.push({
                role: 'model',
                parts: [{ text: aiResponse }]
            });
            
            // Save updated history with the AI's response
            saveConversationHistory(conversationHistory);
            
            return aiResponse;
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('API Error:', error);
        return "I'm sorry, I couldn't process your request. " + error.message;
    }
}

// Helper functions for conversation memory management
function getConversationHistory() {
    // Each chat has its own conversation history
    const chatId = currentChatId || generateUniqueId();
    
    // Try to load existing history
    try {
        const storedHistory = localStorage.getItem(`chat_memory_${chatId}`);
        if (storedHistory) {
            return JSON.parse(storedHistory);
        }
    } catch (e) {
        console.error('Error loading conversation history:', e);
    }
    
    // If no history or error, initialize with a system prompt
    return initializeConversationHistory();
}

function saveConversationHistory(history) {
    if (!history || !Array.isArray(history)) return;
    
    try {
        // Each chat has its own memory
        localStorage.setItem(`chat_memory_${currentChatId}`, JSON.stringify(history));
        
        // If we're approaching storage limits, trim older messages while preserving context
        if (isLocalStorageAlmostFull()) {
            trimOldestMessages(history);
        }
    } catch (e) {
        console.error('Error saving conversation history:', e);
        // If storage is full, emergency trim
        if (e.name === 'QuotaExceededError') {
            emergencyTrimHistory(history);
        }
    }
}

function initializeConversationHistory() {
    // Start with a system prompt that instructs the AI to remember the conversation
    // and to respond in a more "manly" Gen Z professional style
    return [
        {
            role: 'user',
            parts: [{ text: `You are a professional AI assistant named Kia that talks like a Gen Z man. Use modern slang, abbreviations, and casual language while still providing accurate, helpful information. Keep your tone friendly but professional. Your style should be more "masculine" - direct, confident, and occasionally using phrases like "bro", "straight fire", "facts", "bet", "dope", "lit", "king", "boss moves", etc. Avoid being too dramatic or emotional. Use confident language, talk about "grinding", "hustling", "gains", "leveling up", and similar concepts that reflect ambition. Begin your first message by saying exactly "sup bro my name is Kia, how may i help you today?".` }]
        },
        {
            role: 'model',
            parts: [{ text: `sup bro my name is Kia, how may i help you today?` }]
        }
    ];
}

function isLocalStorageAlmostFull() {
    // Estimate localStorage usage (technique to detect when we're approaching the 5MB limit)
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        total += key.length + value.length;
    }
    
    // If we're using more than 4MB (80% of typical 5MB limit), return true
    return total > 4 * 1024 * 1024;
}

function trimOldestMessages(history) {
    if (history.length <= 10) return; // Don't trim if already small
    
    // Keep the first message (system prompt) and the 29 most recent messages
    const trimmed = [history[0]].concat(history.slice(-29));
    
    // Save the trimmed history
    localStorage.setItem(`chat_memory_${currentChatId}`, JSON.stringify(trimmed));
}

function emergencyTrimHistory(history) {
    // Drastic memory reduction - keep only first message and 9 most recent
    if (history.length <= 5) return;
    
    const trimmed = [history[0]].concat(history.slice(-4));
    
    try {
        localStorage.setItem(`chat_memory_${currentChatId}`, JSON.stringify(trimmed));
    } catch (e) {
        // If still failing, keep only most recent message
        localStorage.setItem(`chat_memory_${currentChatId}`, JSON.stringify([history[history.length - 1]]));
    }
}

function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.style.position = 'relative'; // Make sure position is relative for absolute positioning of copy button
    
    const header = document.createElement('div');
    header.className = 'message-header';
    
    const sender = document.createElement('span');
    sender.className = 'message-sender';
    sender.textContent = username;
    
    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = getCurrentTime();
    
    header.appendChild(sender);
    header.appendChild(time);
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = text;
    
    // Create copy button for user message (positioned at bottom right via CSS)
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-message-button';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtn.title = 'Copy message';
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text)
            .then(() => {
                // Show visual feedback on copy
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                copyBtn.style.animation = 'pulse 0.5s';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                    copyBtn.style.animation = '';
                }, 2000);
            })
            .catch(err => console.error('Failed to copy:', err));
    });
    
    // Add hover animation
    copyBtn.addEventListener('mouseenter', () => {
        copyBtn.style.animation = 'rotate 1s ease-in-out';
    });
    
    copyBtn.addEventListener('mouseleave', () => {
        copyBtn.style.animation = '';
    });
    
    content.appendChild(header);
    content.appendChild(messageText);
    content.appendChild(copyBtn); // Add copy button to content (for bottom right positioning)
    messageDiv.appendChild(content);
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addAIMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.style.position = 'relative'; // Make sure position is relative for absolute positioning of copy button
    
    const header = document.createElement('div');
    header.className = 'message-header';
    
    const sender = document.createElement('span');
    sender.className = 'message-sender';
    sender.textContent = 'Kia'; // Changed to Kia as requested
    
    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = getCurrentTime();
    
    header.appendChild(sender);
    header.appendChild(time);
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    
    // Process text for formatting
    const formattedText = processMarkdown(text);
    
    messageText.innerHTML = formattedText;
    
    // Create copy button for AI message (positioned at bottom right via CSS)
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-message-button';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtn.title = 'Copy message';
    copyBtn.addEventListener('click', () => {
        // Get the original unformatted text to copy
        navigator.clipboard.writeText(text)
            .then(() => {
                // Show visual feedback on copy
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                copyBtn.style.animation = 'pulse 0.5s';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                    copyBtn.style.animation = '';
                }, 2000);
            })
            .catch(err => console.error('Failed to copy:', err));
    });
    
    // Add hover animation
    copyBtn.addEventListener('mouseenter', () => {
        copyBtn.style.animation = 'rotate 1s ease-in-out';
    });
    
    copyBtn.addEventListener('mouseleave', () => {
        copyBtn.style.animation = '';
    });
    
    content.appendChild(header);
    content.appendChild(messageText);
    content.appendChild(copyBtn); // Add copy button to content (for bottom right positioning)
    
    messageDiv.appendChild(content);
    
    chatMessages.appendChild(messageDiv);
    
    // Process code blocks after adding to DOM
    const codeBlocks = messageText.querySelectorAll('pre code');
    codeBlocks.forEach(formatCodeBlock);
    
    // Make links clickable
    makeLinksClickable(messageText);
    
    // Highlight all code with Prism (this will re-highlight any missed elements)
    if (window.Prism) {
        setTimeout(() => {
            Prism.highlightAllUnder(messageText);
        }, 100);
    }
    
    scrollToBottom();
}

function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-indicator';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span>.</span><span>.</span><span>.</span>';
    
    content.appendChild(dots);
    typingDiv.appendChild(content);
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
    
    return typingDiv;
}

function formatCodeBlock(codeElement) {
    const pre = codeElement.parentElement;
    const code = codeElement.textContent;
    
    // Try to detect the language from the class
    let language = 'plaintext';
    if (codeElement.className) {
        const classes = codeElement.className.split(' ');
        for (const cls of classes) {
            if (cls.startsWith('language-')) {
                language = cls.replace('language-', '');
                break;
            }
        }
    }
    
    // Determine language mapping for Prism
    let prismLanguage = language;
    switch (language.toLowerCase()) {
        case 'js':
            prismLanguage = 'javascript';
            break;
        case 'ts':
            prismLanguage = 'typescript';
            break;
        case 'py':
            prismLanguage = 'python';
            break;
        case 'rb':
            prismLanguage = 'ruby';
            break;
        case 'cs':
            prismLanguage = 'csharp';
            break;
        case 'sh':
        case 'shell':
        case 'terminal':
            prismLanguage = 'bash';
            break;
        case 'c++':
            prismLanguage = 'cpp';
            break;
        case 'md':
            prismLanguage = 'markdown';
            break;
        case 'yml':
            prismLanguage = 'yaml';
            break;
    }
    
    // Check if language is in our supported list (case-insensitive)
    const foundLanguage = supportedLanguages.find(
        lang => lang.toLowerCase() === language.toLowerCase()
    );
    
    // Set language display and class
    let displayLanguage = language;
    let isSupported = true;
    
    if (foundLanguage) {
        displayLanguage = foundLanguage; // Use the properly cased version
    } else if (language !== 'plaintext') {
        // Mark unsupported languages as notes
        displayLanguage = 'Note';
        isSupported = false;
    }
    
    // Create a new code block with our styling
    const codeBlock = document.createElement('div');
    codeBlock.className = 'code-block';
    
    // Add animation for the code block
    codeBlock.style.animation = 'fadeIn 0.8s ease, glow 2s ease-in-out infinite';
    
    const codeHeader = document.createElement('div');
    codeHeader.className = 'code-header';
    
    const langSpan = document.createElement('span');
    langSpan.className = 'code-language';
    langSpan.textContent = displayLanguage;
    
    if (!isSupported) {
        langSpan.style.backgroundColor = 'var(--warning-color)';
    }
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'code-actions';
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-button';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtn.title = 'Copy code';
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(code)
            .then(() => {
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                copyBtn.style.animation = 'pulse 0.5s';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                    copyBtn.style.animation = '';
                }, 2000);
            })
            .catch(err => console.error('Failed to copy:', err));
    });
    
    // Add hover animation
    copyBtn.addEventListener('mouseenter', () => {
        copyBtn.style.animation = 'rotate 1s ease-in-out';
    });
    
    copyBtn.addEventListener('mouseleave', () => {
        copyBtn.style.animation = '';
    });
    
    actionsDiv.appendChild(copyBtn);
    codeHeader.appendChild(langSpan);
    codeHeader.appendChild(actionsDiv);
    
    const codeContent = document.createElement('div');
    codeContent.className = 'code-content';
    
    // Create a new pre and code element for Prism.js to highlight
    const newPre = document.createElement('pre');
    newPre.className = 'line-numbers';
    
    const newCode = document.createElement('code');
    newCode.className = `language-${prismLanguage}`;
    newCode.textContent = code;
    
    newPre.appendChild(newCode);
    codeContent.appendChild(newPre);
    
    codeBlock.appendChild(codeHeader);
    codeBlock.appendChild(codeContent);
    
    // Replace the original <pre> with our custom code block
    pre.parentNode.replaceChild(codeBlock, pre);
    
    // Apply Prism highlighting
    if (window.Prism) {
        Prism.highlightElement(newCode);
    }
}

function processMarkdown(text) {
    // Handle code blocks (```code```)
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, function(match, language, code) {
        language = language.trim();
        return `<pre><code class="language-${language}">${escapeHTML(code.trim())}</code></pre>`;
    });
    
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Handle headings (# Title and ## Subtitle)
    text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    
    // Handle bold (**text** or __text__)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Handle italic (*text* or _text_)
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Handle blockquotes
    text = text.replace(/^\s*>(.+)/gm, '<blockquote>$1</blockquote>');
    
    // Handle links (detect URLs)
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    
    // Handle paragraphs (simple)
    const paragraphs = text.split('\n\n');
    return paragraphs.map(p => {
        if (p.trim() && !p.startsWith('<h') && !p.startsWith('<pre') && !p.startsWith('<blockquote')) {
            return `<p>${p}</p>`;
        }
        return p;
    }).join('\n');
}

function makeLinksClickable(element) {
    const links = element.querySelectorAll('a');
    links.forEach(link => {
        if (!link.hasAttribute('target')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

function escapeHTML(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
    updateScrollbarThumbPosition();
}

function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${hours}:${minutes} ${ampm}`;
}

function toggleHistorySidebar() {
    settingsSidebar.classList.remove('visible');
    historySidebar.classList.toggle('visible');
    
    if (historySidebar.classList.contains('visible')) {
        updateChatHistoryList();
    }
}

function toggleSettingsSidebar() {
    historySidebar.classList.remove('visible');
    settingsSidebar.classList.toggle('visible');
}

function startNewChat() {
    // Save current chat if not empty
    if (chatMessages.querySelectorAll('.message').length > 0) {
        saveCurrentChat();
    }
    
    // Clear messages
    chatMessages.innerHTML = '';
    
    // Create new chat ID
    currentChatId = generateUniqueId();
    
    // Initialize memory for this new chat
    // This also resets the conversation history for the new chat
    let newChatHistory = initializeConversationHistory();
    saveConversationHistory(newChatHistory);
    
    // Add welcome message (using the Gen Z style response from our memory system)
    addAIMessage(newChatHistory[1].parts[0].text);
    
    // Update history list if visible
    if (historySidebar.classList.contains('visible')) {
        updateChatHistoryList();
    }
}

function saveCurrentChat() {
    const messages = chatMessages.querySelectorAll('.message');
    if (messages.length === 0) return;
    
    // Extract first user message as title
    let title = "New Chat";
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].classList.contains('user-message')) {
            const text = messages[i].querySelector('.message-text').textContent;
            title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
            break;
        }
    }
    
    // Save HTML content
    const chatContent = chatMessages.innerHTML;
    
    // Add to history
    const chatData = {
        id: currentChatId,
        title: title,
        timestamp: Date.now(),
        content: chatContent
    };
    
    // Update existing or add new
    const existingIndex = chatHistory.findIndex(chat => chat.id === currentChatId);
    if (existingIndex >= 0) {
        chatHistory[existingIndex] = chatData;
    } else {
        chatHistory.push(chatData);
    }
    
    // Save to localStorage
    localStorage.setItem('chat_history', JSON.stringify(chatHistory));
}

function saveMessageToHistory(userMessage, aiResponse) {
    if (chatHistory.length === 0 || 
        !chatHistory.some(chat => chat.id === currentChatId)) {
        // Generate a descriptive title based on the conversation content
        const topic = generateTopicFromConversation(userMessage, aiResponse);
        
        // First message in this chat, create a new entry
        const chatData = {
            id: currentChatId,
            title: topic,
            timestamp: Date.now(),
            content: chatMessages.innerHTML
        };
        chatHistory.push(chatData);
    } else {
        // Update existing chat
        const chatIndex = chatHistory.findIndex(chat => chat.id === currentChatId);
        if (chatIndex >= 0) {
            chatHistory[chatIndex].content = chatMessages.innerHTML;
            chatHistory[chatIndex].timestamp = Date.now();
            
            // Update the title if we have a more comprehensive conversation now
            if (chatMessages.querySelectorAll('.message').length >= 4) {
                const newTopic = generateTopicFromConversation(
                    userMessage, 
                    aiResponse, 
                    chatHistory[chatIndex].title
                );
                chatHistory[chatIndex].title = newTopic;
            }
        }
    }
    
    // Save to localStorage
    localStorage.setItem('chat_history', JSON.stringify(chatHistory));
}

// Helper function to generate a topic from conversation
function generateTopicFromConversation(userMessage, aiResponse, existingTopic = null) {
    // If we already have a good topic, keep it
    if (existingTopic && existingTopic.length > 5 && !existingTopic.includes('...')) {
        return existingTopic;
    }
    
    // Basic topic extraction logic
    // Look for keywords in the user message
    const keywords = [
        'help', 'how', 'what', 'why', 'when', 'where', 'which', 'who',
        'create', 'make', 'build', 'develop', 'design', 'implement',
        'explain', 'describe', 'define', 'compare', 'analyze', 'solve',
        'code', 'program', 'script', 'function', 'app', 'application',
        'website', 'web', 'page', 'site', 'project', 'task', 'problem',
        'bug', 'error', 'issue', 'fix', 'solve', 'solution', 'work',
        'advice', 'suggestion', 'recommendation', 'idea', 'thought',
        'javascript', 'python', 'java', 'react', 'node', 'html', 'css'
    ];
    
    // Extract potential topic phrases from user message
    let topic = '';
    
    // Try to extract a question
    if (userMessage.includes('?')) {
        const questionMatch = userMessage.match(/([^.!?]+\?)/);
        if (questionMatch && questionMatch[1].length < 40) {
            topic = questionMatch[1].trim();
        }
    }
    
    // If no question found or it's too long, look for key phrases
    if (!topic || topic.length > 40) {
        // Check for common patterns
        for (const keyword of keywords) {
            if (userMessage.toLowerCase().includes(keyword)) {
                // Find sentences or phrases containing the keyword
                const sentences = userMessage.split(/[.!?]+/);
                for (const sentence of sentences) {
                    if (sentence.toLowerCase().includes(keyword) && sentence.length < 50) {
                        topic = sentence.trim();
                        break;
                    }
                }
                
                if (topic) break;
            }
        }
    }
    
    // If still no good topic, use the first 5-7 words
    if (!topic || topic.length > 40) {
        const words = userMessage.split(' ');
        topic = words.slice(0, Math.min(7, words.length)).join(' ');
        if (topic.length > 40) {
            topic = topic.substring(0, 37) + '...';
        }
    }
    
    return topic;
}

function updateChatHistoryList() {
    chatHistoryList.innerHTML = '';
    
    if (chatHistory.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'chat-history-item empty';
        emptyItem.textContent = 'No chat history yet';
        chatHistoryList.appendChild(emptyItem);
        return;
    }
    
    // Sort by most recent
    const sortedHistory = [...chatHistory].sort((a, b) => b.timestamp - a.timestamp);
    
    sortedHistory.forEach(chat => {
        const item = document.createElement('li');
        item.className = 'chat-history-item';
        item.dataset.chatId = chat.id;
        
        const title = document.createElement('h4');
        title.textContent = chat.title;
        
        const time = document.createElement('p');
        time.textContent = formatDate(chat.timestamp);
        
        item.appendChild(title);
        item.appendChild(time);
        
        item.addEventListener('click', () => loadChat(chat.id));
        
        chatHistoryList.appendChild(item);
    });
}

function loadChat(chatId) {
    saveCurrentChat(); // Save current chat first
    
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
        // Update the UI from the HTML content stored in chat history
        chatMessages.innerHTML = chat.content;
        
        // Set current chat ID (this is critical for memory system to work)
        currentChatId = chatId;
        
        // Check if we have memory system data for this chat
        const memoryExists = localStorage.getItem(`chat_memory_${chatId}`);
        if (!memoryExists) {
            // If no memory data exists for this chat (older chat from before memory system),
            // build a memory from the current messages on screen
            buildMemoryFromDisplayedMessages();
        }
        
        // Apply syntax highlighting to code blocks
        if (window.Prism) {
            setTimeout(() => {
                // Find all code blocks and apply Prism.js highlighting
                const codeBlocks = chatMessages.querySelectorAll('pre code');
                codeBlocks.forEach(block => {
                    Prism.highlightElement(block);
                });
            }, 100);
        }
        
        // Re-attach event listeners to copy buttons for messages
        reattachCopyButtonListeners();
        
        // Close sidebar
        historySidebar.classList.remove('visible');
        
        // Scroll to bottom
        scrollToBottom();
    }
}

// Function to reattach event listeners to copy buttons after loading a chat
function reattachCopyButtonListeners() {
    // Get all message copy buttons
    const messageCopyButtons = chatMessages.querySelectorAll('.copy-message-button');
    
    messageCopyButtons.forEach(copyBtn => {
        // Clear existing event listeners by cloning the button
        const newCopyBtn = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
        
        // Find the associated message text
        const messageContent = newCopyBtn.closest('.message-content');
        const messageTextElement = messageContent.querySelector('.message-text');
        const text = messageTextElement.textContent || messageTextElement.innerText;
        
        // Add click event listener
        newCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(text)
                .then(() => {
                    // Show visual feedback on copy
                    newCopyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    newCopyBtn.style.animation = 'pulse 0.5s';
                    setTimeout(() => {
                        newCopyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                        newCopyBtn.style.animation = '';
                    }, 2000);
                })
                .catch(err => console.error('Failed to copy:', err));
        });
        
        // Add hover animation
        newCopyBtn.addEventListener('mouseenter', () => {
            newCopyBtn.style.animation = 'rotate 1s ease-in-out';
        });
        
        newCopyBtn.addEventListener('mouseleave', () => {
            newCopyBtn.style.animation = '';
        });
    });
    
    // Now handle code block copy buttons similarly
    const codeCopyButtons = chatMessages.querySelectorAll('.code-block .copy-button');
    
    codeCopyButtons.forEach(copyBtn => {
        // Clear existing event listeners by cloning the button
        const newCopyBtn = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
        
        // Find the associated code content
        const codeBlock = newCopyBtn.closest('.code-block');
        const codeContent = codeBlock.querySelector('.code-content');
        const text = codeContent.textContent || codeContent.innerText;
        
        // Add click event listener
        newCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(text)
                .then(() => {
                    // Show visual feedback on copy
                    newCopyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    newCopyBtn.style.animation = 'pulse 0.5s';
                    setTimeout(() => {
                        newCopyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                        newCopyBtn.style.animation = '';
                    }, 2000);
                })
                .catch(err => console.error('Failed to copy:', err));
        });
    });
}

// Helper function to build memory from visible messages when loading an older chat
function buildMemoryFromDisplayedMessages() {
    // Extract all messages currently in the DOM
    const messages = chatMessages.querySelectorAll('.message');
    if (messages.length === 0) return;
    
    const conversationHistory = [];
    
    // Add the "manly" Gen Z style instruction as the first message
    conversationHistory.push({
        role: 'user',
        parts: [{ text: `You are a professional AI assistant that talks like a Gen Z man. Use modern slang, abbreviations, and casual language while still providing accurate, helpful information. Keep your tone friendly but professional. Your style should be more "masculine" - direct, confident, and occasionally using phrases like "bro", "straight fire", "facts", "bet", "dope", "lit", "king", "boss moves", etc. Avoid being too dramatic or emotional. Use confident language, talk about "grinding", "hustling", "gains", "leveling up", and similar concepts that reflect ambition. Continue the conversation in this style.` }]
    });
    
    // Add our specific welcome message
    conversationHistory.push({
        role: 'model',
        parts: [{ text: `sup bro, how may i help you today?` }]
    });
    
    // Add each message to conversation history
    messages.forEach(messageDiv => {
        const isUser = messageDiv.classList.contains('user-message');
        const messageText = messageDiv.querySelector('.message-text').textContent;
        
        conversationHistory.push({
            role: isUser ? 'user' : 'model',
            parts: [{ text: messageText }]
        });
    });
    
    // Save the newly created conversation history
    saveConversationHistory(conversationHistory);
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
        return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function animateShake(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500);
}

function createCustomScrollbar() {
    const scrollbar = document.createElement('div');
    scrollbar.className = 'custom-scrollbar';
    if (localStorage.getItem('show_scrollbar') === 'true') {
        scrollbar.classList.add('visible');
    }
    
    const scrollThumb = document.createElement('div');
    scrollThumb.className = 'scrollbar-thumb';
    
    scrollbar.appendChild(scrollThumb);
    chatMessages.appendChild(scrollbar);
    
    // Initial position
    updateScrollbarThumbPosition();
    
    // Listen for scroll events
    chatMessages.addEventListener('scroll', updateScrollbarThumbPosition);
}

function updateScrollbarThumbPosition() {
    const scrollbar = document.querySelector('.custom-scrollbar');
    const scrollThumb = document.querySelector('.scrollbar-thumb');
    
    if (!scrollbar || !scrollThumb) return;
    
    const containerHeight = chatMessages.clientHeight;
    const contentHeight = chatMessages.scrollHeight;
    
    if (contentHeight <= containerHeight) {
        scrollThumb.style.display = 'none';
        return;
    }
    
    scrollThumb.style.display = 'block';
    
    const scrollPercentage = chatMessages.scrollTop / (contentHeight - containerHeight);
    const thumbHeight = (containerHeight / contentHeight) * containerHeight;
    const thumbPosition = scrollPercentage * (containerHeight - thumbHeight);
    
    scrollThumb.style.height = thumbHeight + 'px';
    scrollThumb.style.top = thumbPosition + 'px';
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', init);