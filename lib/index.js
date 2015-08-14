// Load Modules
var Client = require('aerospike').client;
var Key = require('aerospike').key;
var Status = require('aerospike').status;
var Hoek = require('hoek');

// Internals
var internals = {};

internals.defaults = {
    hosts: [{
        addr: '127.0.0.1',
        port: 3000
    }],
    partition: 'test'
};

// Exports
exports = module.exports = internals.Connection = function(options){

    Hoek.assert(this.constructor === internals.Connection, 'Aerospike cache client must be instantiated using new');
    this.settings = Hoek.applyToDefaults(internals.defaults, options);
    this.client = null;
    return this;
};

internals.Connection.prototype.start = function(next){
    var self = this;
    if(this.client){
        return Hoek.nextTick(next)();
    }
    var client = Client(this.settings);

    client.connect(function(error, clientObject){
        if(error.code !== Status.AEROSPIKE_OK){
            return next(new Error(error.message));
        }
        else {
            self.client = clientObject;
            self.connected = true;
            return next();
        }
    });
};

internals.Connection.prototype.stop = function () {
    if (this.client) {
        console.log(this.client.toString());
        this.client.close();
        this.connected = false;
        this.client = null;
    }
};

internals.Connection.prototype.isReady = function () {
    return !!this.client && this.connected;
};

internals.Connection.prototype.validateSegmentName = function (name) {
    if (!name) {
        return new Error('Empty string');
    }

    if (name.indexOf('\0') !== -1) {
        return new Error('Includes null character');
    }

    return null;
};

internals.Connection.prototype.get = function (key, callback) {
    if(!this.client){
        return callback(new Error('Connection not started'));
    }

    this.client.get(this.generateKey(key), function(err, record, meta){
        var envelop = null;
        if(err.code !== Status.AEROSPIKE_OK){
            callback(err, null);
        }
        else {
            try{
                envelop = record;
                if(!envelop.item || !envelop.stored){
                    return callback(new Error('Bad envelop content'));
                }
                return callback(null, envelop);
            }
            catch (e) {
                return callback(e, null);
            }
        }
    });
};


internals.Connection.prototype.set = function (key, value, ttl, callback) {
    var self = this;
    if(!this.client){
        return callback(new Error('Connection not started'));
    }
    var envelop = {
        PK: key.id,
        item: value,
        stored: Date.now(),
        ttl: ttl
    };
    var metadata = {
        ttl: ttl,
        gen: 1
    };
    try{
        var str = JSON.stringify(envelop);
        this.client.put(this.generateKey(key), envelop, metadata, function(err, returnKey){
            if(err.code !== Status.AEROSPIKE_OK){
                return callback(err);
            }
            else {
                return callback(null);
            }
        });
    }
    catch(e){
        return callback(e);
    }
};

internals.Connection.prototype.drop  = function(key, next){
    if(!this.client){
        return next(new Error('Connection not started'));
    }

    this.client.remove(this.generateKey(key), function(err, key){
        if(err.code !== Status.AEROSPIKE_OK){
            return next(err);
        }
        else {
            return next(null);
        }
    })
};

internals.Connection.prototype.generateKey = function(key){
    if(typeof key === 'string'){
        return Key(this.settings.partition, this.settings.segment, key);
    }
    else if(typeof key === 'object'){
        if(!key.namespace){
            key.namespace = this.settings.partition;
        }
        if(!key.segment) {
            key.segment = this.settings.segment;
        }
        //console.log(Key(key.namespace, key.segment, key.id));
        return Key(key.namespace, key.segment, key.id);
    }
    return new Error('Invalid Key');
};
