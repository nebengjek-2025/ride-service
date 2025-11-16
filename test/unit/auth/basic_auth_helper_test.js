const sinon = require('sinon');
const { expect } = require('chai');
const { UnauthorizedError } = require('all-in-one').Error;
const commonHelper = require('all-in-one');
const config = require('../../../src/infra');

const wrapper = commonHelper.Wrapper;
const { isAuthenticated } = require('../../../src/auth/basic_auth_helper');

describe('Authentication Middleware', () => {
  let req; let res; let next;

  beforeEach(() => {
    req = {
      headers: {
        authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ='
      }
    };
    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub()
    };
    next = sinon.stub();
  });

  it('should call next if token is valid', async () => {
    sinon.stub(config, 'get').returns({ username: 'username', password: 'password' });

    await isAuthenticated(req, res, next);

    expect(req.isAuthenticated).to.be.true;
    expect(next.calledOnce).to.be.true;

    config.get.restore();
  });

  it('should return UnauthorizedError if token is invalid', async () => {
    sinon.stub(wrapper, 'response');

    await isAuthenticated(req, res, next);

    expect(wrapper.response.calledOnce).to.be.true;
    expect(wrapper.response.calledWith(res, 'fail', sinon.match({ err: sinon.match.instanceOf(UnauthorizedError) }),
      'Token is not valid!', 401)).to.be.true;

    wrapper.response.restore();
  });

  it('should return UnauthorizedError if authorization header is missing', async () => {
    req.headers.authorization = undefined;

    sinon.stub(wrapper, 'response');

    await isAuthenticated(req, res, next);

    expect(wrapper.response.calledOnce).to.be.true;
    expect(wrapper.response.calledWith(res, 'fail', sinon.match({ err: sinon.match.instanceOf(UnauthorizedError) }),
      'Token is not valid!', 401)).to.be.true;

    wrapper.response.restore();
  });

});
