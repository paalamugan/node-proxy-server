const url = require('url');
const http = require('http');
const https = require('https');

const PORT = process.argv[2] || 9100;

const server = http.createServer(function(req, res) {
  const urlStr = req.url.substr(1);
  console.log('==> Starting req' + urlStr + '\n');

  req.pause();

  const options = url.parse(urlStr);
  options.headers = req.headers;
  options.method = req.method;
  options.agent = false;

  options.headers['host'] = options.host;
  
  const serverObj = (options.protocol == 'https:' ? https : http);

  const connector = serverObj.request(options, function(serverResponse) {
    console.log('<== Received res for', serverResponse.statusCode, urlStr);
    console.log('\t-> Request Headers: ', options);
    console.log(' ');
    console.log('\t-> Response Headers: ', serverResponse.headers);

    serverResponse.pause();

    serverResponse.headers['access-control-allow-origin'] = '*';

    switch (serverResponse.statusCode) {
      // check status with server status code
      case 200: case 201: case 202: case 203: case 204: case 205: case 206:
      case 304:
      case 400: case 401: case 402: case 403: case 404: case 405:
      case 406: case 407: case 408: case 409: case 410: case 411:
      case 412: case 413: case 414: case 415: case 416: case 417: case 418:
        res.writeHeader(serverResponse.statusCode, serverResponse.headers);
        serverResponse.pipe(res, {end:true});
        serverResponse.resume();
      break;

      // redirect pass through.  
      case 301:
      case 302:
      case 303:
        serverResponse.statusCode = 303;
        serverResponse.headers['location'] = 'http://localhost:'+PORT+'/'+serverResponse.headers['location'];
        console.log('\t-> Redirecting to ', serverResponse.headers['location']);
        res.writeHeader(serverResponse.statusCode, serverResponse.headers);
        serverResponse.pipe(res, { end:true });
        serverResponse.resume();
      break;

      // throw error if above condition is not satisfied. 
      default:
        var stringifiedHeaders = JSON.stringify(serverResponse.headers, null, 4);
        serverResponse.resume();
        res.writeHeader(500, {
          'content-type': 'text/plain'
        });
        res.end(process.argv.join(' ') + ':\n\nError ' + serverResponse.statusCode + '\n' + stringifiedHeaders);
      break;
    }

    console.log('\n\n');
  });
  req.pipe(connector, { end: true });
  req.resume();
});

console.log('Server listening on port http://localhost:%s...', PORT);
server.listen(PORT);
