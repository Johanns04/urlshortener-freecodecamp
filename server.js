require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
var bodyParser = require('body-parser');
var dns = require('dns');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

var urlSchema = new mongoose.Schema({
	urlOrig: String,
	urlShort: {type: Number},
}); 

var mainUrl = mongoose.model('mainUrl', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.use(bodyParser.urlencoded({extended:false}));

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//The Main body
//thanks to the people who asked the questions I needed answers for
app.post('/api/shorturl', (req, res)=>{
	var origUrl = req.body.url;
	var jsonerror = {'error' : 'invalid url'};
	var valid = /^(ftp|http|https):\/\/[^ "]+$/.test(origUrl);

    try{
      var urlObject = new URL(origUrl);
    }catch(err){
      res.send(jsonerror);
      console.log("URL ERROR");
    }

    if(valid){
      try{
        dns.lookup(urlObject.hostname, (err, address)=>{
          if(err){
            res.send(jsonerror);
          }else{
            console.log(address, "ERROR ADDRESS");
            var shortUrl = Math.floor((Math.random()*100000) + 1);
            let newUrl = new mainUrl({
                urlOrig : origUrl,
                urlShort : shortUrl,
                ipAddress : address
              });
            newUrl.save(function(err, data){
              if(err){
                res.send(jsonerror);
              }else{
                var jsonurl = {
                  'original_url' : origUrl,
                  'short_url': shortUrl
                };
                res.send(jsonurl);
              }
            });
          }
        });
      }catch(err){
        res.send(jsonerror);
      } 
    }else{
      res.send(jsonerror);
    }

});

app.get('/api/shorturl/:num?', function(req, res){
	try{
    mainUrl.find({urlShort: Number(req.params.num)}, function(err, data){
      	if(err) {
			console.log(err, "ERROR");
		}else{ 
			try{
				res.redirect(String(data[0].urlOrig));
			}catch(err){console.log("This here is error too.");}
		}
    });
  }catch(err){
		res.json({'error': 'Invalid Number'});
	}
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
