var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SecretarySchema = new Schema({
    doctorId:{
        type: Schema.Types.ObjectId, ref: 'doctor'
    },
    _id :{
        type: Schema.Types.ObjectId, ref: 'user'
    },
});

module.exports = mongoose.model('secretary', SecretarySchema);