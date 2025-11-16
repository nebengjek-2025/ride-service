
const User = require('./domain');
const Mysql = require('../../../../helpers/databases/mysql/db');
const config = require('../../../../infra');

const db = new Mysql(config.get('/mysqlConfig'));
const user = new User(db);

const getDriver = async (userId) => {
  const getData = (id) => user.viewUser(id);
  return getData(userId);
};

module.exports = {
  getDriver
};
