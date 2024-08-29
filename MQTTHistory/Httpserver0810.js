const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
//import router
//const router =require('./router');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const fs = require("fs");
const path = require("path");
//set router
const port = 3000;
const sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database("../MQTTserver/database/MQTTDB");
//app.use(router);
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

//query data from clientdata.json
app.get("/clientdata", async (req, res) => {
    db.all("SELECT * FROM clientdata WHERE 1=1",[""],(err,data)=>{
      if(err){
        console.log(err.message);
        res.status(500).json({error:"An error occured"});
        return;
      }
      if(data.length ===0){
        res.json([]);
      }else{
        res.json(data);
      }
    });
});

//query data from topics.json
app.get("/topics", async (req, res) => {
   db.all("SELECT * FROM topics WHERE 1=1",[""],(err,data)=>{
    if(err){
      console.log(err.message);
      res.status(500).json({error:"An error occured"});
      return;
    }
    if(data.length ===0){
      res.json([]);
    }else{
      res.json(data);
    }
   });
});

app.get("/OnlineClient", async (req, res) => {
  let onlinenumber = 0;
  db.all("SELECT * FROM clientdata WHERE State =?",["True"],(err,data)=>{
    if(err){
      console.log(err.message);
      res.status(500).json({error:"An error occured"});
      return;
    }
    if(data.length===0){
      res.json(0);
    }else{
     res.json(data.length);
    }
  });
});

app.get("/getpublish", async (req, res) => {
  const data = await ReadData(virtualPath);
  res.json(data);
});

//post data to virtual.json
app.post("/virtualpublish", async (req, res) => {
  const jsonDataTopic = req.body;
  // let jsonData;
  // jsonData = JSON.stringify(data, null, 2);
  // writeData(virtualPath,jsonData);
  fs.readFile(virtualPath, (err, data) => {
    if (err) {
      console.log(err);
    }
    if (data.length == 0) {
      data = "[]";
    }

    let jsonData;
    jsonData = JSON.parse(data);
    if (jsonData.length == 0) {
      jsonData.push(jsonDataTopic);
      writeData(virtualPath, JSON.stringify(jsonData, null, 2));
    } else {
      let Device = jsonData.find(
        (obj) =>
          obj.id === jsonDataTopic.id && obj.topic === jsonDataTopic.topic
      );
      if (!Device) {
        jsonData.push(jsonDataTopic);
        writeData(virtualPath, JSON.stringify(jsonData, null, 2));
      }
    }
    //     jsonData.push(jsonDataTopic);
    //     jsonData = JSON.stringify(jsonData, null, 2);
    //     writeData(virtualPath,jsonData);
  });
});

app.post("/clientstateupdate", async (req, res) => {
  let currentDate = new Date();
  const clientID = req.body.id;
  db.run("UPDATE clientdata SET State = ? WHERE ID=?",["False",currentDate.toLocaleString("en-US"),clientID],(err,data)={
      if(err){
        console.log(err.message);
      }
  });
});

app.get("/MaxClient", async (req, res) => {
  let maxnumber = 0;
  if (data != null) {
    data.forEach((element) => {
      maxnumber++;
    });
    res.json(maxnumber);
  } else {
    res.json(0);
  }
});

async function writeData(Path, data) {
  try {
    await fs.writeFile(Path, data, (err) => {
      if (err) console.log(err);
    });
  } catch (error) {
    console.error('Error writing devices to file', error);
  }
  // write file
}

function ReadData(Path) {
  return new Promise((resolve, reject) => {
    fs.readFile(Path, (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          if (data.length == 0) {
            resolve(null);
          } else {
            resolve(JSON.parse(data));
          }
        } catch (parseErr) {
          reject(parseErr);
        }
      }
    });
  });
}

setInterval(() => {
    db.run("SELECT * FROM clientdata",[""],(err,data)=>{
       if(err){
        console.log("io query error!!");
       }
       io.emit('updateClientData',data);
    });
}, 1000);

//receive message from MQTT server
server.listen(port, () => {
  console.log(`Server is running on port 3000 ${port}`);
});
