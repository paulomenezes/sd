var morgan = require('morgan');
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var multer = require('multer');

var cors = require('cors');
var jwt = require('jsonwebtoken');

var config = require('./config');

var mongoose = require('mongoose');
mongoose.connect(config.database);

var app = express();
app.set('superSecret', config.secret);
app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

global.getSuperSecret = app.get('superSecret');

var crypto = require('crypto');

global.encrypt = function (text){
	var cipher = crypto.createCipher('aes-256-ctr', config.secret);
	var crypted = cipher.update(text,'utf8','hex');
	crypted += cipher.final('hex');
	return crypted;
} 

global.decrypt = function (text){
	if (text === null || typeof text === 'undefined') {return text;};
	var decipher = crypto.createDecipher('aes-256-ctr', config.secret);
	try {
		var dec = decipher.update(text,'hex','utf8');
		dec += decipher.final('utf8');
		return dec;
	} catch(ex) {
		console.log('failed: ' + text);
		console.log(ex);
		return;
	}
}

app.use(function (req, res, next) {
	if (req.url.indexOf('/users/login') >= 0 || req.url.indexOf('password') >= 0 || 
		(req.url.indexOf('/users') >= 0 && req.method == 'POST')) {
		next();
	} else {
		var token = req.body.token  || req.query.token || req.headers['x-access-token'];

		if (token) {
			jwt.verify(token, global.getSuperSecret, function (error, decoded) {
				if (error) {
					return res.json({
						success: false,
						message: 'Token inválido'
					});
				} else {
					req.decoded = decoded;
					next();
				}
			})
		} else {
			return res.status(403).send({
				success: false,
				message: 'Nenhum token enviado'
			});
		}
	}
});

app.use('/api/users', require('./routes/user.js'));

var port = Number(process.env.PORT || 8080);

app.listen(port, function () {
	console.log('Server running at port ' + port);
});