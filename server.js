const { WebSocketServer } = require('ws');
const express = require('express');
const path = require('path');

const WS_PORT = 3000;
const HTTP_PORT = 8080;
const app = express();
const clientLastMessage = new WeakMap();

// Serve static files from public directory
app.use(express.static('public'));

// WebSocket Server
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
  clientLastMessage.set(ws, Date.now());

  console.log('New client connected');
  
  // Broadcast to all clients when someone connects
  wss.clients.forEach(client => {
    if (client.readyState === ws.OPEN) {
      client.send('A new device connected');
    }
  });

  ws.on('message', (message) => {
    const now = Date.now();
    if (now - clientLastMessage.get(ws) < 200) {
      ws.send('TOO_FAST: Please wait between commands');
      return;
    }
    clientLastMessage.set(ws, now);

    console.log(`Received: ${message}`);
    // Broadcast to all other clients
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Notify remaining clients
    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN) {
        client.send('A device disconnected');
      }
    });
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start HTTP server
app.listen(HTTP_PORT, () => {
  console.log(`HTTP server running on http://localhost:${HTTP_PORT}`);
  console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
}); 