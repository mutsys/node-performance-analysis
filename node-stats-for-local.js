const gc = (require('gc-stats'))();
const http = require('http');
const Readable = require('stream').Readable;
const concat = require('concat-stream');

const nanosPerMicro = 1000;
const microsPerMilli = 1000;
const millisPerSecond = 1000;

const heapSampleIntervalMillis = 2 * millisPerSecond;
const cpuSampleIntervalMillis = 2 * millisPerSecond;
const loopSampleInteralMillis = 1 * millisPerSecond;
const cpuSampleIntervalMicros = cpuSampleIntervalMillis * microsPerMilli;

const bytesPerMByte = 1024 * 1024;

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

const streamOptions = {
  objectMode: true,
  highWaterMark: 128,
  read: () => {}
};

module.exports.init = function() {
  lastCpuSample = process.cpuUsage();
  setInterval(sampleHeap, heapSampleIntervalMillis);
  setInterval(sampleCpu, cpuSampleIntervalMillis);
  setInterval(sampleLoop, loopSampleInteralMillis);
  gc.on('stats', gcEvent);
}

function sampleHeap() {
  var heapSample = process.memoryUsage();
  var heapInfo = {
    timestamp: Date.now(),
    rss: heapSample.rss,
    totalHeap: heapSample.heapTotal,
    usedHeap: heapSample.heapUsed
  };
  heapStream.push(heapInfo);
}

var lastCpuSample;

function sampleCpu() {
  var cpuSample = process.cpuUsage();
  var userPercent = ((cpuSample.user - lastCpuSample.user) / cpuSampleIntervalMicros) * 100;
  var cpuInfo = {
    timestamp: Date.now(),
    userPercent: userPercent
  };
  cpuStream.push(cpuInfo);
  lastCpuSample = cpuSample;
}

function gcEvent(gcSample) {
  var gcInfo = {
    timestamp: (Date.now() - gcSample.pauseMS),
    durationMicros: (gcSample.pause / nanosPerMicro),
    gcType: (gcType[gcSample.gctype]),
    totalHeap: toMBytes(gcSample.after.totalHeapSize),
    usedHeap: toMBytes(gcSample.after.usedHeapSize)
  };
  gcStream.push(gcInfo);
}

function sampleLoop() {
  loopMeasurementStream.push(process.hrtime());
}

function loopEvent(loopMeasurement) {
  var loopLag = process.hrtime(loopMeasurement);
  var loopInfo = {
    lagMicros: (loopLag[1] / nanosPerMicro),
    timestamp: Date.now()
  };
  loopStream.push(loopInfo);
}

const cpuStream = new Readable(streamOptions);
cpuStream.on('data', (cpuSample) => sendStats('cpu', cpuSample));
cpuStream.on('error', (error) => console.log(error));

const heapStream = new Readable(streamOptions);
heapStream.on('data', (heapSample) => sendStats('heap', heapSample));
heapStream.on('error', (error) => console.log(error));

const gcStream = new Readable(streamOptions);
gcStream.on('data', (gcSample) => sendStats('gc', gcSample));
gcStream.on('error', (error) => console.log(error));

const loopMeasurementStream = new Readable(streamOptions);
loopMeasurementStream.on('data', (loopMeasurement) => loopEvent(loopMeasurement));
loopMeasurementStream.on('error', (error) => console.log(error));

const loopStream = new Readable(streamOptions);
loopStream.on('data', (loopSample) => sendStats('loop', loopSample));
loopStream.on('error', (error) => console.log(error));

function sendStats(sampleType, sample) {
  var sampleJson = JSON.stringify(sample);
  var post = http.request(
    {
      host: 'localhost',
      port: 8080,
      path: `/data/${sampleType}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(sampleJson)
      }
    },
    (response) => {
      if (response.statusCode !== 200) {
        console.log("error posting data sample");
        response.pipe(concat((body) => console.log(body.toString())))
      }
    }
  );
  post.on('error', (e) => {
    console.log(`could not post data sample: ${e.message}`)
  });
  post.write(sampleJson);
  post.end();
}
