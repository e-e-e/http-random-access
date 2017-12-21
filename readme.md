# http-random-access

An implementation of [abstract-random-access](https://www.npmjs.com/package/abstract-random-access) to access content via http/s.
Providing the same interface as [random-access-file](https://www.npmjs.com/package/random-access-file) and [random-access-memory](https://www.npmjs.com/package/random-access-memory).

This implementation is intended as a drop-in replacement for random-access-file or random-access-memory in the dat-storage configuration. You might want to look at [random-access-http](https://www.npmjs.com/package/random-access-http) for an alternative implementation to see if it better suits your needs.

## Installation

```
npm install http-random-access --save
```

## Basic Example

```js
var raHttp = require('http-random-access')

var file = raHttp('/readme.md', { url: 'https://raw.githubusercontent.com/e-e-e/http-random-access/master/' })

file.read(100, 200, (err, data) => {
  if (err) {
    console.log('Something went wrong!')
    console.log(err)
    return
  }
  console.log(data.toString())
})
```

## API

#### var file = raHttp(file, options)

Open a new random access http file connection.

Options include:
```js
{
  url: string // The url of the dat
  verbose: boolean, // Optional. Default: false.
}
```

#### file.read(offset, length, callback)

Read a buffer at a specific offset of specified length. Callback is called with the read buffer or error if there was an error.

Expects callback of the form `function (err, result) {}`.

#### file.write(offset, buffer, callback)

**Write is not implemented.** This will silently fail with no data being writen.
