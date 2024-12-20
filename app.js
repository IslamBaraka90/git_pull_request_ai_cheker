const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const routes = require('./src/routes');
const http = require('http');
const socketIO = require('socket.io');
const socketService = require('./src/services/socketService');

const app = express();
const server = http.createServer(app);
const port = 3002;

// Initialize socket service with server
socketService.initialize(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure sourcecodes directory exists
const sourcecodesDir = path.join(__dirname, 'sourcecodes');
fs.mkdir(sourcecodesDir, { recursive: true }).catch(console.error);

// Mount API routes
app.use('/api', routes);

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(port, () => {
    console.log(`Git Checker app listening at http://localhost:${port}`);
});