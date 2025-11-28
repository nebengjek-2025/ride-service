
const Driver = require('./domain');
const Mysql = require('../../../../helpers/databases/mysql/db');
const config = require('../../../../infra');

const db = new Mysql(config.get('/mysqlConfig'));
const driver = new Driver(db);

const locationUpdate = async (data) => {
  const getData = async () => {
    const result = await driver.locationUpdate(data);
    return result;
  };
  const result = await getData();
  return result;
};

const activateBeacon = async (payload) => {
  const postData = async (data) => {
    const result = await driver.activateBeacon(data);
    return result;
  };
  const result = await postData(payload);
  return result;
};

const broadcastPickupPassanger = async (data) => {
  const postData = async (pyld) => {
    const result = await driver.broadcastPickupPassanger(pyld);
    return result;
  };
  const result = await postData(data);
  return result;
};

const tripTracker = async (data) => {
  const postData = async (pyld) => {
    const result = await driver.tripTracker(pyld);
    return result;
  };
  const result = await postData(data);
  return result;
};

const requestPickup = async (data) => {
  const postData = async (pyld) => {
    const result = await driver.requestPickup(pyld);
    return result;
  };
  const result = await postData(data);
  return result;
};

module.exports = {
  locationUpdate,
  broadcastPickupPassanger,
  tripTracker,
  activateBeacon,
  requestPickup
};
