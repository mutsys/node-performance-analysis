
var randomCacheKey = function() {
  return Math.round(Math.random() * 4000);
};

var delay = function() {
  return Math.round(Math.random() * 2000);
};

var makeGarbage = function(value) {
  var garbage = "";
  for (var i = 0; i < 10000; i++) {
    garbage += "foobar" + value + " ";
  }
  var cacheKey = randomCacheKey();
  cachedGarbage[cacheKey] = garbage;
  return garbage;
};

var cachedGarbage = {};

var freeSomeGarbage = function() {
  var keys = Object.keys(cachedGarbage);
  for (var i = 0; i < 10; i++) {
    var cacheKey = keys[i];
    cachedGarbage[cacheKey] = undefined;
  }
  setTimeout(freeSomeGarbage, 1000);
};

setTimeout(freeSomeGarbage, 1000);

module.exports = {

  doSomething: function(options, done) {

    var f1 = new Promise((resolve, reject) => setTimeout(resolve, delay(), makeGarbage("1")));
    var f2 = new Promise((resolve, reject) => setTimeout(resolve, delay(), makeGarbage("2")));
    var f3 = new Promise((resolve, reject) => setTimeout(resolve, delay(), makeGarbage("3")));
    var f4 = new Promise((resolve, reject) => setTimeout(resolve, delay(), makeGarbage("4")));
    var f5 = new Promise((resolve, reject) => setTimeout(resolve, delay(), makeGarbage("5")));

    Promise.all([
      new Promise((resolve, reject) => resolve(f1)),
      new Promise((resolve, reject) => resolve(f2)),
      new Promise((resolve, reject) => resolve(f3)),
      new Promise((resolve, reject) => resolve(f4)),
      new Promise((resolve, reject) => resolve(f5))
    ]).then(function(stuff) {
      var value = "";
      for (var item of stuff) {
        value += item;
      }
      done(value);
    });

  }

};
