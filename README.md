# catbox-aerospike
Aerospike adapter for catbox

## Options

- `hosts` - Array of Aerospike servers
   - `addr` - the Aerospike server hostname. Defaults to `'127.0.0.1'`.
   - `port` - the Aerospike server port or unix domain socket path. Defaults to `3000`.
- `partition` - this will store items under keys that start with this value. (Default: 'test')

## Tests

The test suite expects an Aerospike server to be running on port 3000.

```sh
npm test
```
