const aedes = require('aedes')();
const http = require('http');
const ws = require('ws');
const net = require('net');
const websocketStream = require('websocket-stream');
const sqlite3 = require('sqlite3').verbose();

const mqttPort = 1883;
const wsPort = 8080;
// Create an MQTT server
const mqttServer = net.createServer(aedes.handle);
// Create an HTTP server
const httpServer = http.createServer();
// Create a WebSocket server
const wsServer = new ws.Server({ server: httpServer });
let db = new sqlite3.Database('./database/MQTTDB');

wsServer.on('connection', (socket) => {
  const stream = websocketStream(socket);
  aedes.handle(stream);
});

let sql ='select *from clientdata';
db.all(sql, [], (err, data) => {
  if (err) {
    throw err;
  }
  
  data.forEach(device => {
    console.log(device.ID);
  });
});
// close the database connection
db.close();

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
