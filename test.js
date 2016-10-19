var http = require('http');

var doRequest = function() {
  return new Promise((resolve,reject) => {
    var message = "";
    http.get(
      {
        host: 'localhost',
        port: 8080,
        path: '/oap/foo'
      },
      function(response) {
        response.on('data', function(data) {
          message += data;
        });
        response.on('error', function(error) {
          console.log(error);
        });
        response.on('end', function() {
          resolve(message);
        });
    });
  }).then(function(stuff) {
    return stuff;
  });

}

Promise.all([
  new Promise((resolve, reject) => resolve(doRequest())),
  new Promise((resolve, reject) => resolve(doRequest())),
  new Promise((resolve, reject) => resolve(doRequest())),
  new Promise((resolve, reject) => resolve(doRequest())),
  new Promise((resolve, reject) => resolve(doRequest()))
]).then(function(stuff) {
  var value = "";
  for (var item of stuff) {
    value += item;
  }
  console.log(value);
});
