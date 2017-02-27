var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PatientSchema = new Schema({
    addressStreet :{
        type : String,
        get: global.decrypt, 
        set: global.encrypt
    },
    addressNumber :{
        type : String,
        get: global.decrypt, 
        set: global.encrypt
    },
    city :{
        type : String,
        get: global.decrypt, 
        set: global.encrypt
    },
    state :{
        type : String,
        get: global.decrypt, 
        set: global.encrypt
    },
    zipCode :{
        type : String,
        get: global.decrypt, 
        set: global.encrypt
    },
    country :{
        type : String,
        get: global.decrypt, 
        set: global.encrypt
    },
    phone :{
        type : String,
        get: global.decrypt, 
        set: global.encrypt
    },
    healthInsurance:{
        type: String,
        get: global.decrypt, 
        set: global.encrypt
    },
    _id :{
        type: Schema.Types.ObjectId, ref: 'user'
    },
    bodyPart : [{part : String, subpart: String, problems: [{local:String,problem: String, description:String, severity: String, occurredDate : Date, resolved: Boolean,level:String}]}]
}, { toJSON: { getters: true } });

module.exports = mongoose.model('patient', PatientSchema);