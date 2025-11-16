const sinon = require('sinon');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const commonHelper = require('all-in-one');

const { ForbiddenError } = commonHelper.Error;
const wrapper = commonHelper.Wrapper;
const { generateToken, authSocket } = require('../../../src/auth/jwt_auth_helper');

describe('Token Helper', () => {

  let next;
  let socket;

  beforeEach(() => {
    socket = {
      handshake: {
        auth: {},
        query: {
          token:''
        }
      },
      emit: sinon.stub(),
      disconnect: sinon.stub()
    };
    let req = {
      headers: {}
    };
    let res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub()
    };
    next = sinon.stub();
  });
  afterEach(() => {
    sinon.restore();
  });

  describe('generateToken', () => {
    it('should generate a token with the given payload', async () => {
      const payload = { user: 'user123' };
      const signStub = sinon.stub(jwt, 'sign').resolves('generatedToken');

      const token = await generateToken(payload);

      expect(token).to.equal('generatedToken');
      expect(signStub.calledOnceWithExactly(payload, sinon.match.string, sinon.match.object)).to.be.true;

      signStub.restore();
    });
  });

  describe('authSocket', () => {
    it('should authenticate socket with valid token', async () => {
      const validToken = 'Bearer validToken';
      const decodedToken = { sub: 'user123',metadata: {mobileNumber:'+6281234567', mitra: true, _id: '12345'} };
      socket.handshake.auth.token = validToken;

      const verifyStub = sinon.stub(jwt, 'verify').returns(decodedToken);

      await authSocket(socket, next);

      expect(socket.userId).to.equal(decodedToken.sub);
      expect(verifyStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
    });

    it('should handle expired token', async () => {
      socket.handshake.auth.token = 'Bearer expiredToken';
      const error = new jwt.TokenExpiredError('Token expired');

      sinon.stub(jwt, 'verify').throws(error);

      await authSocket(socket, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.equal('Authentication error: Invalid token');
    });

    it('should handle missing token', async () => {
      socket.handshake.auth.token = '';
      await authSocket(socket, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.equal('Authentication error: Token is required');
    });

    it('should handle invalid token', async () => {
      socket.handshake.auth.token = 'InvalidToken';
      const error = new jwt.JsonWebTokenError('Invalid token');

      sinon.stub(jwt, 'verify').throws(error);

      await authSocket(socket, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.equal('Authentication error: Invalid token');
    });

    it('should handle malformed token format', async () => {
      socket.handshake.auth.token = 'InvalidTokenFormat';

      await authSocket(socket, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.equal('Authentication error: Invalid token');
    });
  });
});
