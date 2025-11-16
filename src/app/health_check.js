
const logger = require('all-in-one');

const mysqlConnectionPooling = require('../helpers/databases/mysql/connection');
const config = require('../infra');

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 seconds

let retries = 0;

const shutdown = async (server) => {
  server.close(() => {
    logger.log('Server closed. No longer accepting connections.');

    process.exit(0);
  });
};

const checkServiceHealth = async (server) => {
  try {
    const mysqlStatus = await mysqlConnectionPooling.checkConnectionStatus(config.get('/mysqlConfig'));

    if (mysqlStatus.connected) {
      if (retries > 0) {
        logger.log(['Connection'],'Database reconnected successfully after retry.');
      } else {
        logger.log(['INFO'],'Database connection healthy.');
      }
      retries = 0; // reset counter
    } else {
      logger.log(['Connection'],`Database unhealthy: ${mysqlStatus.message}`);
      await handleUnhealthyService(server);
    }
  } catch (error) {
    logger.log(['Connection'],`Error while checking DB health: ${error.message}`);
    await handleUnhealthyService(server);
  }
};

const handleUnhealthyService = async (server) => {
  if (retries < MAX_RETRIES) {
    retries++;
    logger.log(`Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
    await delay(RETRY_INTERVAL);
    checkServiceHealth(server);
  } else {
    logger.log('Service is consistently unhealthy. Restarting...');
    shutdown(server);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { checkServiceHealth,shutdown, delay };
