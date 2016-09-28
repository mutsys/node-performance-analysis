const newRelic = require("newrelic");
const gc = (require('gc-stats'))();

const nanosPerMicro = 1000;
const microsPerMilli = 1000;
const millisPerSecond = 1000;

const memorySampleInterval = 10 * millisPerSecond;
const cpuSampleIntervalMillis = 10 * millisPerSecond;
const cpuSampleIntervalMicros = cpuSampleIntervalMillis * microsPerMilli;

const bytesPerMByte = 1024 * 1024;

var lastCpuSample;

const gcType = {
  1: "Scavenge (minor GC)",
  2: "Mark/Sweep/Compact (major GC)",
  4: "Incremental marking",
  8: "Weak/Phantom callback processing",
  15: "All"
};

function toMBytes(bytes) {
  return Math.round(bytes / bytesPerMByte);
}

module.exports.init = function() {
  lastCpuSample = process.cpuUsage();
  setInterval(sampleMemory, memorySampleInterval);
  setInterval(sampleCpu, cpuSampleIntervalMillis);
  gc.on('stats', gcEvent);
}

function sampleMemory() {
  var memorySample = process.memoryUsage();
  var memoryInfo = {
    pid: process.pid,
    rss: memorySample.rss,
    heapTotal: memorySample.heapTotal,
    heapUsed: memorySample.heapUsed
  };
  newRelic.recordCustomEvent('NodeMemory', memoryInfo);
}

function sampleCpu() {
  var cpuSample = process.cpuUsage();
  var userPercent = ((cpuSample.user - lastCpuSample.user) / cpuSampleIntervalMicros) * 100;
  var cpuInfo = {
    pid: process.pid,
    userPercent: userPercent
  };
  newRelic.recordCustomEvent('NodeCPU', cpuInfo);
  lastCpuSample = cpuSample;
}

function gcEvent(gcStats) {
  var gcInfo = {
    pid: process.pid,
    timestamp: (Date.now() - gcStats.pauseMS),
    durationMicros: (gcStats.pause / nanosPerMicro),
    type: (gcType[gcStats.gctype]),
    totalHeapSize: toMBytes(gcStats.after.totalHeapSize),
    totalHeapExecutableSize: toMBytes(gcStats.after.totalHeapExecutableSize),
    usedHeapSize: toMBytes(gcStats.after.usedHeapSize),
    heapSizeLimit: toMBytes(gcStats.after.heapSizeLimit)
  };
  newRelic.recordMetric('Custom/GC/' + gcInfo.type, gcInfo.durationMicros);
  newRelic.recordCustomEvent('NodeGC', gcInfo);
}
