
const http = require('http');
const concat = require('concat-stream');

const randomCacheKey = function() {
  return Math.round(Math.random() * 100000).toString();
};

const randomDelay = function() {
  return 1500 + Math.round(Math.random() * 2500);
}

const randomChars = function* (count) {
  while (count > 0) {
    count--;
    yield String.fromCharCode(32  + Math.random(Math.random() * (127 - 32)));
  }
}

const randomJunk = function() {
  const size = 1024 * (1.0 + Math.random() * 9.0);
  const junk = Buffer.alloc(size);
  for (let character of randomChars(size)) {
    junk.write(character, junk.length, 1);
  }
}

const doRequest = function() {
  return new Promise((resolve,reject) => {
    setTimeout(() => resolve(randomJunk()), randomDelay());
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
      for (let item of stuff) {
        value += item;
      }
      for (let i = 0; i < 10; i++) {
        cachedGarbage[randomCacheKey()] = value;
      }
      done(value);
    });

  }

};
