//MQTT aedes library
const aedes = require("aedes")();
const server = require("net").createServer(aedes.handle);
const ws = require("websocket-stream");
const http = require("http");

//MQTT server port
const port = 1883;
const wsPort = 8080;
//current time
const currentDate = new Date();
//fs
const fs = require("fs");
const io = require("socket.io-client");
const socket = io("http://localhost:3000");
const path = "./data/clientdata.json";
//topicstree
const pathtree = "./data/topicstreetest.json";
const winston = require("winston");
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;
const DailyRotateFile = require("winston-daily-rotate-file");
const websocketStream = require("websocket-stream");
const { release } = require("os");
const sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database("./database/MQTTDB");
//log recorder create
const logFormat = printf(({ timestamp, level, message }) => {
  return `${timestamp} ${level}: ${message}`;
});
const originalConsoleLog = console.log;
//logger configration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: "server.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "1d",
    }),
  ],
});
const httpServer = http.createServer();

function newLogFunction(message) {
  logger.info(message);
}

//overwrite console
console.log = function (message) {
  newLogFunction(message);
};
// Create a WebSocket server
const wsServer = new ws.Server({ server: httpServer });

db.run("PRAGMA journal_mode = WAL;", (err) => {
  if (err) {
      return console.error(err.message);
  }
  console.log('WAL mode enabled.');
});

wsServer.on("connection", (socket) => {
  const stream = websocketStream(socket);
  aedes.handle(stream);
});

httpServer.listen(wsPort, () => {
  console.log(`WebSocket server started on port ${wsPort}`);
});

//Device connect in MQTT server
server.listen(port, () => {
  console.log(`server running and listening on port ${port}`);
  db.run("UPDATE clientdata SET State = ? WHERE 1=1", ["False"], (err) => {
    if (err) {
      console.error(err.message);
      db.run("ROLLBACK");
      return;
    }
  });
});
//disconnect client MQTT server
aedes.on("clientDisconnect", (client) => {
  db.run(
    "UPDATE clientdata SET State = ?,DisconnectTime =? WHERE ID = ? ",
    ["True", currentDate.toLocaleString("en-US"), client.id],
    (err) => {
      if (err) {
        console.error(err.message);
        //db.run("ROLLBACK");
        return;
      } else {
        console.log(`Record DisconnectTime inserted with ID ${client.id}`);
      }
    }
  );
  console.log(`Client Disconnected: ${client.id}`);
});
//client MQTT server
aedes.on("client", (client) => {
  db.all("SELECT * FROM clientdata WHERE id = ?", [client.id], (err, data) => {
    if (err) {
      console.error(err.message);
      //db.run("ROLLBACK");
      return;
    }
    if (data.length === 0) {
      db.run(
        "INSERT INTO clientdata (ID,State,ConnectTime) values(?,?,?)",
        [client.id, "True", currentDate.toLocaleString("en-US")],
        (err) => {
          if (err) {
            console.error(err.message);
            //db.run("ROLLBACK");
          } else {
            console.log(`Record insert clientdata with ID ${this.changes}`);
            //db.run("COMMIT");
          }
        }
      );
    } else {
      let Device = data.find((obj) => obj.id === client.id);
      if (!Device) {
        db.run(
          "INSERT INTO clientdata (ID,State,ConnectTime) values(?,?,?)",
          [client.id, "True", currentDate.toLocaleString("en-US")],
          (err) => {
            if (err) {
              console.error(err.message);
              //db.run("ROLLBACK");
            } else {
              console.log(`Record insert clientdata with ID ${this.changes}`);
              //db.run("COMMIT");
            }
          }
        );
      } else {
        db.run(
          "UPDATE clientdata SET State = ?,ConnectTime = ? WHERE ID = ? ",
          ["True", currentDate.toLocaleString("en-US"), client.id],
          (err) => {
            if (err) {
              console.error(err.message);
              db.run("ROLLBACK");
            } else {
              console.log(`Record insert clientdata with ID ${this.changes}`);
              //db.run("COMMIT");
            }
          }
        );
      }
    }
  });
  console.log(`Client Connected: ${client.id}`);
});

aedes.on("subscribe", (subscriptions, client) => {
  RecordTreeTopic(subscriptions, client, "subscribe");
  console.log(
    `Client ${client.id} subscribed to topics: ${subscriptions
      .map((s) => s.topic)
      .join(", ")}`
  );
});

