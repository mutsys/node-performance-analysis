
const http = require('http');
const concat = require('concat-stream');

const randomCacheKey = function() {
  return Math.round(Math.random() * 100000).toString();
};

const doRequest = function() {
  return new Promise((resolve,reject) => {
    http.get(
      {
        host: 'localhost',
        port: 8080,
        path: '/oap/foo'
      },
      (response) => response.pipe(concat((body) => resolve(body.toString())))
    )
  });
}

const cachedGarbage = {};

// var freeSomeGarbage = function() {
//   var keys = Object.keys(cachedGarbage);
//   for (var i = 0; i < 10; i++) {
//     var cacheKey = keys[i];
//     cachedGarbage[cacheKey] = undefined;
//   }
//   setTimeout(freeSomeGarbage, 1000);
// };
//
// setTimeout(freeSomeGarbage, 1000);

module.exports = {

  doSomething: function(options, done) {

    Promise.all([
      doRequest(),
      doRequest(),
      doRequest(),
      doRequest(),
      doRequest()
    ]).then(function(stuff) {
      var value = "";
      for (var item of stuff) {
        value += item;
      }
      for (var i = 0; i < 10; i++) {
        cachedGarbage[randomCacheKey()] = value;
      }
      done(value);
    });

  }

};
