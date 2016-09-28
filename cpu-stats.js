
const fs = require('fs');

var _datafile = null;
var _lastSnapShot = null;
var _cpuUsage = null;

module.exports.init = function(datafile) {
  _datafile =  datafile;
  _cpuUsage = process.cpuUsage();
  recordCpuStats();

}

var millisPerSecond = 1000;
var microsPerMilli = 1000;
var snapShotPeriod = 2 * millisPerSecond;

function reschedule() {

  setTimeout(recordCpuStats, _lastSnapShot + snapShotPeriod - Date.now());

}

function toMillis(micros) {
  return Math.round(micros / microsPerMilli);
}

function recordCpuStats() {

  _lastSnapShot = Date.now();
  _cpuUsage = process.cpuUsage(_cpuUsage);

  var timestamp = Math.round(_lastSnapShot / millisPerSecond);
  var userTime = toMillis(_cpuUsage.user);
  var systemTime = toMillis(_cpuUsage.system);

  fs.appendFile(_datafile, [ timestamp, userTime, systemTime ].join(",") + "\n");

  reschedule();

}
