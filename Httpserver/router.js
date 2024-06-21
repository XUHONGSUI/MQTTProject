var express = require('express');
var  router = express.Router();

//get request
router.get('/',(req,res)=>{
    res.status(201).send({"name":"hello world","code":201});
});

router.post('/',(req,res)=>{
    res.send('Post Express!');
});

router.put('/',(req,res)=>{
    res.send('Put Express!');
});

router.delete('/',(req,res)=>{
    res.send('Delete Express!');
});


module.exports=router;