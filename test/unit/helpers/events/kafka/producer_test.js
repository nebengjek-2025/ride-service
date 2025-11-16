const sinon = require('sinon');
const { expect } = require('chai');
const { Kafka, logLevel } = require('kafkajs');
const config = require('../../../../../src/infra');
const commonHelper = require('all-in-one');
const { kafkaSendProducerAsync } = require('../../../../../src/helpers/events/kafka/producer');

describe('Kafka Producer', () => {
  let sandbox;
  let kafkaStub;
  let producerStub;
  let kafkaConfig;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    kafkaConfig = {
      kafkaClientId: 'testClient',
      kafkaHost: 'localhost:9092',
      kafkaSaslUsername: 'testUser',
      kafkaSaslPassword: 'testPassword'
    };
    sandbox.stub(config, 'get').returns(kafkaConfig);
    kafkaStub = sandbox.stub(Kafka.prototype, 'producer').returns({
      connect: sandbox.stub(),
      send: sandbox.stub(),
      on: sandbox.stub(),
      disconnect: sandbox.stub()
    });
    producerStub = kafkaStub();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Kafka Initialization', () => {
    it('should initialize Kafka client and producer with correct parameters', () => {
      const kafka = new Kafka({
        clientId: kafkaConfig.kafkaClientId,
        brokers: [kafkaConfig.kafkaHost],
        ssl: true,
        sasl: {
          mechanism: 'plain',
          username: kafkaConfig.kafkaSaslUsername,
          password: kafkaConfig.kafkaSaslPassword
        },
        logLevel: logLevel.INFO
      });
      const producer = kafka.producer();

      expect(producer).to.have.property('connect');
      expect(producer).to.have.property('send');
      expect(producer).to.have.property('on');
    });
  });

  describe('kafkaSendProducerAsync', () => {

    it('should handle message sending error', async () => {
      const error = new Error('Sending failed');
      producerStub.connect.resolves();
      producerStub.send.rejects(error);
      const logStub = sandbox.stub(commonHelper, 'log');

      try {
        await kafkaSendProducerAsync('testTopic', 'testMessage');
      } catch (err) {
        expect(logStub.calledWith(['ERROR', 'kafka-producer'], `Failed to send message to Kafka topic testTopic: ${error.message}`)).to.be.false;
        expect(err).to.not.equals(error);
      }
    });
  });
});
