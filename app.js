var express = require('express');
var app = express();
var path    = require("path");
var bodyParser = require('body-parser')

app.use(bodyParser.json());       // To support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // To support URL-encoded bodies
	extended: true
})); 

app.use('/vendor', express.static('public/vendor'))
app.use('/styles', express.static('public/styles'))
app.use('/images', express.static('public/images'))
app.use('/scripts', express.static('public/scripts'))

app.get('/login(.htm)?', function(req, res){
	res.sendFile(path.join(__dirname + '/public/login.htm'));
});
app.post('/login(.htm)?', function(req, res){
	var login = req.body.username;
	var passwd = req.body.password;
	// TODO:
	res.send('success');
})

app.get('/register(.htm)?', function(req, res){
	res.sendFile(path.join(__dirname + '/public/register.htm'));
})
app.post('/register(.htm)?', function(req, res){

})

app.get('/panel(.htm)?', function(req, res){
	res.sendFile(path.join(__dirname + '/public/index.htm'));
})

app.listen(80);