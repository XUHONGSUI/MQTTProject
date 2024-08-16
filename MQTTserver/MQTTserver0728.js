//MQTT aedes library
const aedes = require("aedes")();
const server = require("net").createServer(aedes.handle);
const ws = require("websocket-stream");
const http = require('http');
const lockfile = require('proper-lockfile');
//MQTT server port
const port = 1883;
const wsPort = 8080;
//current time
const currentDate = new Date();
//fs
const fs = require("fs");
const io = require('socket.io-client');
const socket = io('http://localhost:3000');
const path = "./data/clientdata.json";
let jsonStringDevice;
let jsonStringTopic;
//topicstree
const pathtree="./data/topicstreetest.json";
const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;
const DailyRotateFile = require('winston-daily-rotate-file');
const websocketStream = require('websocket-stream');

//log recorder create
const logFormat = printf(({ timestamp, level, message }) => {
  return `${timestamp} ${level}: ${message}`;
});
const originalConsoleLog = console.log;
//logger configration
const logger =winston.createLogger({
   level: 'info',
   format: winston.format.combine(
     winston.format.timestamp({format:'YYYY-MM-DD HH:mm:ss'}),
     winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`),
   ),
   transports: [
    new winston.transports.Console(), 
    new DailyRotateFile({ 
      filename: 'server.log', 
      datePattern: 'YYYY-MM-DD', 
      maxFiles: '1d' }),
  ]
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

wsServer.on('connection', (socket) => {
  const stream = websocketStream(socket);
  aedes.handle(stream);
});

httpServer.listen(wsPort, () => {
  console.log(`WebSocket server started on port ${wsPort}`);
});

//Device connect in MQTT server
server.listen(port, () => {
   console.log(`server running and listening on port ${port}`);  
   fs.readFile(path, (err, data) => {
    if (err) console(err);
    
    if(data.length==0){
      data ='[]';
    }
    jsonData = JSON.parse(data);
    jsonData = jsonData.map((item) => { 
     return { ...item, ...{ state: "False",disconnectTime:currentDate.toLocaleString('en-US')} }; 
     });
     writeClient(jsonData);
  });

});
//disconnect client MQTT server
aedes.on("clientDisconnect", (client) => {
  //find disconnect clientid
  fs.readFile(path, (err, data) => {
    if (err) console(err);
    
    if(data.length==0){
      data ='[]';
    }
    jsonData = JSON.parse(data);
    if (jsonData.find((obj) => obj.id === client.id)) {
      jsonData = jsonData.map((item) => {
        if (item.id === client.id) {
          return { ...item, ...{ state: "False",disconnectTime:currentDate.toLocaleString('en-US')} };
        }
        return item;
      });
    }
    writeClient(jsonData);
  });
  console.log(`Client Disconnected: ${client.id}`);
});

//clientId message file
 function writeClient(Devices) {
  jsonStringDevice = JSON.stringify(Devices, null, 2);
  socket.emit('client Data',jsonStringDevice);
//   // write file
  fs.writeFile(path, jsonStringDevice,(err)=>{
    if(err) console.log(err);
  });
}

 function wirteTopicTree(topicstree) {
  jsonStringTopic = JSON.stringify(topicstree, null, 2);
  socket.emit('client topics',jsonStringTopic);
  fs.writeFile(pathtree, jsonStringTopic,(err)=>{
   if(err) console.log(err);
  });
}

// async function writeClient(devices) {
//   let release;
//   try {
//       release = await lockfile.lock(path);
//       const jsonStringDevice = JSON.stringify(devices, null, 2);
//       socket.emit('client Data',jsonStringDevice);
//       await fs.promises.writeFile(path, jsonStringDevice);
//       console.log('Devices data written to file successfully');
//   } catch (error) {
//       console.error('Error writing devices to file', error);
//   } finally {
//       if (release) {
//           await release();
//       }
//   }
// }

// async function wirteTopicTree(topicstree) {
//   try {
//     release = await lockfile.lock(pathtree);
//     const jsonStringTopic = JSON.stringify(topicstree, null, 2);
//     socket.emit('client topics',jsonStringTopic);
//     //const topicTreeFilePath = path.join(__dirname, 'topicstree.json');   
//     await fs.promises.writeFile(pathtree, jsonStringTopic,(err)=>{
//          if(err) console.log(err);
//         });
//    // console.log('Topics tree data written to file successfully');
//   } catch (error) {
//     console.error('Error writing topics tree to file', error);
//   }finally{
//     if(release){
//       await release();
//     }
//   }
// }


//client MQTT server
aedes.on("client", (client) => {
  fs.readFile(path, (err, data) => {
    if (err) {
      console.log(err);
    }
    if (data.length == 0) {
      data = "[]";
    }
    let jsonData;
    jsonData = JSON.parse(data);
    if (jsonData.length == 0) {
      jsonData.push({ id: client.id, state: "True",time:currentDate.toLocaleString('en-US') });
      writeClient(jsonData);
    } else {
      let Device = jsonData.find((obj) => obj.id === client.id);
      if (!Device) {
        jsonData.push({ id: client.id, state: "True",time:currentDate.toLocaleString('en-US')});
        writeClient(jsonData);
      } else {
        jsonData = jsonData.map((item) => {
          if (item.id === client.id) {
            return { ...item, ...{ state: "True",time:currentDate.toLocaleString('en-US') } };
          }
          return item;
        });
        writeClient(jsonData);
      }
    }
  });
  console.log(`Client Connected: ${client.id}`);
});

aedes.on("subscribe", (subscriptions, client) => {

  RecordTreeTopic(subscriptions,client,"subscribe");
  console.log(
      `Client ${client.id} subscribed to topics: ${subscriptions
        .map((s) => s.topic)
        .join(", ")}`
  );

});

aedes.on("unsubscribe", (subscriptions, client) => {
  RecordTreeTopic(subscriptions,client,"unsubscribe");
  console.log(
    `Client ${client.id} unsubscribed to topics: ${subscriptions.join(", ")}`
  );
});

aedes.on("publish", (packet, client) => {

  if (client) {
    fs.readFile(pathtree,(err,data)=>{
      if(err){
       console.log(err)};
       if (data.length==0) {
          data ="[]";
      }
      let jsonDataTopic;
      jsonDataTopic =JSON.parse(data);
       if(jsonDataTopic.length == 0){
         jsonDataTopic.push({topic:packet.topic,type:"publish",id:client.id});
         wirteTopicTree(jsonDataTopic); 
       }else{
         let topic = jsonDataTopic.find((obj) =>  obj.id === client.id && obj.type !==("subscribe" || "unsubscribe")  && obj.topic === packet.topic);
         if(!topic){
           jsonDataTopic.push({topic:packet.topic,type:"publish",id:client.id});
           console.log(jsonDataTopic);
           wirteTopicTree(jsonDataTopic); 
         }
       }
   })

  if(packet.topic=="state/info"){

    let InfoDetail =packet.payload.toString();
    if(InfoDetail.length==0){
       console.log("Info is empty!!");
       return;
    }
    let InfoJsonObject = JSON.parse(InfoDetail);

    fs.readFile(path,(err,data)=>{
      
      if(err){console.log(err)};
      if(data.length==0){
        data ="[]";
      }
      let InfoJson;
      InfoJson =JSON.parse(data);
      let info = InfoJson.find((obj) => obj.id === client.id);
      let Newinfo = { ...info, ...InfoJsonObject };
      InfoJson = InfoJson.map((item) => {
        if (item.id === client.id) {
          return Newinfo;
        }
        return item;
      });
      writeClient(InfoJson);
    })
   }

   if(packet.topic=="state/info"){
    console.log(
        `Client ${client.id} published topic ${
          packet.topic
        }: ${packet.payload.toString()}`
    );
  }else {
    originalConsoleLog(packet.topic, packet.payload.toString());
  }
}
});

function RecordTreeTopic(subscriptions,client,typedifne){
  
  fs.readFile(pathtree,(err,data)=>{
    if(err){
     console.log(err)};
     if (data.length==0) {
      data ="[]";
    }
    let topicselect='';
    let jsonDataTopic;
    jsonDataTopic =JSON.parse(data);

    if(typedifne=="subscribe"){
      topicselect= subscriptions.map((s) => s.topic).join(", ");
      if(jsonDataTopic.length == 0){
        jsonDataTopic.push({topic:topicselect,type:typedifne,id:client.id});
        wirteTopicTree(jsonDataTopic); 
      }else{
          let topic = jsonDataTopic.find((obj) => obj.id === client.id &&  obj.topic === topicselect && obj.type !=="publish");
        if(!topic){
          jsonDataTopic.push({topic:topicselect,type:typedifne,id:client.id});
          wirteTopicTree(jsonDataTopic);
        }else{
         jsonDataTopic = jsonDataTopic.map((item) => {
           if (item.id === client.id && item.topic === topicselect && item.type !=="publish") {
             return { ...item, type: typedifne };
           }
           return item;
         });
         wirteTopicTree(jsonDataTopic); 
        }
      }
    }else if(typedifne=="unsubscribe"){
      topicselect = subscriptions.join(", ");
      let unscribetopics= topicselect.split(',').map(topic => topic.trim());
      unscribetopics.forEach(element => {
        jsonDataTopic = jsonDataTopic.map((item) => {
          if (item.id === client.id && item.topic === element && item.type !=="publish") {
            return { ...item, type: typedifne };
          }
          return item;
        });
      })
      wirteTopicTree(jsonDataTopic); 
    }
 })
}

server.on("start", () => {  
   console.log('Aedes MQTT server closed');
  })

//datasend
// setInterval(() => {
// //
//   socket.emit('client topics',jsonStringTopic);
// },200);