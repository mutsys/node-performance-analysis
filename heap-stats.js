
const fs = require('fs');
const v8 = require('v8');

var _datafile = null;
var _lastSnapShot = null;

module.exports.init = function(datafile) {
  _datafile =  datafile;
  recordHeapStats();

}

var bytesPerMB = 1024 * 1024;
var millisPerSecond = 1000;
var snapShotPeriod = 2 * millisPerSecond;

function reschedule() {

  setTimeout(recordHeapStats, _lastSnapShot + snapShotPeriod - Date.now());

}

function toMBytes(numBytes) {
  return Math.round(numBytes / bytesPerMB);
}

function recordHeapStats() {

  _lastSnapShot = Date.now();
  var heapStats = v8.getHeapStatistics();
  var memUsage = process.memoryUsage();

  var timestamp = Math.round(_lastSnapShot / millisPerSecond);
  var rss = toMBytes(memUsage.rss);
  var total_heap_size = toMBytes(heapStats.total_heap_size);
  var total_heap_size_executable = toMBytes(heapStats.total_heap_size_executable);
  var total_physical_size = toMBytes(heapStats.total_physical_size);
  var total_available_size = toMBytes(heapStats.total_available_size);
  var used_heap_size = toMBytes(heapStats.used_heap_size);
  var heap_size_limit = toMBytes(heapStats.heap_size_limit);

  fs.appendFile(_datafile, [ timestamp, rss, total_heap_size, total_heap_size_executable, total_physical_size, total_available_size, used_heap_size, heap_size_limit ].join(",") + "\n");

  reschedule();

}
