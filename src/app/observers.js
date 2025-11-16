const commonHelper = require('all-in-one');
const driverEventHandler = require('../modules/driver/handlers/event_handler');

const init = () => {
  commonHelper.log(['Info'], 'Observer is Running...');
  driverEventHandler.initConsumers();
};

module.exports = {
  init: init
};
