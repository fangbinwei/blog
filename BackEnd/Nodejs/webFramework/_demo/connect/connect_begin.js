var connect = require('connect');
var http = require('http');
var fs = require('fs')

var app = connect();
// gzip/deflate outgoing responses
var compression = require('compression');
app.use(compression());
// parse urlencoded request bodies into req.body
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

// respond to all requests
app.use(function(req, res){
  res.setHeader('Content-Type', 'text/plain');
  res.end(`Hello from Connect!\nHello from Connect!\nHello from Connect!\nHello from Connect!\nHello from Connect!\nHello from Connect!\nHello from Connect!\nHello from Connect!\nHello from Connect!\nHello from Connect!\nHello from Connect!\nHello from Connect!\n
  `);
});

//create node.js http server and listen on port
http.createServer(app).listen(3000);