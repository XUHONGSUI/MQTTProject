const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server);
//set router

const clientPath = "./clientdata/clientdata.json";
const topicPath = "./clientdata/topics.json";
const virtualPath = "./clientdata/virtual.json";
//set router
const port = 3000;
const sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database("./database/MQTTDB");
//app.use(router);
app.use(express.json());
app.use(express.static(path.join(__dirname)));


// db.run("PRAGMA journal_mode = WAL;", (err) => {
//   if (err) {
//       return console.error(err.message);
//   }
//   console.log('WAL mode enabled.');
// });

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

//query data from clientdata.json
app.get("/clientdata", async (req, res) => {
  db.all("SELECT * FROM clientdata ", [], (err, data) => {
    if (err) {
      console.log(err.message);
      res.status(500).json({ error: "An error occured" });
      //db.run("ROLLBACK");
      return;
    } else {
      if (data.length === 0) {
        res.json([]);
      } else {
        res.json(data);
      }
    }
  });
});

//query data from topics.json
app.get("/topics", async (req, res) => {
  db.all("SELECT * FROM topics", [], (err, data) => {
    if (err) {
      console.log(err.message);
      res.status(500).json({ error: "An error occured" });
      return;
    } else {
      if (data.length === 0) {
        res.json([]);
      } else {
        res.json(data);
      }
    }
  });
});

app.get("/OnlineClient", async (req, res) => {
  db.all("SELECT * FROM clientdata WHERE State =?", ["True"], (err, data) => {
    if (err) {
      console.log(err.message);
      res.status(500).json({ error: "An error occured!" });
      return;
    } else {
      if (data.length === 0) {
        res.json(0);
      } else {
        res.json(data.length);
      }
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
  });
});

app.post("/clientstateupdate", async (req, res) => {
  let currentDate = new Date();
  const clientID = req.body.id;
  db.run(
    "UPDATE clientdata SET State = ?,DisconnectTime =? WHERE ID = ? ",
    ["False", currentDate.toLocaleString("en-US"), clientID],
    (err) => {
      if (err) {
        console.error(err.message);
        return;
      } else {
        console.log(`Record DisconnectTime inserted with ID ${cclientID}`);
      }
    }
  );
});

app.get("/MaxClient", async (req, res) => {
  db.all("SELECT * FROM clientdata ", [], (err, data) => {
    if (err) {
      console.log(err.message);
      res.status(500).json({ error: "An error occured!" });
      return;
    } else {
      if (data.length === 0) {
        res.json(0);
      } else {
        res.json(data.length);
      }
    }
  });
});

async function writeData(Path, data) {
  try {
    await fs.writeFile(Path, data, (err) => {
      if (err) console.log(err);
    });
  } catch (error) {
    console.error('Error writing devices to file', error);
  }
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
//poling query for the last exist device
setInterval(() => {
  db.all("SELECT * FROM clientdata", [], (err, data) => {
    if (err) {
      console.log(err.message);
    }
    let jsondata = JSON.stringify(data, null, 2);
    io.emit('updateClientData', jsondata);
  });
}, 1000);


//receive message from MQTT server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port 3000 ${port}`);
});
