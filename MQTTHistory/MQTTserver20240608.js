//MQTT aedes library
const aedes = require("aedes")();
const server = require("net").createServer(aedes.handle);
//MQTT server port
const port = 1883;
//fs
const fs = require("fs");
const path = "./data/clientdata.json";
let jsonString;
//topicstree
const pathtree="./data/topicstreetest.json";
const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;
const DailyRotateFile = require('winston-daily-rotate-file');
//log recorder create
const logFormat = printf(({ timestamp, level, message }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger =winston.createLogger({
   level: 'info',
   format: winston.format.combine(
     winston.format.timestamp({format:'YYYY-MM-DD HH:mm:ss'}),
     winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`),
   ),
   transports: [
    new winston.transports.Console(), 
    new winston.transports.File({ 
      filename: 'server.log', 
      datePattern: 'YYYY-MM-DD', 
      maxFiles: '3d' }),
  ]
});
//overwrite console
console.log = function (message) {
  logger.info(message);
};


//Device connect in MQTT server
server.listen(port, () => {
   console.log("server running and listening on port", port);
});
//disconnect client MQTT server
aedes.on("clientDisconnect", (client) => {
  //find disconnect clientid
  fs.readFile(path, (err, data) => {
    if (err) console(err);
    let jsonData;
    jsonData = JSON.parse(data);
    if (jsonData.find((obj) => obj.id === client.id)) {
      jsonData = jsonData.map((item) => {
        if (item.id === client.id) {
          return { ...item, ...{ state: "False" } };
        }
        return item;
      });
    }
    setTimeout(() => {writeClient(jsonData);}, 100);
  });
  console.log(`Client Disconnected: ${client.id}`);
});

//clientId message file
function writeClient(Devices) {
  jsonString = JSON.stringify(Devices, null, 2);
  fs.writeFile(path, jsonString, (err) => {
    if (err) {
      console.log(err);
    }
  });
}

function wirteTopicTree(topicstree) {
   jsonString = JSON.stringify(topicstree, null, 2);
  fs.writeFileSync(pathtree, jsonString, (err) => {
    if (err) {
      console.log(err);
    }
  });
}
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
      jsonData.push({ id: client.id, state: "True" });
      writeClient(jsonData);
    } else {
      let Device = jsonData.find((obj) => obj.id === client.id);
      if (!Device) {
        jsonData.push({ id: client.id, state: "True" });
        writeClient(jsonData);
      } else {
        jsonData = jsonData.map((item) => {
          if (item.id === client.id) {
            return { ...item, ...{ state: "True" } };
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
         let topic = jsonDataTopic.find((obj) =>  obj.id === client.id && obj.type !==("subscribe" || "unsubscribe") && obj.topic === packet.topic);
         if(!topic){
           jsonDataTopic.push({topic:packet.topic,type:"publish",id:client.id});
           wirteTopicTree(jsonDataTopic); 
         }
       }
   })

    console.log(
        `Client ${client.id} published topic ${
          packet.topic
        }: ${packet.payload.toString()}`
    );
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
    if(typedifne=="subscribe"){
      topicselect= subscriptions.map((s) => s.topic).join(", ");
    }else if(typedifne=="unsubscribe"){
      topicselect = subscriptions.join(", ");
    }

     let jsonDataTopic;
     jsonDataTopic =JSON.parse(data);

     if(jsonDataTopic.length == 0){
       jsonDataTopic.push({topic:topicselect,type:typedifne,id:client.id});
       wirteTopicTree(jsonDataTopic);;  
     }else{
       let topic = jsonDataTopic.find((obj) => obj.id === client.id && obj.topic === topicselect && obj.type !=="publish");
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
 })

}