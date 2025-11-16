const sinon = require('sinon');
const { expect } = require('chai');
const commonHelper = require('all-in-one');
const pool = require('../../../../../src/helpers/databases/redis/connection');
const Redis = require('../../../../../src/helpers/databases/redis/redis');

// src/helpers/databases/redis/redis.test.js
describe('Redis', () => {
  let sandbox;
  let redisInstance;
  let redis;

  const config = {
    host: 'localhost',
    port: 6379,
    password: 'password'
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    redis = new Redis({connection: config});
    redisInstance = {
      on: sandbox.stub(),
      set: sandbox.stub(),
      get: sandbox.stub(),
      hincrbyfloat: sandbox.stub(),
      geoadd: sandbox.stub(),
      georadius: sandbox.stub(),
      keys: sandbox.stub(),
      del: sandbox.stub(),
      publish: sandbox.stub(),
      incr: sandbox.stub(),
      multi: sandbox.stub().returnsThis(),
      exec: sandbox.stub()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('setData', () => {
    it('should set data successfully', async () => {
      sandbox.stub(pool, 'getConnection').resolves(redisInstance);

      await redis.setData('testKey', 'testValue');

      expect(redisInstance.set.calledOnce).to.be.true;
      expect(redisInstance.set.calledWith('testKey', JSON.stringify({ data: 'testValue' }))).to.be.true;
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      redisInstance.on.yields(error);
      sandbox.stub(pool, 'getConnection').resolves(redisInstance);
      const errorStub = sandbox.stub(commonHelper.Wrapper, 'error');

      await redis.setData('testKey', 'testValue');

      expect(errorStub.calledWith(`Failed to set data on Redis: ${error}`)).to.be.true;
    });

    it('should create new connection if none exists', async () => {
      sandbox.stub(pool, 'getConnection').resolves(null);
      sandbox.stub(pool, 'createConnectionPool').resolves(redisInstance);

      await redis.setData('testKey', 'testValue');

      expect(pool.createConnectionPool.calledOnce).to.be.true;
      expect(redisInstance.set.calledOnce).to.be.true;
      expect(redisInstance.set.calledWith('testKey', JSON.stringify({ data: 'testValue' }))).to.be.true;
    });
  });

  describe('setDataEx', () => {
    it('should set data with expiration successfully', async () => {
      sandbox.stub(pool, 'getConnection').resolves(redisInstance);

      await redis.setDataEx('testKey', 'testValue', 60);

      expect(redisInstance.set.calledOnce).to.be.true;
      expect(redisInstance.set.calledWith('testKey', JSON.stringify({ data: 'testValue' }), 'EX', 60)).to.be.true;
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      redisInstance.on.yields(error);
      sandbox.stub(pool, 'getConnection').resolves(redisInstance);
      const errorStub = sandbox.stub(commonHelper.Wrapper, 'error');

      await redis.setDataEx('testKey', 'testValue', 60);

      expect(errorStub.calledWith(`Failed to set data on Redis: ${error}`)).to.be.true;
    });

    it('should create new connection if none exists', async () => {
      sandbox.stub(pool, 'getConnection').resolves(null);
      sandbox.stub(pool, 'createConnectionPool').resolves(redisInstance);

      await redis.setDataEx('testKey', 'testValue', 60);

      expect(pool.createConnectionPool.calledOnce).to.be.true;
      expect(redisInstance.set.calledOnce).to.be.true;
      expect(redisInstance.set.calledWith('testKey', JSON.stringify({ data: 'testValue' }), 'EX', 60)).to.be.true;
    });
  });

  describe('getData', () => {
    it('should get data successfully', async () => {
      sandbox.stub(pool, 'getConnection').resolves(redisInstance);
      redisInstance.get.yields(null, JSON.stringify({ data: 'testValue' }));

      const result = await redis.getData('testKey');

      expect(redisInstance.get.calledOnce).to.be.true;
      expect(result.data).to.deep.equal(JSON.stringify({ data: 'testValue' }));
    });

    it('should create new connection if none exists', async () => {
      sandbox.stub(pool, 'getConnection').resolves(null);
      sandbox.stub(pool, 'createConnectionPool').resolves(redisInstance);
      redisInstance.get.yields(null, JSON.stringify({ data: 'testValue' }));

      const result = await redis.getData('testKey');

      expect(pool.createConnectionPool.calledOnce).to.be.true;
      expect(redisInstance.get.calledOnce).to.be.true;
      expect(result.data).equal(JSON.stringify({ data: 'testValue' }));
    });
  });

  it('should increment float value successfully', async () => {
    sandbox.stub(pool, 'getConnection').resolves(redisInstance);
    redisInstance.hincrbyfloat.yields(null, 1.5);

    const result = await redis.hincrbyfloat('testHash', 'testField', 0.5);

    expect(redisInstance.hincrbyfloat.calledOnce).to.be.true;
    expect(result).to.deep.equal({ data: 1.5, err: null });
  });

  it('should add driver location successfully', async () => {
    sandbox.stub(pool, 'getConnection').resolves(redisInstance);
    redisInstance.geoadd.yields(null, 1);

    const result = await redis.addDriverLocation('driver1', 40.7128, -74.0060);

    expect(redisInstance.geoadd.calledOnce).to.be.true;
    expect(result).to.deep.equal({ data: 1, err: null });
  });

  it('should get nearby drivers successfully', async () => {
    sandbox.stub(pool, 'getConnection').resolves(redisInstance);
    redisInstance.georadius.yields(null, ['driver1', 'driver2']);

    const result = await redis.getNearbyDrivers(40.7128, -74.0060, 10);

    expect(redisInstance.georadius.calledOnce).to.be.true;
    expect(result).to.deep.equal({ data: ['driver1', 'driver2'], err:null });
  });

  it('should get all keys successfully', async () => {
    sandbox.stub(pool, 'getConnection').resolves(redisInstance);
    redisInstance.keys.yields(null, ['key1', 'key2']);

    const result = await redis.getAllKeys('test*');

    expect(redisInstance.keys.calledOnce).to.be.true;
    expect(result).to.deep.equal({ data: ['key1', 'key2'], err:null });
  });

  it('should delete key successfully', async () => {
    sandbox.stub(pool, 'getConnection').resolves(redisInstance);
    redisInstance.del.yields(null, 1);

    const result = await redis.deleteKey('testKey');

    expect(redisInstance.del.calledOnce).to.be.true;
    expect(result).to.deep.equal({ data: 1, err:null });
  });

  it('should set zero attempt successfully', async () => {
    sandbox.stub(pool, 'getConnection').resolves(redisInstance);
    redisInstance.set.yields(null, 'OK');

    const result = await redis.setZeroAttemp('testKey', 60);

    expect(redisInstance.set.calledOnce).to.be.true;
    expect(result).to.deep.equal({ data: 'OK',err:null });
  });

  it('should publish message successfully', async () => {
    sandbox.stub(pool, 'getConnection').resolves(redisInstance);

    await redis.publisher('testChannel', 'testMessage', Date.now());

    expect(redisInstance.publish.calledOnce).to.be.true;
  });

  it('should increment attempt successfully', async () => {
    sandbox.stub(pool, 'getConnection').resolves(redisInstance);
    redisInstance.incr.yields(null, 1);

    const result = await redis.incrAttempt('testKey');

    expect(redisInstance.incr.calledOnce).to.be.true;
    expect(result).to.deep.equal({ data: 1, err:null });
  });

});
