var express = require('express');
var app = express();

app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/dist'));

/* Force redirect to https */
app.get('*', function(req, res, next){

	console.log('Request to: '+req.url+' is secore: ' + req.secure);

	if((process.env.NODE_ENV === 'production') && !req.secure){
		res.redirect('https://ftn.herokuapp.com' + req.url);
	} else {
		next();
	}
});

app.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
	console.log('Process env: ' + process.env.NODE_ENV);
});