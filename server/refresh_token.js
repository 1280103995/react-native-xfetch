let http = require('http');
let url = require('url');
let querystring = require('querystring');
let authorization = null;
let isTokenExpired = false;

http.createServer(function (request, response) {

  response.writeHead(200, {'Content-Type': 'application/json'});

  let pathname = url.parse(request.url).pathname;

  authorization = request.headers.authorization;
  if (authorization) {
    let token_time = parseFloat(authorization);
    let cur_time = new Date().getTime();
    isTokenExpired = cur_time - token_time < 30 * 1000;
  }

  if (pathname === "/get_token") {//GET
    // get a new token or refresh the token
    let result = {
      "success": true,
      "data": {
        "token": new Date().getTime().toString()
      }
    };
    response.end(JSON.stringify(result));
  } else if (pathname === "/refresh_token" && request.method === 'POST') {//POST

    let refreshTokenInvalid = false;
    if (authorization) {
      let token_time = parseFloat(authorization);
      let cur_time = new Date().getTime();
      refreshTokenInvalid = cur_time - token_time > 60 * 1000;
    }

    let body = null;
    if (refreshTokenInvalid) {
      body = {
        "success": false,
        "msg": "refresh_token invalid",
        "data": null
      }
    } else {
      body = {
        "success": true,
        "msg": "refresh token success",
        "data": {
          "token": new Date().getTime().toString()
        }
      }
    }

    response.end(JSON.stringify(body));
  } else if (pathname === "/test_post" && request.method === 'POST') {

    if (isTokenExpired) {
      response.end(JSON.stringify({"success": false, "error_code": 1001, "msg": "token expired"}));
    } else {
      let body = {
        "success": true,
        "msg": "test post success",
        "data": null
      };

      response.end(JSON.stringify(body));
    }

  } else if (pathname === "/request") {//GET
    // Normal request
    if (isTokenExpired) {
      response.end(JSON.stringify({"success": false, "error_code": 1001, "msg": "token expired"}));
    } else {
      let result = {
        "success": true,
        "data": {
          "result": true
        }
      };
      response.end(JSON.stringify(result));
    }
  }

}).listen(8000);

console.log('Server running at http://127.0.0.1:8888/');