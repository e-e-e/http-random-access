# random-access-http

An implementation of [abstract-random-access](https://www.npmjs.com/package/abstract-random-access) to access content via http/s.
Providing the same interface as [random-access-file](https://www.npmjs.com/package/random-access-file) and [random-access-memory](https://www.npmjs.com/package/random-access-memory).

## Installation

```
npm install random-access-http --save
```

## API

#### var file = raHttp(file, options)

Open a new random access http connection.

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
