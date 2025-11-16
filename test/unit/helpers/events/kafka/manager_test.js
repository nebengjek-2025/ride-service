const sinon = require('sinon');
const { expect } = require('chai');
const Consumer = require('../../../../../src/helpers/events/kafka/consumer');
const ConsumerManager = require('../../../../../src/helpers/events/kafka/manager');


describe('ConsumerManager', () => {
  let sandbox;
  let consumerStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    consumerStub = {
      connect: sandbox.stub()
    };
    sandbox.stub(Consumer.prototype, 'constructor').returns(consumerStub);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getInstance', () => {
    it('should create a new consumer instance if it does not exist', () => {
      const groupId = 'testGroup';
      ConsumerManager.instances = {}; // Reset instances

      const instance = ConsumerManager.getInstance(groupId);

      expect(instance).to.not.equal(consumerStub);
      expect(ConsumerManager.instances[groupId]).to.not.equal(consumerStub);
      expect(consumerStub.connect.calledOnce).to.be.false;
    });

    it('should return the existing consumer instance if it already exists', () => {
      const groupId = 'testGroup';
      ConsumerManager.instances[groupId] = consumerStub;

      const instance = ConsumerManager.getInstance(groupId);

      expect(instance).to.equal(consumerStub);
      expect(consumerStub.connect.called).to.be.false;
    });
  });
});
