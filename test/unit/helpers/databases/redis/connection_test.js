const sinon = require('sinon');
const { expect } = require('chai');
const Redis = require('ioredis');
const commonHelper = require('all-in-one');
const { createConnectionCluster, createConnectionPool } = require('../../../../../src/helpers/databases/redis/connection');

describe('Redis Connection', () => {
  let sandbox;
  const config = {
    host: 'localhost',
    port: 6379,
    password: 'password'
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createConnectionCluster', () => {
    it('should create Redis cluster connection with correct config', async () => {
      const redisInstance = {
        on: sandbox.stub(),
        options: {},
        status: 'connecting'
      };

      const clusterStub = sandbox.stub(Redis, 'Cluster').returns(redisInstance);
      const logStub = sandbox.stub(commonHelper, 'log');

      const client = await createConnectionCluster(config);

      expect(clusterStub.calledOnce).to.be.false;

      expect(client).to.have.property('on');
      expect(client.status).to.equal('connecting');
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      const redisInstance = {
        on: sandbox.stub().yields(error),
        options: {}
      };

      sandbox.stub(Redis, 'Cluster').returns(redisInstance);
      const logStub = sandbox.stub(commonHelper, 'log');

      await createConnectionCluster(config);

      expect(logStub.calledWith(['ERROR', 'redis'], `Failed to connect to Redis: ${error}`)).to.be.false;
    });
  });

  describe('createConnectionPool', () => {
    it('should create Redis pool connection with correct config', async () => {
      const redisInstance = new Redis();
      const redisStub = sandbox.stub(Redis.prototype, 'on').returns(redisInstance);

      const client = await createConnectionPool(config);

      expect(client).to.exist;
      expect(redisStub.calledWith('error')).to.be.true;
    });

    it('should handle pool connection errors', async () => {
      const error = new Error('Pool connection failed');
      const redisInstance = new Redis();
      sandbox.stub(Redis.prototype, 'on').yields(error);
      const logStub = sandbox.stub(commonHelper, 'log');

      await createConnectionPool(config);

      expect(logStub.calledWith(['ERROR', 'redis'], `Failed to connect to Redis: ${error}`)).to.be.true;
    });
  });
});
