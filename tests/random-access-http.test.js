var test = require('tape')
var proxyquire = require('proxyquire')
var sinon = require('sinon')
var http = require('http')
var port = 3000

const server = http.createServer((req, res) => {
  if (req.method === 'HEAD') {
    res.setHeader('Content-Type', 'plain/text')
    res.setHeader('Accept-Ranges', 'Bytes')
    res.end()
    return
  }
  res.setHeader('Content-Type', 'plain/text')
  res.setHeader('Accept-Ranges', 'Bytes')
  res.end('Hello Node.js Server!')
})

test('setup server before tests', (t) => {
  server.listen(port, (err) => {
    t.error(err)
    t.end()
  })
})

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

test('raHttp ')

test('raHttp.open() callback returns error if server does not support range requests', (t) => {
  t.end()
})

test('raHttp.open() callback returns error if call to axios.head() fails', (t) => {
  t.end()
})

test('raHttp.read() returns a buffer', (t) => {
  t.end()
})

test('raHttp.write does not throw error', (t) => {
  var raHttp = require('../index.js')
  var ra = raHttp('test-write', { url: 'http://localhost:3000' })
  t.doesNotThrow(ra.write.bind(ra, 10, 'some-data'))
  t.end()
})

test('raHttp.write logs with options.verbose === true', (t) => {
  var stub = sinon.stub()
  var proxyRaHttp = proxyquire('../index', {
    './lib/logger': {
      log: stub
    }
  })
  var ra = proxyRaHttp('test-write', { url: 'http://localhost:3000', verbose: true })
  ra.write(10, 'some-data', (err, res) => {
    t.error(err)
    t.ok(stub.calledWith('trying to write', 'test-write', 10, 'some-data'))
    t.end()
  })
})

test('raHttp.del does not throw error', (t) => {
  var raHttp = require('../index.js')
  var ra = raHttp('test-del', { url: 'http://localhost:3000' })
  t.doesNotThrow(ra.del.bind(ra, 10, 100))
  t.end()
})

test('raHttp.del logs with options.verbose === true', (t) => {
  var stub = sinon.stub()
  var proxyRaHttp = proxyquire('../index', {
    './lib/logger': {
      log: stub
    }
  })
  var ra = proxyRaHttp('test-del', { url: 'http://localhost:3000', verbose: true })
  ra.del(10, 100, (err, res) => {
    t.error(err)
    t.ok(stub.calledWith('trying to del', 'test-del', 10, 100))
    t.end()
  })
})

test('teardown', (t) => {
  server.close()
  t.end()
})
