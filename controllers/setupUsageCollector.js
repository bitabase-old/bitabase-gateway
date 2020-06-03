const callarest = require('callarest');

function createUsageCollector () {
  const accumulator = new Map();

  function tick (databaseName, collectionName, eventType, increment = 1) {
    const eventPath = `${databaseName}:${collectionName}:${eventType}`;
    if (!accumulator.get(eventPath)) {
      accumulator.set(eventPath, increment);
    } else {
      const currentValue = accumulator.get(eventPath);
      accumulator.set(eventPath, currentValue + increment);
    }
  }

  function reset () {
    accumulator.clear();
  }

  return {
    accumulator,
    reset,
    tick
  };
}

function setupUsageCollector (config) {
  const usageCollector = createUsageCollector();

  function sendUsage (callback) {
    const accumlationData = Object.fromEntries(usageCollector.accumulator);
    usageCollector.reset();

    callarest({
      method: 'post',
      url: `${config.managerUrl}/v1/usage-batch`,
      data: JSON.stringify(accumlationData),
      headers: {
        'X-Internal-Secret': config.secret
      }
    }, function (error, result) {
      if (error) {
        console.log(error.message)
        return callback && callback(error);
      }

      callback && callback(null, result);
    });
  }

  const timer = setInterval(function () {
    sendUsage();
  }, 5000);

  function stop (callback) {
    clearInterval(timer);
    sendUsage(callback);
  }

  return {
    stop,
    usageCollector
  };
}

module.exports = setupUsageCollector;
