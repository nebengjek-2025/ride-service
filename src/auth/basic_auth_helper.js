
const commonHelper = require('all-in-one');

const wrapper = commonHelper.Wrapper;
const { UnauthorizedError } = commonHelper.Error;
const validate = require('validate.js');
const config = require('../infra');

const isAuthenticated = async (req, res, next) => {
  const result = { err: null, data: null };
  const authHeader = req.headers.authorization;
  if (validate.isEmpty(authHeader) || !authHeader.startsWith('Basic ')) {
    result.err = new UnauthorizedError('Token is not valid');
    return wrapper.response(res, 'fail', result, 'Token is not valid!', 401);
  }
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  const userDatas = config.get('/basicAuthApi');
  if ((userDatas.username !== username) || (userDatas.password !== password)) {
    result.err = new UnauthorizedError('Token is not valid');
    return wrapper.response(res, 'fail', result, 'Token is not valid!', 401);
  }
  req.isAuthenticated = true;
  next();
};

module.exports = {
  isAuthenticated
};
