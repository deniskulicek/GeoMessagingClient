var express = require('express');
var app = express();
var port = process.env.POST || 3333;

app.use(express.static(__dirname + '/dist'));

app.listen(port, function(){
	console.log('Express server listening on port: ' + port);
});