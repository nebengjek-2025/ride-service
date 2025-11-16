const { Kafka,PartitionAssigners: { roundRobin },logLevel } = require('kafkajs');
const commonHelper = require('all-in-one');
const config = require('../../../infra');
const ctx = 'kafka-confluent-consumer';


class ConsumerKafka {
  constructor(data) {
    const kafkaConfig = config.get('/kafka');
    const kafka = new Kafka({
      clientId: kafkaConfig.kafkaClientId,
      brokers: [kafkaConfig.kafkaHost],
      ssl: false,
      // sasl: {
      // mechanism: 'plain',
      // username: kafkaConfig.kafkaSaslUsername,
      // password: kafkaConfig.kafkaSaslPassword
      // },
      logLevel: logLevel.INFO
    });
    this.consumer = kafka.consumer({
      groupId: data.groupId,
      sessionTimeout: 45000,
      heartbeatInterval: 20000,
      rebalanceTimeout:45000,
      partitionAssigners: [
        roundRobin
      ]
    });
  }

  async connect() {
    try {
      await this.consumer.connect();
      commonHelper.log(ctx,'Connected to Kafka broker');
    } catch (error) {
      commonHelper.log(['ERROR',ctx],`Error connecting to Kafka broker: ${error.message}`);
      throw error;
    }
  }

  async subscribe(topic) {
    try {
      await this.consumer.subscribe({ topic });
      commonHelper.log(ctx,`Subscribed to topic: ${topic}`);
    } catch (error) {
      commonHelper.log(['ERROR',ctx],`Error subscribing to topic: ${error.message}`);
      throw error;
    }
  }

  async run(handler) {
    await this.consumer.run({
      autoCommitInterval: 5000,
      autoCommitThreshold: 100,
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (message && message.value !== undefined) {

            const messageValue = message.value.toString();
            commonHelper.log(ctx,`Received message on topic: ${topic}`);
            commonHelper.log(['ERROR',ctx],`Message content: ${messageValue}`);
            handler(topic, partition, messageValue);
          } else {
            /* istanbul ignore next */
            commonHelper.log(ctx,`Received message with missing or undefined 'value' on topic: ${topic}`);
          }
        } catch(error) {
          commonHelper.log('ERROR',`Error processing message: ${error.message}`);
        }
      },
    });
  }
}

module.exports = ConsumerKafka;
