var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	name: { 
		type: String, 
		required: true,
		get: global.decrypt, 
		set: global.encrypt
	},
	email: { 
		type: String, 
		required: true,
		get: global.decrypt, 
		set: global.encrypt
	},
	password: { 
		type: String, 
		required: true,
		get: global.decrypt, 
		set: global.encrypt
	},
	userType: {
		type: String,
		required: true
	},
	profileImage: {
		type: String
	}
}, { toJSON: { getters: true } });

module.exports = mongoose.model('user', UserSchema);