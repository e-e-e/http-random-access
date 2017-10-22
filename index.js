var axios = require('axios')
var Abstract = require('abstract-random-access')
var inherits = require('inherits')
var http = require('http')
var https = require('https')
var Buffer = require('Buffer')

var Store = function (filename, options) {
  if (!(this instanceof Store)) return new Store(filename, options)
  Abstract.call(this)
  this.axios = axios.create({
    baseURL: options.url,
    timeout: 60000,
    // keepAlive pools and reuses TCP connections, so it's faster
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
    // follow up to 10 HTTP 3xx redirects
    maxRedirects: 10,
    maxContentLength: 50 * 1000 * 1000 // cap at 50MB
  })
  this.url = options.url
  this.file = filename
  this.verbose = !!options.verbose
  inherits(Store, Abstract)
}

Store.prototype._open = function (callback) {
  if (this.verbose) console.log('Testing to see if server accepts range requests', this.url, this.file)
  this.axios.head(this.file)
    .then((response) => {
      if (this.verbose) console.log('Received headers from server')
      const accepts = response.headers['accept-ranges']
      if (accepts && accepts.toLowerCase().indexOf('bytes') !== -1) {
        return callback(null)
      }
      return callback(new Error('Accept-Ranges does not include "bytes"'))
    })
    .catch((err) => {
      if (this.verbose) console.log('Error opening', this.file, '-', err)
      callback(err)
    })
}

Store.prototype._read = function (offset, length, callback) {
  var headers = {
    range: `bytes=${offset}-${offset + length - 1}`
  }
  if (this.verbose) console.log('Trying to read', this.file, headers.Range)
  this.axios.get(this.file, { headers: headers })
    .then((response) => {
      if (this.verbose) console.log('read', JSON.stringify(response.headers, null, 2))
      callback(null, Buffer.from(response.data))
    })
    .catch((err) => {
      if (this.verbose) {
        console.log('error', this.file, headers.Range)
        console.log(err, err.stack)
      }
      callback(err)
    })
}

// This is a dummy write function - does not write, but fails silently
Store.prototype._write = function (offset, buffer, callback) {
  if (this.verbose) console.log('trying to write', this.file, offset, buffer)
  callback()
}

module.exports = Store
