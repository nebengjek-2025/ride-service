const mysql = require('mysql2');

const connectionPool = [];

const createConnectionPool = async (config) => {
  const currConnection = connectionPool.findIndex(conf => conf.config.toString() === config.toString());
  let db;
  if(currConnection === -1){
    db = await mysql.createPool(config);
    connectionPool.push({
      config,
      connection: db
    });
  }
  return db;
};

const getConnection = async (config) => {
  const currConnection = connectionPool.filter(conf => conf.config.toString() === config.toString());
  let conn;
  currConnection.map((obj,i) => {
    if(i === 0){
      const { connection } = obj;
      conn = connection;
    }
  });
  return conn;
};

const checkConnectionStatus = async (config) => {
  try {
    let db = await getConnection(config);
    if (!db) {
      db = await createConnectionPool(config);
    }
    if (!db) {
      return { connected: false, message: 'No connection pool found' };
    }

    await db.promise().query('SELECT 1');
    return { connected: true, message: 'Connection OK' };
  } catch (error) {
    return { connected: false, message: error.message };
  }
};

module.exports = {
  createConnectionPool,
  getConnection,
  checkConnectionStatus
};
