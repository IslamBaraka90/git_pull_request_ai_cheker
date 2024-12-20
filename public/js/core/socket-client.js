class SocketClient {
    constructor() {
        if (window.socketClient) {
            console.warn('[SocketClient] Instance already exists, returning existing instance');
            return window.socketClient;
        }
        
        this.socket = null;
        this.eventHandlers = new Map();
        this.debug = true;
        this.connectionAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.initialized = false;
    }

    connect() {
        if (this.initialized) {
            console.warn('[SocketClient] Already initialized, skipping connection');
            return;
        }

        console.log('[SocketClient] Connecting to server...');
        
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
            console.log('[SocketClient] Received server acknowledgment:', data);
            // Send client acknowledgment
            this.socket.emit('client:ack', {
                message: 'Client acknowledged connection',
                clientId: this.socket.id,
                timestamp: Date.now()
            });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[SocketClient] Disconnected from server. Reason:', reason);
            this.connectionAttempts++;
            
            if (this.connectionAttempts >= this.maxReconnectAttempts) {
                console.error('[SocketClient] Max reconnection attempts reached');
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('[SocketClient] Connection error:', error.message);
        });

        // Debug: Log all incoming events
        if (this.debug) {
            this.socket.onAny((eventName, ...args) => {
                console.log('[SocketClient] Received event:', eventName);
                console.log('[SocketClient] Event data:', JSON.stringify(args, null, 2));
            });
        }

        // Set up analysis event handlers with debugging
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
            console.log('[SocketClient] Setting up handler for:', event);
            
            this.socket.on(event, (data) => {
                console.log(`[SocketClient] Received ${event}:`, JSON.stringify(data, null, 2));
                this.triggerHandler(event, data);
            });
        });
    }

    on(event, handler) {
        console.log('[SocketClient] Registering handler for event:', event);
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
        console.log(`[SocketClient] Triggering handlers for event: ${event}`);
        console.log('[SocketClient] Event data:', JSON.stringify(data, null, 2));
        
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`[SocketClient] Error in handler for ${event}:`, error);
                }
            });
        } else {
            console.warn(`[SocketClient] No handlers registered for event: ${event}`);
        }
    }

    emit(event, data) {
        if (this.socket && this.socket.connected) {
            console.log('[SocketClient] Emitting event:', event);
            console.log('[SocketClient] Event data:', JSON.stringify(data, null, 2));
            this.socket.emit(event, data);
        } else {
            console.error('[SocketClient] Cannot emit event: socket not connected');
            console.error('[SocketClient] Socket status:', {
                exists: !!this.socket,
                connected: this.socket?.connected,
                id: this.socket?.id
            });
        }
    }
}

// Create singleton instance
if (!window.socketClient) {
    window.socketClient = new SocketClient();
    
    // Auto-connect when the script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[SocketClient] DOM loaded, connecting...');
            window.socketClient.connect();
        });
    } else {
        console.log('[SocketClient] Document already loaded, connecting...');
        window.socketClient.connect();
    }
}
