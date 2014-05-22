var express = require('express');
var app = express();
var port = process.env.POST || 3000;

app.use(express.static(__dirname + '/public'));

app.listen(port);