// script.js
let ws;
let username;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const disconnectButton = document.getElementById("disconnectButton");
const connectionStatus = document.getElementById("connectionStatus");

function updateConnectionStatus(status, message) {
    connectionStatus.textContent = message;
    connectionStatus.className = `connection-status ${status}`;
    const isConnected = status === "connected";
    messageInput.disabled = !isConnected;
    sendButton.disabled = !isConnected;
    disconnectButton.disabled = !isConnected;
}

function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        return;
    }

    updateConnectionStatus("connecting", "Connecting...");

    if (!username) {
        username = prompt("Please enter your username:");
        if (!username || username.trim() === "") {
            username = "Guest" + Math.floor(Math.random() * 1000);
        }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8080`;
    
    console.log("Connecting to:", wsUrl);
    
    try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("WebSocket connection established");
            updateConnectionStatus("connected", "Connected");
            addMessage("Connected to chat server", "system");
            reconnectAttempts = 0;
            ws.send(username); // Send username immediately after connection
        };

        ws.onclose = (event) => {
            console.log("WebSocket closed:", event);
            updateConnectionStatus("disconnected", "Disconnected");
            addMessage("Disconnected from chat server", "system");
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                setTimeout(() => {
                    reconnectAttempts++;
                    console.log(`Reconnect attempt ${reconnectAttempts}...`);
                    connect();
                }, RECONNECT_INTERVAL);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            addMessage("Connection error", "system");
        };

        ws.onmessage = (event) => {
            console.log("Received message:", event.data);
            try {
                const data = JSON.parse(event.data);
                const sender = data.sender;
                const message = data.message;
                
                // Determine message type
                let messageType;
                if (sender === username) {
                    messageType = "user";
                } else if (sender === "Server") {
                    messageType = "system";
                } else {
                    messageType = "other";
                }
                
                // Format the message based on type
                let displayMessage;
                if (messageType === "system") {
                    displayMessage = `${sender}: ${message}`;
                } else {
                    displayMessage = `${sender}: ${message}`;
                }
                
                addMessage(displayMessage, messageType);
            } catch (error) {
                console.error("Error parsing message:", error);
                addMessage(event.data, "system");
            }
        };
    } catch (error) {
        console.error("Connection error:", error);
        updateConnectionStatus("disconnected", "Connection Error");
        addMessage("Failed to connect to server", "system");
    }
}

function addMessage(message, type) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", `${type}-message`);
    
    const timestamp = document.createElement("div");
    timestamp.classList.add("timestamp");
    timestamp.textContent = new Date().toLocaleTimeString();
    
    const content = document.createElement("div");
    content.classList.add("message-content");
    content.textContent = message;
    
    messageDiv.appendChild(timestamp);
    messageDiv.appendChild(content);
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && ws && ws.readyState === WebSocket.OPEN) {
        console.log("Sending message:", message);
        ws.send(message);
        messageInput.value = "";
    }
}

function disconnect() {
    if (ws) {
        ws.close();
    }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);
disconnectButton.addEventListener('click', disconnect);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// Add manual reconnect button
const reconnectButton = document.createElement("button");
reconnectButton.textContent = "Reconnect";
reconnectButton.className = "reconnect-button";
reconnectButton.addEventListener('click', () => {
    reconnectAttempts = 0;
    connect();
});
document.querySelector(".chat-input").appendChild(reconnectButton);

// Handle page visibility
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            reconnectAttempts = 0;
            connect();
        }
    }
});

// Initial connection
connect();
