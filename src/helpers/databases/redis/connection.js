const commonHelper = require('all-in-one');
const Redis = require('ioredis');
let redisClient;

const createConnectionCluster = async (config) => {
  const nodes = [{
    host: config.host,
    port: config.port
  }];
  redisClient = new Redis.Cluster(nodes,{
    redisOptions: {
      password: config.password,
      showFriendlyErrorStack: true,
      reconnectOnError: function(err) {
        /* istanbul ignore next */
        return err.message.includes('READONLY');
      },
    },
    enableOfflineQueue: true,
    enableReadyCheck: true,
    slotsRefreshTimeout: 1000,
  });

  redisClient.on('error', (err) => {
    /* istanbul ignore next */
    commonHelper.log(['ERROR','redis'], `Failed to connect to Redis: ${err}`);
  });
  return redisClient;
};


const createConnectionPool = async (config) => {
  redisClient = new Redis({
    host: config.host,
    port: config.port,
    // password: config.password,
    showFriendlyErrorStack: true,
    reconnectOnError: function(err) {
      return err.message.includes('READONLY');
    },
    enableOfflineQueue: true,
    enableReadyCheck: true,
    slotsRefreshTimeout: 1000,
    // tls: {
    //   rejectUnauthorized: true
    // },
  });
  redisClient.on('connect', () => {
    commonHelper.log(['redis'],'Connected to Redis Pool');
  });

  redisClient.on('error', (err) => {
    commonHelper.log(['ERROR','redis'], `Failed to connect to Redis: ${err}`);
  });
  return redisClient;
};

const getConnection = async (config) => {
  if (!redisClient || redisClient.status === 'end') {
    /* istanbul ignore next */
    redisClient = await createConnectionPool(config);
  }
  return redisClient;
};

module.exports = {
  createConnectionPool,
  createConnectionCluster,
  getConnection
};

