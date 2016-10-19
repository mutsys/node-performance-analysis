/**
 * app.js
 *
 * Use `app.js` to run your app without `sails lift`.
 * To start the server, run: `node app.js`.
 *
 * This is handy in situations where the sails CLI is not relevant or useful.
 *
 * For example:
 *   => `node app.js`
 *   => `forever start app.js`
 *   => `node debug app.js`
 *   => `modulus deploy`
 *   => `heroku scale`
 *
 *
 * The same command-line arguments are supported, e.g.:
 * `node app.js --silent --port=80 --prod`
 */

//
// this one sends data to new relic
//
// require('./node-stats-for-newrelic').init();
//
// these capture data locally to csv files
//
// require('./heap-stats').init('heap-stat-data.csv');
// require('./cpu-stats').init('cpu-stat-data.csv');
// require('./gc-stats').init('gc-stat-data.csv');
//
// this one sends data to a local graphing server
//
//require('./node-stats-for-local').init();

// Ensure we're in the project directory, so relative paths work as expected
// no matter where we actually lift from.

var cluster = require('cluster');

var numCPUs = require('os').cpus().length;

process.chdir(__dirname);

if (cluster.isMaster) {

  function handleWorkerMessage(msg) {
    if (msg.type) {
      if (msg.type === 'startup') {
        console.log('worker %d starting sails', msg.pid);
      }
    }
  }

  for (var i = 0; i < numCPUs; i++) {
    cluster.fork().on('message', handleWorkerMessage);
  }

  cluster.on('online', function(worker) {
    console.log('new worker %d running', worker.process.pid);
  });
  cluster.on('listening', function(worker, address) {
    console.log("worker %d is listening on port %d", worker.process.pid, address.port);
  });
  cluster.on('exit', function(worker, code, signal) {
    console.log('worker %d died (%s). restarting...', worker.process.pid, signal || code);
    cluster.fork().on('message', handleWorkerMessage);
  });

  console.log('sails master/worker cluster up and running');

} else {

  var sails = require('sails');
  var rc = require('rc');

  process.send({type: 'startup', pid: process.pid});

  sails.lift(rc('sails'));

}
