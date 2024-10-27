// Initialize WebSocket and state variables
let ws;
let username;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;

// Get DOM elements
const messagesDiv = document.getElementById('messages');
const connectionStatus = document.getElementById('connectionStatus');
const inputWrapper = document.querySelector('.input-wrapper');
const sendIcon = document.querySelector('.send-icon');

// Create and append input field if it doesn't exist
if (!inputWrapper.querySelector('input')) {
    const messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.id = 'messageInput';
    messageInput.placeholder = 'Type a message';
    inputWrapper.appendChild(messageInput);
} else {
    // If input already exists, just ensure it has the correct ID
    const existingInput = inputWrapper.querySelector('input');
    existingInput.id = 'messageInput';
}

// Get the message input reference
const messageInput = document.getElementById('messageInput');

function updateConnectionStatus(status, message) {
    connectionStatus.textContent = message;
    connectionStatus.className = `connection-status ${status}`;
    messageInput.disabled = status === 'disconnected';
    sendIcon.style.opacity = status === 'disconnected' ? '0.5' : '1';
    sendIcon.style.cursor = status === 'disconnected' ? 'not-allowed' : 'pointer';
}

function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    updateConnectionStatus('connecting', 'Connecting...');

    if (!username) {
        username = prompt('Please enter your username:');
        if (!username || username.trim() === '') {
            username = 'Guest' + Math.floor(Math.random() * 1000);
        }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8080`;
    
    try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to chat server');
            updateConnectionStatus('connected', 'Connected');
            addMessage('Connected to chat server', 'system');
            reconnectAttempts = 0;
            ws.send(username);
        };

        ws.onclose = () => {
            console.log('Disconnected from server');
            updateConnectionStatus('disconnected', 'Disconnected');
            addMessage('Disconnected from chat server', 'system');
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                setTimeout(() => {
                    reconnectAttempts++;
                    console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
                    connect();
                }, RECONNECT_INTERVAL);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            addMessage('Connection error occurred', 'system');
        };

        ws.onmessage = (event) => {
            console.log('Received message:', event.data);
            try {
                const data = JSON.parse(event.data);
                const messageType = determineMessageType(data.sender);
                const displayMessage = formatMessage(data.sender, data.message, messageType);
                addMessage(displayMessage, messageType);
            } catch (error) {
                console.error('Error parsing message:', error);
                addMessage(event.data, 'system');
            }
        };
    } catch (error) {
        console.error('Connection error:', error);
        updateConnectionStatus('disconnected', 'Connection Failed');
        addMessage('Failed to connect to server', 'system');
    }
}

function determineMessageType(sender) {
    if (sender === username) return 'user';
    if (sender === 'Server') return 'system';
    return 'other';
}

function formatMessage(sender, message, type) {
    return type === 'system' ? `${message}` : `${sender}: ${message}`;
}

function addMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(content);
    messageDiv.appendChild(timestamp);
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        messageInput.value = '';
    }
}

// Event Listeners
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

sendIcon.addEventListener('click', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        sendMessage();
    }
});

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            reconnectAttempts = 0;
            connect();
        }
    }
});

// Initialize emoji picker toggle if needed
const emojiButton = document.querySelector('.icon:first-child');
if (emojiButton) {
    emojiButton.addEventListener('click', () => {
        // Emoji picker functionality can be added here
        console.log('Emoji picker clicked');
    });
}

// Initialize attachment button if needed
const attachmentButton = document.querySelector('.icon:nth-child(2)');
if (attachmentButton) {
    attachmentButton.addEventListener('click', () => {
        // Attachment functionality can be added here
        console.log('Attachment button clicked');
    });
}

// Start the connection when the page loads
window.addEventListener('load', connect);