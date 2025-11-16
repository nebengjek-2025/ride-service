const sinon = require('sinon');
const assert = require('assert');

const commonHelper = require('all-in-one');
const Mongo = require('../../../../../src/helpers/databases/mongodb/db');
const mongoConnection = require('../../../../../src/helpers/databases/mongodb/connection');

describe('Mongodb', () => {
  let stubMongoConn; let stubGetDatabase;
  beforeEach(async () => {
    stubGetDatabase = sinon.stub(Mongo.prototype, 'getDatabase');
    stubGetDatabase.resolves('test');
    stubMongoConn = sinon.stub(mongoConnection, 'getConnection');
    stubMongoConn.resolves({
      err: null,
      data: {
        db: {
          db: () => {
            return 'test';
          }
        }
      }
    });
    sinon.stub(commonHelper, 'log');
  });
  afterEach(() => {
    stubMongoConn.restore();
    stubGetDatabase.restore();
    commonHelper.log.restore();
  });

  describe('class', () => {
    it('should cover class', () => {
      Mongo.prototype.getDatabase.restore();
      const mongo = new Mongo('mongodb://localhost:27017/test');
      // mongo.setCollection('tes');
      mongo.getDatabase();
    });
  });

  describe('findOne', () => {
    it('should return wrapper error when db function is error', async () => {
      stubGetDatabase.rejects(new Error('Error Db function'));
      const res = await Mongo.prototype.findOne({}, {}, 'test');
      assert.notEqual(res.err, null);
      stubGetDatabase.restore();
    });
    it('should return wrapper data when findOne not success', async () => {
      stubGetDatabase.returns({
        findOne: sinon.stub().callsFake(() => {
          return Promise.resolve({});
        })
      });
      const res = await Mongo.prototype.findOne({}, {}, 'test');
      assert.notEqual(res.err, true);
      stubGetDatabase.restore();
    });
    it('should return wrapper data when findOne success', async () => {
      stubGetDatabase.returns({
        findOne: sinon.stub().callsFake(() => {
          return Promise.resolve({ 'ok': true });
        })
      });
      const res = await Mongo.prototype.findOne({}, {}, 'test');
      assert.equal(res.data.ok, true);
      stubGetDatabase.restore();
    });
  });

  describe('insertOne', () => {
    it('should return wrapper error when db function is error', async () => {
      stubGetDatabase.rejects(new Error('Error Db function'));
      const res = await Mongo.prototype.insertOne({});
      assert.notEqual(res.err, null);
      stubGetDatabase.restore();
    });
    it('should return wrapper data when insertOne success', async () => {
      stubGetDatabase.returns({
        insertOne: sinon.stub().callsFake(() => {
          return Promise.resolve({ result: {
            acknowledged : true
          }});
        })
      });
      const res = await Mongo.prototype.insertOne({});
      assert.notEqual(res.data, null);
      stubGetDatabase.restore();
    });
  });

  describe('updateOne', () => {
    it('should return wrapper error when db function is error', async () => {
      stubGetDatabase.rejects(new Error('Error Db function'));
      const res = await Mongo.prototype.updateOne({});
      assert.notEqual(res.err, null);
      stubGetDatabase.restore();
    });
    it('should return wrapper data when updateOne success', async () => {
      stubGetDatabase.returns({
        updateOne: sinon.stub().callsFake(() => {
          return Promise.resolve({ result: {
            acknowledged : true
          }});
        })
      });
      const res = await Mongo.prototype.updateOne({});
      assert.notEqual(res.data, null);
      stubGetDatabase.restore();
    });
  });

  describe('countData', () => {
    it('should return wrapper error when db function is error', async () => {
      stubGetDatabase.rejects(new Error('Error Db function'));
      const res = await Mongo.prototype.countData({});
      assert.notEqual(res.err, null);
      stubGetDatabase.restore();
    });
    it('should return wrapper data when countData success', async () => {
      stubGetDatabase.returns({
        countDocuments: sinon.stub().callsFake(() => {
          return Promise.resolve({ data : 'data'});
        })
      });
      const res = await Mongo.prototype.countData({});
      assert.equal(res.data.data, 'data');
      stubGetDatabase.restore();
    });
  });

  describe('findMany', () => {
    it('should return wrapper error when db function is error', async () => {
      stubGetDatabase.rejects(new Error('Error Db function'));
      const res = await Mongo.prototype.findMany({});
      assert.notEqual(res.err, null);
      stubGetDatabase.restore();
    });
    it('should return wrapper data when findMany not success', async () => {
      class MockCursor {
        skip() { return this; }

        limit() { return this; }

        sort() { return this; }

        toArray() { return this; }
      }
      stubGetDatabase.returns({
        find: sinon.stub().callsFake(() => {
          return new MockCursor();
        })
      });
      const res = await Mongo.prototype.findMany({});
      assert.equal(res.err, null);
      stubGetDatabase.restore();
    });
    it('should return wrapper data when findMany success', async () => {
      class MockCursor {
        skip() { return this; }

        limit() { return this; }

        sort() { return this; }

        toArray() { return this; }
      }
      stubGetDatabase.returns({
        find: sinon.stub().callsFake(() => {
          return new MockCursor();
        })
      });
      const res = await Mongo.prototype.findMany({});
      assert.equal(res.err, null);
      stubGetDatabase.restore();
    });
  });
});
