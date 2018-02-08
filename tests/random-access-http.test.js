var test = require('tape')
var proxyquire = require('proxyquire').noPreserveCache()
var sinon = require('sinon')
var stoppable = require('stoppable')
var http = require('http')
var port = 3000

var server

var standardHandler = (req, res) => {
  res.setHeader('Content-Type', 'plain/text')
  res.setHeader('Accept-Ranges', 'Bytes')
  if (req.method === 'HEAD') {
    return res.end()
  }
  var range = req.headers.range
  if (range) {
    var match = range.match(/bytes=(\d+)-(\d+)/)
    if (match) {
      var a = parseInt(match[1], 10)
      var b = parseInt(match[2], 10)
      var str = ''
      for (var i = a; i <= b; i++) {
        str += (a % 10)
      }
      res.write(str)
    }
  }
  res.end()
}

function startServer (fn, cb) {
  if (server && server.listening) {
    return server.stop(() => startServer(fn, cb))
  }
  server = stoppable(http.createServer(fn))
  server.listen(port, cb)
}

function stopServer (t) {
  if (!server.listening) return t.end()
  server.stop(() => {
    t.end()
  })
}

test('it uses node http/s agent setting with keepAlive when run in node', (t) => {
  var httpStub = sinon.stub()
  var httpsStub = sinon.stub()
  proxyquire('../index.js', {
    'http': {
      Agent: httpStub
    },
    'https': {
      Agent: httpsStub
    }
  })
  t.ok(httpStub.calledWithNew())
  t.ok(httpStub.calledWith({ keepAlive: true }))
  t.ok(httpsStub.calledWithNew())
  t.ok(httpsStub.calledWith({ keepAlive: true }))
  t.end()
})

test('it does not use node http/s when in browser', (t) => {
  var httpStub = sinon.stub()
  var httpsStub = sinon.stub()
  proxyquire('../index.js', {
    './lib/is-node': false,
    'http': {
      Agent: httpStub
    },
    'https': {
      Agent: httpsStub
    }
  })
  t.ok(httpStub.notCalled)
  t.ok(httpsStub.notCalled)
  t.end()
})

test('raHttp.open() callback returns error if server does not support range requests', (t) => {
  var raHttp = require('../index.js')
  var withoutRangeSupportHandler = (req, res) => {
    res.end()
  }
  startServer(withoutRangeSupportHandler, (err) => {
    t.error(err)
    var ra = raHttp('without-range-support', { url: 'http://localhost:3000' })
    ra.read(0, 10, (err, res) => {
      t.ok(err.message.search(/Not opened/) !== -1)
      stopServer(t)
    })
  })
})

test('raHttp.open() callback returns error if call to axios.head() fails', (t) => {
  var raHttp = require('../index.js')
  var notFoundHandler = (req, res) => {
    res.statusCode = 404
    res.end()
  }
  startServer(notFoundHandler, (err) => {
    t.error(err)
    var ra = raHttp('not-found', { url: 'http://localhost:3000' })
    ra.read(0, 10, (err, res) => {
      t.ok(err.message.search(/Not opened/) !== -1)
      stopServer(t)
    })
  })
})

test('raHttp.read() returns a buffer of length requested', (t) => {
  var raHttp = require('../index.js')
  startServer(standardHandler, (err) => {
    t.error(err)
    var ra = raHttp('test', { url: 'http://localhost:3000' })
    ra.read(10, 20, (err, data) => {
      t.error(err)
      t.ok(data instanceof Buffer)
      t.same(data.length, 20)
      stopServer(t)
    })
  })
})

test('raHttp.write does not throw error', (t) => {
  var raHttp = require('../index.js')
  startServer(standardHandler, (err) => {
    t.error(err)
    var ra = raHttp('test-write', { url: 'http://localhost:3000' })
    t.doesNotThrow(ra.write.bind(ra, 10, 'some-data'))
    stopServer(t)
  })
})

test('raHttp.write logs with options.verbose === true', (t) => {
  var stub = sinon.stub()
  var proxyRaHttp = proxyquire('../index', {
    './lib/logger': {
      log: stub
    }
  })
  startServer(standardHandler, (err) => {
    t.error(err)
    var ra = proxyRaHttp('test-write', { url: 'http://localhost:3000', verbose: true })
    ra.write(10, 'some-data', (err, res) => {
      t.error(err)
      t.ok(stub.calledWith('trying to write', 'test-write', 10, 'some-data'))
      stopServer(t)
    })
  })
})

test('raHttp.del does not throw error', (t) => {
  var raHttp = require('../index.js')
  startServer(standardHandler, (err) => {
    t.error(err)
    var ra = raHttp('test-del', { url: 'http://localhost:3000' })
    t.doesNotThrow(ra.del.bind(ra, 10, 100))
    stopServer(t)
  })
})

test('raHttp.del logs with options.verbose === true', (t) => {
  var stub = sinon.stub()
  var proxyRaHttp = proxyquire('../index', {
    './lib/logger': {
      log: stub
    }
  })
  startServer(standardHandler, (err) => {
    t.error(err)
    var ra = proxyRaHttp('test-del', { url: 'http://localhost:3000', verbose: true })
    ra.del(10, 100, (err, res) => {
      t.error(err)
      t.ok(stub.calledWith('trying to del', 'test-del', 10, 100))
      stopServer(t)
    })
  })
})
