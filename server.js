var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = [{

}];


app.get('/', function (req, res) {
	res.send('Todo Api Root');
});

app.listen(PORT, function (){
	console.log('Express listening on port '+ PORT +'!');
});