const aedes = require('aedes')();
const http = require('http');
const ws = require('ws');
const net = require('net');
const websocketStream = require('websocket-stream');

const mqttPort = 1883;
const wsPort = 8080;

// Create an MQTT server
const mqttServer = net.createServer(aedes.handle);

// Create an HTTP server
const httpServer = http.createServer();

// Create a WebSocket server
const wsServer = new ws.Server({ server: httpServer });

wsServer.on('connection', (socket) => {
  const stream = websocketStream(socket);
  aedes.handle(stream);
});

// Start the MQTT server
mqttServer.listen(mqttPort, () => {
  console.log(`MQTT server started on port ${mqttPort}`);
});

// Start the HTTP server with WebSocket
httpServer.listen(wsPort, () => {
  console.log(`WebSocket server started on port ${wsPort}`);
});

aedes.on('client', (client) => {
  console.log(`Client Connected: ${client.id}`);
});

aedes.on('clientDisconnect', (client) => {
  console.log(`Client Disconnected: ${client.id}`);
});

aedes.on('publish', (packet, client) => {
  console.log(`Message from ${client ? client.id : 'BROKER'}: ${packet.topic} - ${packet.payload.toString()}`);
});
