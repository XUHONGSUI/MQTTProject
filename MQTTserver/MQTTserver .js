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
let topic = {
  topic: "home/bathroom/temperature",
  type: "subscribe",
  id: "6C:35:B9:AB:62:24",
  qos: 0,
  state: "True",
  times: "one",
};
let topic2 = {
  topic: "home/temperature",
  type: "publish",
  id: "88:38:B9:AB:62:24",
  qos: 0,
  state: "True",
  times: "multiple",
};
let topicstree = [];
topicstree.push(topic);
topicstree.push(topic2);

//Device connect in MQTT server
server.listen(port, () => {
  console.log(getTime() + "server running and listening on port", port);
});

//disconnect client MQTT server
aedes.on("clientDisconnect", (client) => {
  //find disconnect clientid
  fs.readFile(path, (err, data) => {
    if (err) console(err);
    let jsonData = [];
    jsonData = JSON.parse(data);
    if (jsonData.find((obj) => obj.id === client.id)) {
      jsonData = jsonData.map((item) => {
        if (item.id === client.id) {
          return { ...item, ...{ state: "False" } };
        }
        return item;
      });
    }
    writeClient(jsonData);
    console.log(`Client Disconnected: ${client.id}`);
  });
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
//client MQTT server
aedes.on("client", (client) => {
  
  fs.readFile(path, (err, data) => {
    if (err) {
      console.log(err);
    }
    let jsonData = [];
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

    jsonData.forEach((Device) => {
      topicstree.forEach((subtopic) => {
        if (Device.id == subtopic.id && subtopic.state == "True") {
          //1.publish topics subscribe or publish
          setTimeout(() => {
            aedes.publish(
              {
                topic: "arduino/assignedTopic",
                payload:
                  subtopic.topic +
                  "," +
                  subtopic.type +
                  "|" +
                  subtopic.times +
                  "-" +
                  subtopic.id,
                qos: subtopic.qos,
                retain: false,
              },
              (err) => {
                if (err) console.log(err);
              }
            );
          }, 1000);
        }
      });
    });
  });

  console.log(getTime() + `Client Connected: ${client.id}`);
});

aedes.on("subscribe", (subscriptions, client) => {
  console.log(
    getTime() +
      `Client ${client.id} subscribed to topics: ${subscriptions
        .map((s) => s.topic)
        .join(", ")}`
  );
});

aedes.on("unsubscribe", (subscriptions, client) => {
  console.log(
    getTime() +
      `Client ${client.id} unsubscribed from topics: ${subscriptions.join(
        ", "
      )}`
  );
});

aedes.on("publish", (packet, client) => {
  if (client) {
    console.log(
      getTime() +
        `Client ${client.id} published topic ${
          packet.topic
        }: ${packet.payload.toString()}`
    );
  }
});
//getTime
function getTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}
