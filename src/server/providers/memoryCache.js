const cache = require('memory-cache');

module.exports = ({

  get: key => cache.get(key),

  // @NOTE Cache results for 5 minutes
  set: (key, value) => cache.put(key, value, 300000),

});
