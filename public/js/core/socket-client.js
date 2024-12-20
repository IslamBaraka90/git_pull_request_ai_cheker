class SocketClient {
    constructor() {
        if (window.socketClient) {
            console.warn('[SocketClient] Instance already exists, returning existing instance');
            return window.socketClient;
        }
        
        this.socket = null;
        this.eventHandlers = new Map();
        this.debug = false;
        this.connectionAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.initialized = false;
    }

    connect() {
        if (this.initialized) {
            console.warn('[SocketClient] Already initialized, skipping connection');
            return;
        }
        
        // Connect to the server's Socket.IO endpoint
        this.socket = io(window.location.origin, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            forceNew: false
        });

        // Set up basic event handlers
        this.socket.on('connect', () => {
            console.log('[SocketClient] Connected to server with ID:', this.socket.id);
            this.connectionAttempts = 0;
        });

        // Handle server acknowledgment
        this.socket.on('server:ack', (data) => {
            this.socket.emit('client:ack', {
                message: 'Client acknowledged connection',
                clientId: this.socket.id,
                timestamp: Date.now()
            });
        });

        this.socket.on('disconnect', (reason) => {
            console.warn('[SocketClient] Disconnected from server. Reason:', reason);
            this.connectionAttempts++;
            
            if (this.connectionAttempts >= this.maxReconnectAttempts) {
                console.error('[SocketClient] Max reconnection attempts reached');
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('[SocketClient] Connection error:', error.message);
        });

        // Debug: Log all incoming events if debug mode is on
        if (this.debug) {
            this.socket.onAny((eventName, ...args) => {
                console.log('[SocketClient] Received event:', eventName);
                console.log('[SocketClient] Event data:', JSON.stringify(args, null, 2));
            });
        }

        // Set up analysis event handlers
        this.setupAnalysisEventHandlers();
        this.initialized = true;
    }

    setupAnalysisEventHandlers() {
        if (!this.socket) {
            console.error('[SocketClient] Cannot setup handlers: socket not initialized');
            return;
        }

        // Remove any existing listeners
        this.socket.removeAllListeners('analysis:start');
        this.socket.removeAllListeners('analysis:progress');
        this.socket.removeAllListeners('analysis:complete');
        this.socket.removeAllListeners('analysis:error');

        const events = [
            'analysis:start',
            'analysis:progress',
            'analysis:complete',
            'analysis:error'
        ];

        events.forEach(event => {
            this.socket.on(event, (data) => {
                this.triggerHandler(event, data);
            });
        });
    }

    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);

        // If socket exists, set up the handler immediately
        if (this.socket) {
            this.socket.on(event, handler);
        }
    }

    triggerHandler(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`[SocketClient] Error in handler for ${event}:`, error);
                }
            });
        }
    }

    emit(event, data) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
        } else {
            console.error('[SocketClient] Cannot emit event: socket not connected');
        }
    }
}

// Create singleton instance
if (!window.socketClient) {
    window.socketClient = new SocketClient();
    
    // Auto-connect when the script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.socketClient.connect();
        });
    } else {
        window.socketClient.connect();
    }
}
