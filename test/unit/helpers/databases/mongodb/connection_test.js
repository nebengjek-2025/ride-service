
const { MongoClient } = require('mongodb');
const sinon = require('sinon');
const commonHelper = require('all-in-one');
const { expect } = require('chai');
const {init, getConnection} = require('../../../../../src/helpers/databases/mongodb/connection');
const config = require('../../../../../src/infra');

describe('Mongo Connection', () => {
  const mongoDbUrl = 'mongodb://localhost:27017/domain';

  afterEach(() => {
    sinon.restore();
  });

  it('should fail connection', () => {
    sinon.stub(config, 'get').returns(mongoDbUrl);
    const client = new MongoClient(mongoDbUrl);
    const mongoStub = sinon.stub(client, 'connect').resolves();
    init();
    config.get.restore();
    mongoStub.restore();
  });


  it('should log error on connection failure', async () => {
    const error = new Error('Connection failed');
    const mongoStub = sinon.stub(MongoClient.prototype, 'connect').rejects(error);
    const logStub = sinon.stub(commonHelper, 'log');

    try {
      await getConnection(config);
    } catch (err) {
      expect(mongoStub.calledOnce).to.be.true;
      expect(logStub.calledWith(['ERROR'], { message: 'mongodb connection error', error: `${error}` })).to.be.true;
    }
  });
});
