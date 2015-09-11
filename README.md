# catbox-aerospike
[Aerospike](http://www.aerospike.com) adapter for [catbox](https://github.com/hapijs/catbox)  
[![npm version](https://badge.fury.io/js/catbox-aerospike.png)](http://npmjs.org/package/catbox-aerospike)
[![Build Status](https://travis-ci.org/ooogway/catbox-aerospike.svg?branch=master)](https://travis-ci.org/ooogway/catbox-aerospike)

## Options

- `hosts` - Array of Aerospike servers
   - `addr` - Aerospike server hostname. Defaults to `'127.0.0.1'`.
   - `port` - Aerospike server port or unix domain socket path. Defaults to `3000`.
- `partition` - corresponds to [Aerospike namespace](http://www.aerospike.com/docs/architecture/data-model.html#namespaces). Defaults to `test`
- `segment` - corresponds to [Aerospike set](http://www.aerospike.com/docs/architecture/data-model.html#sets). Defaults to `test`

**NOTE** Aerospike Namespaces are configured when the cluster is started, and cannot be created at runtime. Default Aerospike namespace is `test`. However, Catbox intializes adapters with default partition name `catbox`, if no partition name is configured. Please refer to [Namespace Configuration](http://www.aerospike.com/docs/operations/configure/namespace/) to use appropriate namespace.

## Tests

The test suite expects an Aerospike server to be running on port 3000. Refer to Aerospike [Installation guide](http://www.aerospike.com/docs/operations/install/) OR run Aerospike server in a Docker container

```sh
$ docker run -it -p 3000:3000 -p 3001:3001 -p 3002:3002 -p 3003:3003 aerospike/aerospike-server
```

### Running Tests
```sh
$ npm test
```
