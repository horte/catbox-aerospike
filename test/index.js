// Load Modules
var Code = require('code');
var Lab = require('lab');
var Catbox = require('catbox');
var Aerospike = require('..');

// Internals
var internals = {};

// Test shortcuts

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.test;

describe('Aerospike', function(){

    it('throws an error if not created with new', function(done){

        var fn = function(){

            var aerospike = Aerospike();
        }

        expect(fn).to.throw(Error);
        done();
    });
    
    it('creates a new connection', function(done){
        
        var client = new Catbox.Client(Aerospike);
        client.start(function(err){
            
            expect(client.isReady()).to.equal(true);
            done();
        });
    });

    it('closes the connection', function(done){
        
        var client = new Catbox.Client(Aerospike);
        client.start(function(err){
            
            expect(client.isReady()).to.equal(true);
            client.stop();
            expect(client.isReady()).to.equal(false);
            done();
        });
    });

    it('gets an item after setting it', function(done){

        var client = new Catbox.Client(Aerospike);
        client.start(function(err){

            var key = {namespace: 'test', id: 'x', segment: 'test'};
            client.set(key, '123', 500, function(err){
                expect(err).to.not.exist();
                client.get(key, function(err, result){
                    expect(err).to.equal(null);
                    expect(result.item).to.equal('123');
                    done();
                });
            });
        });
    });

    it('fails setting an item with circular references', function(done){

        var client = new Catbox.Client(Aerospike);
        client.start(function(err){
            
            var key = {namespace: 'test', id: 'x', segment: 'test'};
            var value = {a: 1};
            value.b = value;
            client.set(key, value, 10, function(err){
                
                expect(err.message).to.equal('Converting circular structure to JSON');
                done();
            });
        });
    });

    it('ignored starting a connection twice on same event', function(done){

        var client = new Catbox.Client(Aerospike);
        var x = 2;
        var start = function(){
            
            client.start(function(err){

                expect(client.isReady()).to.equal(true);
                --x;
                if(!x){
                    done();
                }
            });

        };
        start();
        start();
    });

    it('ignored starting a connection twice chained', function(done){

        var client = new Catbox.Client(Aerospike);
        client.start(function(err){

            expect(err).to.not.exist();
            expect(client.isReady()).to.equal(true);
            
            client.start(function(err){

                expect(err).to.not.exist();
                expect(client.isReady()).to.equal(true);
                done();
            });
        });
    });

    it('returns not found on get when using null key', function(done){
        
        var client = new Catbox.Client(Aerospike);
        client.start(function(err){

            client.get(null, function(err, result){

                expect(err).to.equal(null);
                expect(result).to.equal(null);
                done();
            });
        });
    });

    it('returns not found on get when item expired', function(done){

        var client = new Catbox.Client(Aerospike);
        client.start(function(err){

            var key = {id: 'x', namespace: 'test', segment: 'test'};
            client.set(key, 'x', 1, function(err){

                expect(err).to.not.exist();
                setTimeout(function(){

                    client.get(key, function(err, result){

                        expect(err).to.equal(null);
                        expect(result).to.equal(null);
                        done();
                    });
                }, 2);
            });
        });
    });

    it('returns error on set when using null key', function (done) {

        var client = new Catbox.Client(Aerospike);
        client.start(function (err) {

            client.set(null, {}, 1000, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on get when using invalid key', function (done) {

        var client = new Catbox.Client(Aerospike);
        client.start(function (err) {

            client.get({}, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on drop when using invalid key', function (done) {

        var client = new Catbox.Client(Aerospike);
        client.start(function (err) {

            client.drop({}, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on set when using invalid key', function (done) {

        var client = new Catbox.Client(Aerospike);
        client.start(function (err) {

            client.set({}, {}, 1000, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });


    it('ignores set when using non-positive ttl value', function (done) {

        var client = new Catbox.Client(Aerospike);
        client.start(function (err) {

            var key = {namespace: 'test', id: 'x', segment: 'test' };
            client.set(key, 'y', 0, function (err) {

                expect(err).to.not.exist();
                done();
            });
        });
    });

    it('returns error on drop when using null key', function (done) {

        var client = new Catbox.Client(Aerospike);
        client.start(function (err) {

            client.drop(null, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on get when stopped', function (done) {

        var client = new Catbox.Client(Aerospike);
        client.stop();
        var key = {namespace: 'test', id: 'x', segment: 'test' };
        client.connection.get(key, function (err, result) {

            expect(err).to.exist();
            expect(result).to.not.exist();
            done();
        });
    });

    it('returns error on set when stopped', function (done) {

        var client = new Catbox.Client(Aerospike);
        client.stop();
        var key = {namespace: 'test',  id: 'x', segment: 'test' };
        client.connection.set(key, 'y', 1, function (err) {

            expect(err).to.exist();
            done();
        });
    });

    it('returns error on drop when stopped', function (done) {

        var client = new Catbox.Client(Aerospike);
        client.stop();
        var key = {namespace: 'test', id: 'x', segment: 'test' };
        client.connection.drop(key, function (err) {

            expect(err).to.exist();
            done();
        });
    });

    it('returns error on missing segment name', function (done) {

        var config = {
            expiresIn: 50000
        };
        var fn = function () {

            var client = new Catbox.Client(Aerospike);
            var cache = new Catbox.Policy(config, client, '');
        };
        expect(fn).to.throw(Error);
        done();
    });

    it('returns error on bad segment name', function (done) {

        var config = {
            expiresIn: 50000
        };
        var fn = function () {

            var client = new Catbox.Client(Aerospike);
            var cache = new Catbox.Policy(config, client, 'a\0b');
        };
        expect(fn).to.throw(Error);
        done();
    });

    it('returns error when cache item dropped while stopped', function (done) {

        var client = new Catbox.Client(Aerospike);
        client.stop();
        client.drop('a', function (err) {

            expect(err).to.exist();
            done();
        });
    });

    describe('#start', function () {

        it('sets client to when the connection succeeds', function (done) {

            var options = {
                hosts: [{
                    addr: '127.0.0.1',
                    port: 3000
                }]
            };

            var aerospike = new Aerospike(options);

            aerospike.start(function (err) {

                expect(err).to.not.exist();
                expect(aerospike.client).to.exist();
                done();
            });
        });

        it('reuses the client when a connection is already started', function (done) {

            var options = {
                hosts: [{
                    addr: '127.0.0.1',
                    port: 3000
                }]
            };

            var aerospike = new Aerospike(options);

            aerospike.start(function (err) {

                expect(err).to.not.exist();
                var client = aerospike.client;

                aerospike.start(function () {

                    expect(client).to.equal(aerospike.client);
                    done();
                });
            });
        });

        it('returns an error when connection fails', function (done) {

            var options = {
                hosts: [{
                    addr: '127.0.0.1',
                    port: 3005
                }]
            };

            var aerospike = new Aerospike(options);

            aerospike.start(function (err) {

                expect(err).to.exist();
                expect(err).to.be.instanceOf(Error);
                expect(aerospike.client).to.not.exist();
                done();
            });
        });

    });

    describe('#isReady', function () {

        it ('returns true when when connected', function (done) {
 
            var options = {
                hosts: [{
                    addr: '127.0.0.1',
                    port: 3000
                }]
            };
            var aerospike = new Aerospike(options);

            aerospike.start(function (err) {

                expect(err).to.not.exist();
                expect(aerospike.isReady()).to.equal(true);

                aerospike.stop();

                done();
            });
        });

        it ('returns false when stopped', function (done) {

            var options = {
                hosts: [{
                    addr: '127.0.0.1',
                    port: 3000
                }]
            };
            var aerospike = new Aerospike(options);

            aerospike.start(function (err) {

                expect(err).to.not.exist();
                expect(aerospike.isReady()).to.equal(true);

                aerospike.stop();

                expect(aerospike.isReady()).to.equal(false);

                done();
            });
        });

        it ('returns false when disconnected', function (done) {

            var options = {
                hosts: [{
                    addr: '127.0.0.1',
                    port: 3000
                }]
            };
            var aerospike = new Aerospike(options);

            aerospike.start(function (err) {

                expect(err).to.not.exist();
                expect(aerospike.client).to.exist();
                expect(aerospike.isReady()).to.equal(true);

                aerospike.client.close();

                expect(aerospike.isReady()).to.equal(false);

                aerospike.stop();
                done();
            });
        });
    });
});
