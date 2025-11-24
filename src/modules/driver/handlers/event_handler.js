const commonHelper = require('all-in-one');
const producer = require('../../../helpers/events/kafka/producer');
const commandHandler = require('../repositories/commands/command_handler');
const commandModel = require('../repositories/commands/command_model');
const ConsumerManager = require('../../../helpers/events/kafka/manager');
const wrapper = commonHelper.Wrapper;
const { ERROR:httpError, SUCCESS:http } = commonHelper;
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const project = require('../../../../package.json');
const { performance }= require('perf_hooks');

async function handleMessage(topic, partition, messageValue, handlerFunction) {
  const ctx = handlerFunction.name;
  const startTime = performance.now();
  try {
    const payload = JSON.parse(messageValue);
    /* istanbul ignore next */
    const result = await handlerFunction(payload);
    /* istanbul ignore next */
    commonHelper.log([ctx,'INFO'], `Processing message from consumer: ${JSON.stringify({ topic, partition, messageValue })}, 
    Result Processing event: ${JSON.stringify(result)}`);
    /* istanbul ignore next */
    if (result.err) {
      const errorPayload = {
        eventId: uuidv4(),
        eventName: `${topic}_FAILED`,
        eventType: 'json',
        eventSource: project.name,
        eventData: {
          topic,
          service: `${project.name}@${project.version}`,
          error: result.err.message,
          errorCode: result.err.code,
          value: payload,
          response: result.err.data,
        },
        eventOrder: 'high',
        eventStatus: 'open',
        version: '1.0.0',
        timestamp: moment().toISOString(),
      };

      const dataToKafka = {
        topic: 'dlq-kafka-failed',
        body: errorPayload,
      };
      /* istanbul ignore next */
      await producer.kafkaSendProducerAsync(dataToKafka);
      commonHelper.log([ctx,'ERROR'], `Error in processing message: ${result.err.message}`);
    }
  } catch (error) {
    commonHelper.log([ctx,'ERROR'], `Unexpected error processing message: ${error.message}`);
  } finally {
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    commonHelper.log(['INFO'], `Executed consumer ${ctx}: ${executionTime} ms`);
  }
}

const initConsumers = async () => {
  try {
    const consumer = ConsumerManager.getInstance(project.name);

    await consumer.subscribe('request-ride');

    await consumer.run((topic, partition, messageValue) => {
      /* istanbul ignore next */
      switch (topic) {
      case 'request-ride':
        /* istanbul ignore next */
        return handleMessage(topic, partition, messageValue, broadcastPickupPassanger);
      default:
        commonHelper.log(['INFO','event_controller'], `Unhandled topic: ${topic}`);
      }
    });


    commonHelper.log(['INFO','event_controller'], 'All consumers initialized successfully');

  } catch (error) {
    commonHelper.log(['ERROR','event_controller'], `Error initializing consumers: ${error.message}`);
  }
};

const broadcastPickupPassanger = async(message) => {
  try {
    const postRequest = async (payload) => {
      return commandHandler.broadcastPickupPassanger(payload);
    };
    const result = await postRequest(message);
    return result;
  } catch (error) {
    return wrapper.error(error);
  }
};

const locationUpdate = async (data, callback) => {
  const payload = data;
  const validatePayload = commonHelper.isValidPayload(payload, commandModel.locationUpdate);
  const postRequest = async (result) => {
    return result.err ? result :
    /* istanbul ignore next */
      commandHandler.locationUpdate(result.data);
  };
  const result = await postRequest(validatePayload);
  if (result.err){
    callback({
      success: false,
      message: 'upddate location failed.',
      statusCode: result.err.code || 500,
      body: result.err
    });
  }
  callback({
    success: true,
    message: 'Location received and processed.',
    statusCode: 200,
    body: 'ok'
  });
};

const tripTracker = async (data, callback) => {
  const payload = data;
  const validatePayload = commonHelper.isValidPayload(payload, commandModel.tripTracker);
  const postRequest = async (result) => {
    return result.err ? result :
      /* istanbul ignore next */
      commandHandler.tripTracker(result.data);
  };
  const result = await postRequest(validatePayload);
  if (result.err){
    callback({
      success: false,
      message: 'tracker location failed.',
      statusCode: result.err.code || 500,
      body: result.err
    });
  }
  callback({
    success: true,
    message: 'Trip Tracker received and processed.',
    statusCode: 200,
    body: 'ok'
  });
};

module.exports = {
  locationUpdate,
  tripTracker,
  initConsumers,
  handleMessage,
  broadcastPickupPassanger
};
