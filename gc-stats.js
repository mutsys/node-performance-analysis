
const fs = require('fs');
const gc = (require('gc-stats'))();

const nanosPerMicro = 1000;
const microsPerMilli = 1000;
const bytesPerMByte = 1024 * 1024;

const gcType = {
  1: 'minor',
  2: 'major',
  4: 'incremental',
  8: 'callback processing',
  15: 'all'
};

function toMBytes(bytes) {
  return Math.round(bytes / bytesPerMByte);
}

var _datafile = null;

module.exports.init = function(datafile) {
  _datafile = datafile;
  gc.on('stats', gcEvent);
}

function gcEvent(gcStats) {
  var timestamp = Date.now() - gcStats.pauseMS;
  var type = gcType[gcStats.gctype];
  var durationMicros = gcStats.pause / nanosPerMicro;
  var diffUsedHeapSize = toMBytes(gcStats.diff.usedHeapSize);

  fs.appendFile(_datafile, [ timestamp, type, durationMicros, diffUsedHeapSize ].join(",") + "\n");

}
