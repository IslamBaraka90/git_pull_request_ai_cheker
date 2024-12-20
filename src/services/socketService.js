const socketIO = require('socket.io');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedSockets = new Map();
        this.debug = true;
        this.initialized = false;
    }

    initialize(server) {
        if (this.initialized) {
            console.warn('[SocketService] Already initialized');
            return;
        }

        try {
            console.log('[SocketService] Initializing socket.io server');
            
            this.io = socketIO(server, {
                cors: {
                    origin: "*",
                    methods: ["GET", "POST"]
                },
                transports: ['websocket', 'polling'],
                pingTimeout: 10000,
                pingInterval: 5000
            });

            this.setupEventHandlers();
            this.initialized = true;
            console.log('[SocketService] Socket.IO server initialized successfully');
        } catch (error) {
            console.error('[SocketService] Failed to initialize socket.io server:', error);
            throw error;
        }
    }

    setupEventHandlers() {
        if (!this.io) {
            console.error('[SocketService] Socket.IO not initialized in setupEventHandlers');
            return;
        }

        // Debug namespace connections
        this.io.on('new_namespace', (namespace) => {
            console.log('[SocketService] New namespace created:', namespace.name);
        });

        this.io.engine.on('connection_error', (err) => {
            console.error('[SocketService] Connection error:', err);
        });

        this.io.on('connection', (socket) => {
            try {
                console.log('[SocketService] New client connected:', {
                    socketId: socket.id,
                    transport: socket.conn.transport.name,
                    remoteAddress: socket.handshake.address,
                    timestamp: new Date().toISOString()
                });
                
                // Store socket instance
                this.connectedSockets.set(socket.id, {
                    socket,
                    connectedAt: new Date(),
                    lastActivity: new Date(),
                    transport: socket.conn.transport.name
                });
                
                console.log('[SocketService] Total connected clients:', this.connectedSockets.size);
                console.log('[SocketService] Connected client IDs:', Array.from(this.connectedSockets.keys()));

                // Send initial connection acknowledgment
                socket.emit('server:ack', {
                    message: 'Connected to server',
                    socketId: socket.id,
                    timestamp: Date.now()
                });

                // Handle client acknowledgment
                socket.on('client:ack', (data) => {
                    console.log('[SocketService] Client acknowledgment:', {
                        socketId: socket.id,
                        data
                    });
                    if (this.connectedSockets.has(socket.id)) {
                        this.connectedSockets.get(socket.id).lastActivity = new Date();
                    }
                });

                // Handle disconnect
                socket.on('disconnect', (reason) => {
                    console.log('[SocketService] Client disconnected:', {
                        socketId: socket.id,
                        reason,
                        timestamp: new Date().toISOString()
                    });
                    this.connectedSockets.delete(socket.id);
                    console.log('[SocketService] Remaining connected clients:', this.connectedSockets.size);
                    console.log('[SocketService] Remaining client IDs:', Array.from(this.connectedSockets.keys()));
                });

                // Debug: Log all incoming events
                if (this.debug) {
                    socket.onAny((eventName, ...args) => {
                        console.log('[SocketService] Received event:', {
                            socketId: socket.id,
                            event: eventName,
                            args,
                            timestamp: new Date().toISOString()
                        });
                        // Update last activity
                        if (this.connectedSockets.has(socket.id)) {
                            this.connectedSockets.get(socket.id).lastActivity = new Date();
                        }
                    });
                }

                // Handle transport change
                socket.conn.on('upgrade', (transport) => {
                    console.log('[SocketService] Client transport upgraded:', {
                        socketId: socket.id,
                        transport: transport.name
                    });
                });

            } catch (error) {
                console.error('[SocketService] Error handling connection:', error);
            }
        });
    }

    // Method to emit events from the server
    emitEvent(eventName, data) {
        console.log('[SocketService] Attempting to emit event:', eventName);
        console.log('[SocketService] Event data:', JSON.stringify(data, null, 2));
        
        if (!this.io) {
            console.error('[SocketService] Socket.IO not initialized!');
            return;
        }

        try {
            const connectedIds = Array.from(this.connectedSockets.keys());
            console.log('[SocketService] Currently connected clients:', connectedIds);

            if (connectedIds.length === 0) {
                console.warn('[SocketService] No connected clients to emit to');
                return; // Return early if no clients
            }

            // Emit to all connected sockets individually
            let emittedCount = 0;
            connectedIds.forEach(socketId => {
                const socketInfo = this.connectedSockets.get(socketId);
                if (socketInfo && socketInfo.socket.connected) {
                    console.log(`[SocketService] Emitting to client ${socketId}`);
                    socketInfo.socket.emit(eventName, data);
                    emittedCount++;
                }
            });

            console.log(`[SocketService] Event emitted to ${emittedCount} clients`);

        } catch (error) {
            console.error('[SocketService] Error emitting event:', error);
            console.error('[SocketService] Error stack:', error.stack);
        }
    }

    // Helper method to get connected clients info
    getConnectedClientsInfo() {
        return Array.from(this.connectedSockets.entries()).map(([id, info]) => ({
            id,
            connectedAt: info.connectedAt,
            lastActivity: info.lastActivity,
            transport: info.transport,
            connected: info.socket.connected
        }));
    }
}

// Export as singleton
module.exports = new SocketService();
