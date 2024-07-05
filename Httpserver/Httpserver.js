const express =require('express');
const http = require('http');
const socketIo = require('socket.io');
//import router
//const router =require('./router');
const app =express();
const server =http.createServer(app);
const io =socketIo(server);
const fs = require("fs");
const path = require('path');
//set router
const port =3000;
const clientPath = './clientdata/clientdata.json';
const topicPath = './clientdata/topics.json';
const virtualPath = './clientdata/virtual.json';
//app.use(router);
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', async(req,res)=>{
     res.sendFile(path.join(__dirname + '/public/index.html'));
});

//query data from clientdata.json
app.get('/clientdata',async(req,res)=>{
   const data = await ReadData(clientPath);
   if (!data || data.length === 0) {
    res.json([]);
    } else {
    res.json(data);
    }
});

//query data from topics.json
app.get('/topics', async(req,res)=>{
   const data = await ReadData(topicPath);  
   if (!data || data.length === 0) {
    res.json([]);
    } else {
    res.json(data);
    }
});

app.get('/OnlineClient', async(req,res)=>{
    let onlinenumber=0;
    const data = await ReadData(clientPath);

    if(data !=null){
       data.forEach(element => {
            if(element.state=="True"){
               onlinenumber++;
            }
       });
        res.json(onlinenumber);
    }else{
        res.json(0);
    }

});

app.get('/getpublish', async(req,res)=>{
    const data = await ReadData(virtualPath);
    res.json(data);
});

//post data to virtual.json
app.post('/virtualpublish', async(req,res)=>{
    const jsonDataTopic = req.body;
    // let jsonData;
    // jsonData = JSON.stringify(data, null, 2);
    // writeData(virtualPath,jsonData);
    fs.readFile(virtualPath, (err, data) => {
        if (err) {console.log(err);}
        if (data.length == 0) {
            data = "[]";
        }
        
        let jsonData;
        jsonData = JSON.parse(data);
        if (jsonData.length == 0) { 
            jsonData.push(jsonDataTopic);
            writeData(virtualPath,JSON.stringify(jsonData, null, 2));
        }else{
            let Device = jsonData.find((obj) => obj.id === jsonDataTopic.id && obj.topic === jsonDataTopic.topic);
            if (!Device) {
                jsonData.push(jsonDataTopic);
                writeData(virtualPath,JSON.stringify(jsonData, null, 2));
            }
        }
    //     jsonData.push(jsonDataTopic);
    //     jsonData = JSON.stringify(jsonData, null, 2);
    //     writeData(virtualPath,jsonData);
        
    })
});


app.post('/clientstateupdate', (req, res) => {
    let currentDate = new Date();
    const clientID = req.body.id;
    fs.readFile(clientPath, (err, data) => {
      if (err) {console.log(err);}
      if (data.length == 0) {data = "[]";}
      if(data !=null){
       let jsonData;
      jsonData = JSON.parse(data);
      jsonData = jsonData.map((item) => {
            if (item.id === clientID) {
              return { ...item, ...{ state: "False",disconnectTime:currentDate.toLocaleString('en-US') } };
            }
            return item;
          });
      jsonData = JSON.stringify(jsonData, null, 2);
      writeData(clientPath,jsonData);
      } 
     });
});

app.get('/MaxClient', async(req,res)=>{
    let maxnumber=0;

    const data = await ReadData(clientPath);
    if(data != null){
        data.forEach(element => {
            maxnumber++;
    });
     res.json(maxnumber);
    }else{
        res.json(0);
    }  
});

function writeData(Path,data) {
    // write file
    fs.writeFile(Path, data,(err)=>{
      if(err) console.log(err);
    });
  }
  

function ReadData(Path){
        return new Promise((resolve, reject) => {
            fs.readFile(Path, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    try {
                        if (data.length==0) {
                            resolve(null);
                        }else{
                            resolve(JSON.parse(data));
                        }
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                }
            });
        }); 
}

//receive message from MQTT server
io.on('connection',(socket)=>{
    console.log("MQTT server connected.");
    socket.on('client Data',(data)=>{
        if(data==null){
            return;
        }
        writeData(clientPath,data);
         
    });

    socket.on('client topics',(data)=>{
        if(data==null){
            return;
        }
        writeData(topicPath,data);
         
    });
    socket.on('disconnect',()=>{
        console.log('MQTT server disconnected.');
        socket.disconnect();
    });
});

server.listen(port,()=>{
    console.log(`Server is running on port 3000 ${port}`);
});