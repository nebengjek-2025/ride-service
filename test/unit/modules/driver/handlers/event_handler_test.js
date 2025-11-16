const sinon = require('sinon');
const { expect } = require('chai');
const commonHelper = require('all-in-one');
const ConsumerManager = require('../../../../../src/helpers/events/kafka/manager');
const { initConsumers, handleMessage,
  broadcastPickupPassanger, locationUpdate,
  tripTracker } = require('../../../../../src/modules/driver/handlers/event_handler');
const project = require('../../../../../package.json');

describe('Event Handler - initConsumers', () => {
  let consumerStub;
  let logStub;

  beforeEach(() => {
    consumerStub = {
      subscribe: sinon.stub().resolves(),
      run: sinon.stub().resolves()
    };
    sinon.stub(ConsumerManager, 'getInstance').returns(consumerStub);
    logStub = sinon.stub(commonHelper, 'log');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should initialize consumers successfully', async () => {
    await initConsumers();

    expect(ConsumerManager.getInstance.calledOnceWith(project.name)).to.be.true;
    expect(consumerStub.subscribe.calledOnceWith('broadcast-pickup-passanger')).to.be.true;
    expect(consumerStub.run.calledOnce).to.be.true;
    expect(logStub.calledWith(['INFO', 'event_controller'], 'All consumers initialized successfully')).to.be.true;
  });

  it('should log error if consumer initialization fails', async () => {
    const error = new Error('Initialization failed');
    consumerStub.subscribe.rejects(error);

    await initConsumers();

    expect(ConsumerManager.getInstance.calledOnceWith(project.name)).to.be.true;
    expect(consumerStub.subscribe.calledOnceWith('broadcast-pickup-passanger')).to.be.true;
    expect(logStub.calledWith(['ERROR', 'event_controller'], `Error initializing consumers: ${error.message}`)).to.be.true;
  });
});

describe('Event Handler - handleMessage', () => {
  let logStub;

  beforeEach(() => {
    logStub = sinon.stub(commonHelper, 'log');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should handle message successfully', async () => {
    const topic = 'broadcast-pickup-passanger';
    const partition = 0;
    const messageValue = 'testMessage';
    const handlerStub = sinon.stub().resolves();

    await handleMessage(topic, partition, messageValue, handlerStub);

    expect(handlerStub.calledOnceWith(messageValue)).to.be.false;
    expect(logStub.calledWith(['INFO'], `Handled message from topic ${topic}, partition ${partition}`)).to.be.false;
  });

  it('should log error if message handling fails', async () => {
    const topic = 'broadcast-pickup-passanger';
    const partition = 0;
    const messageValue = 'testMessage';
    const handlerStub = sinon.stub().resolves(commonHelper.Wrapper.error(new Error('Handling failed')));

    await handleMessage(topic, partition, messageValue, handlerStub);
    expect(logStub.calledWith(['ERROR'], `Error handling message from topic ${topic}, partition ${partition}: Handling failed`)).to.be.false;
  });
});

describe('Event Handler - broadcastPickupPassanger', () => {
  let logStub;

  beforeEach(() => {
    logStub = sinon.stub(commonHelper, 'log');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should log broadcast pickup passanger successfully', async () => {
    const message = 'testMessage';

    await broadcastPickupPassanger(message);

    expect(logStub.calledWith(['INFO'], `Broadcast pickup passanger: ${message}`)).to.be.false;
  });

  it('should log error if logging fails', async () => {
    const message = 'testMessage';
    logStub.throws(new Error('Logging failed'));

    await broadcastPickupPassanger(message);

    expect(logStub.calledWith(['ERROR'], 'Error broadcasting pickup passanger: Logging failed')).to.be.false;
  });
});

describe('Event Handler - locationUpdate', () => {
  let logStub;
  let callback;

  beforeEach(() => {
    logStub = sinon.stub(commonHelper, 'log');
    callback = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should log location update successfully', async () => {
    const message = 'testMessage';

    await locationUpdate(message, callback);

    expect(logStub.calledWith(['INFO'], `Location update: ${message}`)).to.be.false;
    expect(callback.calledOnce).to.be.false;
  });

  it('should log error if logging fails', async () => {
    const message = 'testMessage';
    logStub.throws(new Error('Logging failed'));

    await locationUpdate(message, callback);

    expect(logStub.calledWith(['ERROR'], 'Error updating location: Logging failed')).to.be.false;
    expect(callback.calledOnce).to.be.false;
  });
});

describe('Event Handler - tripTracker', () => {
  let logStub;
  let callback;

  beforeEach(() => {
    logStub = sinon.stub(commonHelper, 'log');
    callback = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should log trip tracking successfully', async () => {
    const message = 'testMessage';

    await tripTracker(message, callback);

    expect(logStub.calledWith(['INFO'], `Trip tracking: ${message}`)).to.be.false;
    expect(callback.calledOnce).to.be.false;
  });

  it('should log error if logging fails', async () => {
    const message = 'testMessage';
    logStub.throws(new Error('Logging failed'));

    await tripTracker(message, callback);

    expect(logStub.calledWith(['ERROR'], 'Error tracking trip: Logging failed')).to.be.false;
    expect(callback.calledOnce).to.be.false;
  });
});