aedes.on("unsubscribe", (subscriptions, client) => {
  RecordTreeTopic(subscriptions, client, "unsubscribe");
  console.log(
    `Client ${client.id} unsubscribed to topics: ${subscriptions.join(", ")}`
  );
});

aedes.on("publish", (packet, client) => {
  if (client) {
    db.all(
      "SELECT * FROM topics WHERE id = ? AND topic = ?",
      [client.id, packet.topic],
      (err, topic) => {
        if (err) {
          console.error(err.message);
          //db.run("ROLLBACK");
          return;
        }
        if (topic.length === 0) {
          db.run(
            "INSERT INTO topics (id, topic, type) VALUES (?, ?, ?)",
            [client.id, packet.topic, "publish"],
            (err) => {
              if (err) {
                console.error(err.message);
                //db.run("ROLLBACK");
              } else {
                console.log(`Record topics inserted with ID ${this.lastID}`);
                //db.run("COMMIT");
              }
            }
          );
        } else {
          let shouldInsert = topic.some((row) => row.type !== "subscribe" && row.type !== "unsubscribe");
          if (!shouldInsert) {
            db.run(
              "UPDATE topics SET type = ? WHERE id = ? AND topic = ?",
              ["publish", client.id, packet.topic],
              (err) => {
                if (err) {
                  console.error(err.message);
                  //db.run("ROLLBACK");
                } else {
                  console.log(`Record updated with ID ${this.changes}`);
                  //db.run("COMMIT");
                }
              }
            );
          } else {
            //db.run("COMMIT");
          }
        }
      }
    );

    if (packet.topic == "state/info") {
      let InfoDetail = packet.payload.toString();
      if (InfoDetail.length == 0) {
        console.log("Info is empty!!");
        return;
      }
      let InfoJsonObject = JSON.parse(InfoDetail);
      db.run("UPDATE clientdata SET Address = ?,Topic=?,KeepAlivetime=?  WHERE id = ?",[InfoJsonObject.Address,InfoJsonObject.Topic,KeepAlivetime,client.id,],
        (err) => {
          if (err) {
            console.error(err.message);
            //db.run("ROLLBACK");
          } else {
            console.log(`Record updated with ID ${this.changes}`);
            //db.run("COMMIT");
          }
        }
      );
    }

    if (packet.topic == "state/info") {
      console.log(
        `Client ${client.id} published topic ${
          packet.topic
        }: ${packet.payload.toString()}`
      );
    } else {
      originalConsoleLog(packet.topic, packet.payload.toString());
    }
  }
});

function RecordTreeTopic(subscriptions, client, typedifne) {
  db.all(
    "SELECT * FROM topics WHERE id = ? AND topic = ?",
    [client.id, packet.topic],
    (err, data) => {
      if (err) {
        console.error(err.message);
        //db.run("ROLLBACK");
        return;
      }
      if (typedifne == "subscribe") {
        topicselect= subscriptions.map((s) => s.topic).join(", ");
        if (data === 0) {
          db.run("INSERT INTO topics (id, topic, type) VALUES (?, ?, ?)",[client.id, packet.topic, typedifne],(err) => {
              if (err) {
                console.log(err.message);
                //db.run("ROLLBACK");
              } else {
                console.log(`Record topics subscribe inserted with ID ${this.lastID}`);
                //db.run("COMMIT");
              }
            }
          );
        }else{
          let topic = data.find((obj) => obj.id === client.id &&  obj.topic === topicselect && obj.type !=="publish");
          if(!topic){
             db.run("INSERT INTO topics (id, topic, type) VALUES (?, ?, ?)",[client.id,topicselect,typedifne],(err)=>{
              if(err){
                console.log(err.message);
              }
             });
          }else{
            db.run("UPDATE topics SET type=? WHERE ID=? AND topic=?",[typedifne,client.id,topicselect],(err)=>{
              if(err){
                console.log(err.message);
              }
            });
          }
        }
      }else if(typedifne=="unsubscribe"){
        topicselect = subscriptions.join(", ");
        let unscribetopics= topicselect.split(',').map(topic => topic.trim());
        unscribetopics.forEach(element => {
             db.run("UPDATE topics SET type=? WHERE ID=? AND topic=?",[typedifne,client.id,element],(err)=>{
              if(err){
                console.log(err.message);
              }
             });
        });
      }
    }
  );
}

server.on("start", () => {
  console.log("Aedes MQTT server closed");
});

