const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

const rooms = new Map(); // { topic: Set<ws> }

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);

      // Only process 'publish' type messages
      if (data.topic) {
        console.log('data.topic', data.topic,data.type)
        const topic = data.topic;

        // Ensure the topic room exists
        if (!rooms.has(topic)) {
          rooms.set(topic, new Set());
        }

        // Add the sender to the topic room if not already added
        rooms.get(topic).add(ws);

        
        // Relay the message to all other clients in the same topic
        for (const client of rooms.get(topic)) {

          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        }
      }
    } catch (err) {
      console.error('Failed to handle message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    for (const [topic, clients] of rooms.entries()) {
      clients.delete(ws);
      if (clients.size === 0) {
        rooms.delete(topic);
      }
    }
  });
});

console.log(`✅ Signaling server running at ws://localhost:${PORT}`);
