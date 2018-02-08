var axios = require('axios')
var randomAccess = require('random-access-storage')
var logger = require('./lib/logger')
var isNode = require('./lib/is-node')
var validUrl = require('./lib/valid-url')

var defaultOptions = {
  responseType: 'arraybuffer',
  timeout: 60000,
  // follow up to 10 HTTP 3xx redirects
  maxRedirects: 10,
  maxContentLength: 50 * 1000 * 1000 // cap at 50MB,
}

if (isNode) {
  var http = require('http')
  var https = require('https')
  // keepAlive pools and reuses TCP connections, so it's faster
  defaultOptions.httpAgent = new http.Agent({ keepAlive: true })
  defaultOptions.httpsAgent = new https.Agent({ keepAlive: true })
}

var randomAccessHttp = function (filename, options) {
  var url = options && options.url
  if (!filename || (!validUrl(filename) && !validUrl(url))) {
    throw new Error('Expect first argument to be a valid URL or a relative path, with url set in options')
  }
  var axiosConfig = Object.assign({}, defaultOptions)
  if (options) {
    if (url) axiosConfig.baseURL = url
    if (options.timeout) axiosConfig.timeout = options.timeout
    if (options.maxRedirects) axiosConfig.maxRedirects = options.maxRedirects
    if (options.maxContentLength) axiosConfig.maxContentLength = options.maxContentLength
  }
  var _axios = axios.create(axiosConfig)
  var file = filename
  var verbose = !!(options && options.verbose)

  return randomAccess({
    open: (req) => {
      if (verbose) logger.log('Testing to see if server accepts range requests', url, file)
      // should cache this
      _axios.head(file)
        .then((response) => {
          if (verbose) logger.log('Received headers from server')
          const accepts = response.headers['accept-ranges']
          if (accepts && accepts.toLowerCase().indexOf('bytes') !== -1) {
            return req.callback(null)
          }
          return req.callback(new Error('Accept-Ranges does not include "bytes"'))
        })
        .catch((err) => {
          if (verbose) logger.log('Error opening', file, '-', err)
          req.callback(err)
        })
    },
    read: (req) => {
      var headers = {
        range: `bytes=${req.offset}-${req.offset + req.size - 1}`
      }
      if (verbose) logger.log('Trying to read', file, headers.Range)
      _axios.get(file, { headers: headers })
        .then((response) => {
          if (verbose) logger.log('read', JSON.stringify(response.headers, null, 2))
          req.callback(null, Buffer.from(response.data))
        })
        .catch((err) => {
          if (verbose) {
            logger.log('error', file, headers.Range)
            logger.log(err, err.stack)
          }
          req.callback(err)
        })
    },
    write: (req) => {
      // This is a dummy write function - does not write, but fails silently
      if (verbose) logger.log('trying to write', file, req.offset, req.data)
      req.callback()
    },
    del: (req) => {
      // This is a dummy del function - does not del, but fails silently
      if (verbose) logger.log('trying to del', file, req.offset, req.size)
      req.callback()
    }
  })
}

module.exports = randomAccessHttp
