const { Kafka,logLevel } = require('kafkajs');
const moment = require('moment');
const timestamp = moment().local();
const config = require('../../../infra');
const commonHelper = require('all-in-one');
const kafkaConfig = config.get('/kafka');
const ca   = Buffer.from(kafkaConfig.kafkaCaCert, 'base64').toString('utf-8');
const cert = Buffer.from(kafkaConfig.kafkaCertBase64, 'base64').toString('utf-8');
const key  = Buffer.from(kafkaConfig.KafkaKeyBase64, 'base64').toString('utf-8');
const kafka = new Kafka({
  brokers: [`${kafkaConfig.kafkaHost}`],
  ssl: {
    rejectUnauthorized: true,
    ca: [ca],
    cert,
    key
  },
  logLevel: logLevel.INFO
});
const ctx = 'kafka-producer';

const producer = kafka.producer();
producer.on('producer.connect', () => {
  /* istanbul ignore next */
  commonHelper.log(['INFO',ctx,'producer.connect'], 'Kafka Producer is connected and ready.');
});

producer.on('producer.disconnect', () => {
  /* istanbul ignore next */
  commonHelper.log(['EROOR',ctx,'producer.disconnect'], 'Kafka Producer could not connect');
});
producer.on('producer.network.request_timeout', (payload) => {
  /* istanbul ignore next */
  commonHelper.log(['EROOR',ctx,'producer.network.request_timeout'], `Kafka Producer request timeout ${payload.clientId}`);
});

const kafkaSendProducerAsync = async (data) => {
  await producer.connect();
  const { topic, body } = data;
  const buffer = new Buffer.from(JSON.stringify(body));
  const record = {
    topic: data.topic,
    messages: [
      {
        value: buffer,
      },
    ],
  };
  /* istanbul ignore next */
  try {
    await producer.send(record);
    commonHelper.log(['INFO',ctx,'kafkaSendProducerAsync'], `Kafka Send data to ${topic}`);
  } catch (err) {
    commonHelper.log(['ERROR',ctx,'kafkaSendProducerAsync'], `Kafka producer-error-send ${err}`);
  }
};

module.exports = {
  kafkaSendProducerAsync
};
