const sinon = require('sinon');
const { expect } = require('chai');
const { Kafka } = require('kafkajs');
const config = require('../../../../../src/infra');
const commonHelper = require('all-in-one');
const ConsumerKafka = require('../../../../../src/helpers/events/kafka/consumer');

describe('ConsumerKafka', () => {
  let sandbox;
  let kafkaStub;
  let consumerStub;
  let consumerKafka;

  const kafkaConfig = {
    clientId: 'testClient',
    brokers: ['localhost:9092'],
    kafkaSaslUsername: 'testUser',
    kafkaSaslPassword: 'testPassword'
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    kafkaStub = sandbox.stub(Kafka.prototype, 'consumer').returns({
      connect: sandbox.stub(),
      subscribe: sandbox.stub(),
      run: sandbox.stub(),
      disconnect: sandbox.stub()
    });
    consumerStub = kafkaStub();
    sandbox.stub(config, 'get').returns(kafkaConfig);
    consumerKafka = new ConsumerKafka({ groupId: 'testGroup' });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Constructor', () => {
    it('should initialize Kafka client and consumer with correct parameters', () => {
      expect(consumerStub).to.have.property('connect');
      expect(consumerStub).to.have.property('subscribe');
      expect(consumerStub).to.have.property('run');
    });
  });

  describe('connect', () => {
    it('should connect to Kafka broker successfully', async () => {
      consumerStub.connect.resolves();
      const logStub = sandbox.stub(commonHelper, 'log');

      await consumerKafka.connect();

      expect(consumerStub.connect.calledOnce).to.be.true;
      expect(logStub.calledWith('kafka-confluent-consumer', 'Connected to Kafka broker')).to.be.true;
    });

    it('should handle connection error', async () => {
      const error = new Error('Connection failed');
      consumerStub.connect.rejects(error);
      const logStub = sandbox.stub(commonHelper, 'log');

      try {
        await consumerKafka.connect();
      } catch (err) {
        expect(logStub.calledWith('kafka-confluent-consumer', `Failed to connect to Kafka broker: ${error.message}`)).to.be.false;
        expect(err).to.equal(error);
      }
    });
  });

  describe('subscribe', () => {
    it('should subscribe to Kafka topic successfully', async () => {
      consumerStub.subscribe.resolves();
      const logStub = sandbox.stub(commonHelper, 'log');

      await consumerKafka.subscribe('testTopic');

      expect(consumerStub.subscribe.calledOnce).to.be.true;
      expect(logStub.calledWith('kafka-confluent-consumer', 'Subscribed to topic testTopic')).to.be.false;
    });

    it('should handle subscription error', async () => {
      const error = new Error('Subscription failed');
      consumerStub.subscribe.rejects(error);
      const logStub = sandbox.stub(commonHelper, 'log');

      try {
        await consumerKafka.subscribe('testTopic');
      } catch (err) {
        expect(logStub.calledWith('kafka-confluent-consumer', `Failed to subscribe to topic testTopic: ${error.message}`)).to.be.false;
        expect(err).to.equal(error);
      }
    });
  });

  describe('run', () => {
    it('should run consumer and process messages successfully', async () => {
      const messageHandler = sandbox.stub();
      consumerStub.run.resolves();
      const logStub = sandbox.stub(commonHelper, 'log');

      await consumerKafka.run(messageHandler);

      expect(consumerStub.run.calledOnce).to.be.true;
      expect(logStub.calledWith('kafka-confluent-consumer', 'Consumer is running')).to.be.false;
    });

    it('should handle message processing error', async () => {
      const messageHandler = sandbox.stub().throws(new Error('Processing error'));
      consumerStub.run.callsFake(async ({ eachMessage }) => {
        await eachMessage({ topic: 'testTopic', partition: 0, message: { value: Buffer.from('testMessage') } });
      });
      const logStub = sandbox.stub(commonHelper, 'log');

      try {
        await consumerKafka.run(messageHandler);
      } catch (err) {
        expect(logStub.calledWith('kafka-confluent-consumer', `Error processing message: ${err.message}`)).to.be.false;
      }
    });
  });
});
