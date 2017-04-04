// Load Modules
var Aerospike = require('aerospike');
var Key = Aerospike.Key;
var Status = Aerospike.status;
var Hoek = require('hoek');

// Internals
var internals = {};

internals.defaults = {
    hosts: [{
        addr: '127.0.0.1',
        port: 3000
    }],
    segment: 'test',
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

    Aerospike.connect(this.settings, function(error, clientObject){
        if(error){
            return next(new Error(error.message));
        }
        else {
            self.client = clientObject;
            self.connected = true;
            return next(null);
        }
    });
};

internals.Connection.prototype.stop = function () {
    if (this.client) {
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
        if(err){
            if(err.code === Status.AEROSPIKE_ERR_RECORD_NOT_FOUND){
                callback(null, null);
            }
            else {
                callback(new Error('Error getting result'), null);
            }
        }
        else {
            envelop = record;
            if(!envelop.item || !envelop.stored){
                return callback(new Error('Bad envelop content'));
            }
            return callback(null, envelop);
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
        ttl: Math.ceil(parseInt(ttl, 10) / 1000),
        gen: 1,
    };
    var policy = {
      exists: Aerospike.policy.exists.CREATE_OR_REPLACE,
    };

    try{
        var str = JSON.stringify(envelop);
        this.client.put(this.generateKey(key), envelop, metadata, policy, function(err, returnKey){
            if(err){
                return callback(new Error('Error writing data'));
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
        if(err){
            return next(new Error('Error dropping item'));
        }
        else {
            return next(null);
        }
    })
};

internals.Connection.prototype.generateKey = function(key){
    if(typeof key === 'object' && !Array.isArray(key)){
        if(!key.namespace){
            key.namespace = this.settings.partition;
        }
        if(!key.segment) {
            key.segment = this.settings.segment;
        }
        return new Key(key.namespace, key.segment, key.id);
    }
    else if(typeof key === 'string'){
        return new Key(this.settings.partition, this.settings.segment, key);
    }
    else {
        return new Error('Invalid Key');
    }
};
