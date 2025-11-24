const commonHelper = require('all-in-one');
const pool = require('./connection');
const validate = require('validate.js');
const wrapper = commonHelper.Wrapper;

class Redis {

  constructor(config) {
    this.config = config.connection;
  }

  async setData(key, value) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const convertToString = JSON.stringify({
      data: value,
    });
    const clientRedis = client;
    clientRedis.on('error', (err) => {
      return wrapper.error(`Failed to set data on Redis: ${err}`);
    });
    clientRedis.set(key, convertToString);
  }

  async setDataEx(key, value, duration) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const convertToString = JSON.stringify({
      data: value,
    });
    const clientRedis = client;
    clientRedis.on('error', (err) => {
      return wrapper.error(`Failed to set data on Redis: ${err}`);
    });

    clientRedis.set(key, convertToString, 'EX', duration);
  }

  async getData(key) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.error(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.get(key, (err, replies) => {
        if (err) {
          reject(wrapper.error(err));
        }
        resolve(wrapper.data(replies));
      });
    });
  }

  async hincrbyfloat(hash, field, increment) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.error(`Failed to increment float value in Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.hincrbyfloat(hash, field, increment, (err, res) => {
        if (err) {
          reject(wrapper.error(err));
        }
        resolve(wrapper.data(res));
      });
    });
  }


  async addDriverLocation(driverId, lat, lon) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.error(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.geoadd('drivers-locations', lon, lat, driverId, (err, res) => {
        if (err) {
          reject(wrapper.error(err, '', 404));
        }
        resolve(wrapper.data(res)); // Return success
      });
    });
  }

  async getNearbyDrivers(lon, lat, radiusInKm) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.error(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.georadius('drivers-locations', `${lon}`, `${lat}`, radiusInKm, 'km', (err, res) => {
        if (err) {
          reject(wrapper.error(err, '', 404));
        }
        resolve(wrapper.data(res));
      });
    });
  }

  async getAllKeys(keyPattern) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.error(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.keys(keyPattern, (err, replies) => {
        if (err) {
          reject(wrapper.error(err));
        }
        resolve(wrapper.data(replies));
      });
    });
  }

  async deleteKey(key) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.error(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.del(key, (err, replies) => {
        if (err) {
          reject(wrapper.error(err));
        }
        resolve(wrapper.data(replies));
      });
    });
  }

  async setZeroAttemp(key, duration) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.error(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.set(key, '0', 'EX', duration, (err, replies) => {
        if (err) {
          reject(wrapper.error(err));
        }
        resolve(wrapper.data(replies));
      });
    });
  }

  async publisher(key, value, timestamp) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const message = JSON.stringify({ value, timestamp });
    const clientRedis = client;
    clientRedis.on('error', (err) => {
      return wrapper.error(`Failed to set data on Redis: ${err}`);
    });

    clientRedis.publish(key, message);
  }

  async incrAttempt(key) {
    let client = await pool.getConnection(this.config);
    if (validate.isEmpty(client)) {
      client = await pool.createConnectionPool(this.config);
    }
    const clientRedis = client;

    clientRedis.on('error', (err) => {
      return wrapper.error(`Failed Get data From Redis: ${err}`);
    });
    return new Promise((resolve, reject) => {
      clientRedis.incr(key, (err, replies) => {
        if (err) {
          reject(wrapper.error(err));
        }
        resolve(wrapper.data(replies));
      });
    });
  }

}


module.exports = Redis;
