var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DoctorSchema = new Schema({
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
    crm :{
        type : String,
        get: global.decrypt, 
        set: global.encrypt
    },
    ufCrm:{
        type : String,
        get: global.decrypt, 
        set: global.encrypt
    },
    doctorType:{
        type : String,
        get: global.decrypt, 
        set: global.encrypt
    },
    crmStatus:{
        type : String,
        get: global.decrypt, 
        set: global.encrypt
    },
    showOpinions: Boolean,
    _id :{
        type: Schema.Types.ObjectId, ref: 'user'
    },
    healthInsurance: [{healthInsurance: String}],
    opinions : [{generalRating : Number, punctualityRating: Number, attentionRating: Number, installationRating: Number, comment : String }]
    
}, { toJSON: { getters: true } });

module.exports = mongoose.model('doctor', DoctorSchema);