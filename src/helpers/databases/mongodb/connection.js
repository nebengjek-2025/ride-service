const { MongoClient } = require('mongodb');
const commonHelper = require('all-in-one');

const wrapper = commonHelper.Wrapper;
const connectionPool = new Map();

/* istanbul ignore next */
const init = async (config) => {
  try {
    const poolKey = JSON.stringify(config);
    const mongoConnection = new MongoClient(config, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 50,
      minPoolSize: 1
    });
    await mongoConnection.connect();
    commonHelper.log(['INFO'],'mongodb connected');
    connectionPool.set(poolKey, mongoConnection);
  } catch (err) {
    commonHelper.log(['ERROR'], {message:'mongodb connection error', error:`${err}`});
  }
};

const getConnection = async (config) => {
  const poolKey = JSON.stringify(config);
  if (!connectionPool.has(poolKey)) {
    await init(config);
  }
  const mongoConnection = connectionPool.get(poolKey);
  return wrapper.data({ db: mongoConnection });
};

module.exports = {
  init,
  getConnection
};
