var http = require('http');
var url = require('url');
var querystring = require('querystring');
var authorization = null;
var isTokenExpired = false;

http.createServer(function (request, response) {

  response.writeHead(200, {'Content-Type': 'application/json'});

  var pathname = url.parse(request.url).pathname;

  authorization = response.getHeader('Authorization');
  if (authorization) {
    var token_time = parseFloat(authorization);
    var cur_time = new Date().getTime();
    isTokenExpired = cur_time - token_time < 30 * 1000;
  }

  if (pathname == "/get_token"){//GET
    // get a new token or refresh the token
    var result = {
      "success" : true,
      "data" : {
        "token" : new Date().getTime().toString()
      }
    }
    response.end(JSON.stringify(result));
  }else if (pathname == "/refresh_token" && request.method === 'POST'){//POST

    var body = {
      "success" : true,
      "msg": "refresh token success",
      "data" : {
        "token" : new Date().getTime().toString()
      }
    }

    request.on('data', function (chunk) {
      body = {
        "success" : true,
          "data" : {
          "token" : new Date().getTime().toString()
        }
      }
    });

    response.end(JSON.stringify(body));
  } else if (pathname == "/test_post" && request.method === 'POST') {

    if (isTokenExpired){
      response.end(JSON.stringify({"success": false, "error_code" : 1001, "msg": "token expired"}));
    } else {
      var body = {
        "success" : true,
        "msg": "test post success",
        "data" : null
      }

      request.on('data', function (chunk) {
        body = {
          "success" : true,
          "data" : {
            "token" : new Date().getTime().toString()
          }
        }
      });

      response.end(JSON.stringify(body));
    }

  }else if (pathname == "/request"){//GET
    // Normal request
    if (isTokenExpired) {
      response.end(JSON.stringify({"success": false, "error_code" : 1001, "msg": "token expired"}));
    }else {
      var result = {
        "success" : true,
        "data" : {
          "result" : true
        }
      }
      response.end(JSON.stringify(result));
    }
  }

}).listen(8000);

console.log('Server running at http://127.0.0.1:8888/');