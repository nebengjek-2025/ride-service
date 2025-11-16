const commonHelper = require('all-in-one');
const wrapper = commonHelper.Wrapper;
const pool = require('./connection');

class DB {
  constructor(config) {
    this.config = config;
  }

  errorMessage(code) {
    switch(code) {
    case 'PROTOCOL_CONNECTION_LOST':
      return 'Database connection was closed.';
    case 'ER_CON_COUNT_ERROR':
      return 'Database has too many connections.';
    case 'ECONNREFUSED':
      return 'Database connection was refused.';
    }
  }

  async query(statement) {
    let db = await pool.getConnection(this.config);
    if(!db){
      db = await pool.createConnectionPool(this.config);
    }
    const recordset = () => {
      return new Promise((resolve, reject) => {
        db.getConnection((error, connection) => {
          if (error) {
            connection.release();
            return reject(wrapper.error(this.errorMessage(error.code)));
          }
          connection.query(statement, (err, res) => {
            if (err) {
              connection.release();
              return reject(wrapper.error(err.message));
            }
            connection.release();
            return resolve(wrapper.data(res));
          });
        });
      });
    };
    return recordset().then(res => {
      return res;
    }).catch(err => {
      return err;
    });
  }

  async preparedQuery(statement, parameter) {
    let db = await pool.getConnection(this.config);
    if(!db){
      db = await pool.createConnectionPool(this.config);
    }
    const recordset = () => {
      return new Promise((resolve, reject) => {
        db.getConnection((error, connection) => {
          if (error) {
            connection.release();
            return reject(wrapper.error(this.errorMessage(error.code)));
          }
          connection.query(statement, parameter, (err, res) => {
            if (err) {
              connection.release();
              return reject(wrapper.error(err.message));
            }
            connection.release();
            return resolve(wrapper.data(res));
          });
        });
      });
    };
    return recordset().then(res => {
      return res;
    }).catch(err => {
      return err;
    });
  }

}

module.exports = DB;
