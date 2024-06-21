const express =require('express');
const http = require('http');
const socketIo = require('socket.io');
//import router
//const router =require('./router');
const app =express();
const server =http.createServer(app);
const io =socketIo(server);
const fs = require("fs");
//set router
const port =3000;
const clientPath = './clientdata/clientdata.json';
const topicPath = './clientdata/topics.json';
let maxnumber=0;
let onlinenumber=0;
//app.use(router);
app.use(express.json());

//query data from clientdata.json
app.get('/clientdata',async(req,res)=>{
    const data = await ReadData(clientPath);
    data.array.forEach(element => {
        if(element.state=="True"){
           onlinenumber++;
        }
        maxnumber++;
   });
   res.json(data);
});
//query data from topics.json
app.get('/topics', async(req,res)=>{
   const data = await ReadData(topicPath);  
   res.json(data);
});

app.get('/OnlineClient', async(req,res)=>{
    res.json(onlinenumber);
});

app.get('/MaxClient', async(req,res)=>{
    res.json(maxnumber);
});

//receive message from MQTT server
io.on('connection',(socket)=>{
    console.log("MQTT server connected.");
    socket.on('client Data',(data)=>{
        if(data==null){
            return;
        }else{ 
            writeData(clientPath);
         } 
    });

    socket.on('client topics',(data)=>{
        if(data==null){
            return;
        }else{ 
            writeData(topicPath);
         } 
    });
    socket.on('disconnect',()=>{
        console.log('MQTT server disconnected.');
    });
});

function writeData(Path){
    fs.writeFile(Path,data,(err)=>{
        if(err){
            console.log(err);
        }
    });
}

function ReadData(Path){
        return new Promise((resolve, reject) => {
            fs.readFile(Path, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    try {
                        resolve(JSON.parse(data));
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                }
            });
        }); 
}

server.listen(port,()=>{
    console.log(`Server is running on port 3000 ${port}`);
});