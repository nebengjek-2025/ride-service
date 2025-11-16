const sinon = require('sinon');
const { expect } = require('chai');
const driverEventHandler = require('../../../src/modules/driver/handlers/event_handler');
const drivers = require('../../../src/routes/drivers');

// src/routes/drivers.test.js

describe('Drivers Route', () => {
  let sandbox;
  let socket;
  let callback;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    socket = {
      id: 'socket1',
      userId: 'user1',
      driverId: 'driver1',
      on: sandbox.stub()
    };
    callback = sandbox.stub();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should handle driver:location-update event successfully', async () => {
    const data = { latitude: 40.7128, longitude: -74.0060 };
    const locationUpdateStub = sandbox.stub(driverEventHandler, 'locationUpdate').resolves();

    drivers(socket);

    const eventHandler = socket.on.getCall(0).args[1];
    await eventHandler(data, callback);

    expect(socket.on.calledWith('driver:location-update')).to.be.true;
    expect(locationUpdateStub.calledOnce).to.be.true;
    expect(locationUpdateStub.calledWith({ ...data, metadata: {
      senderId: socket.id, userId: socket.userId, driverId: socket.driverId }
    }, callback)).to.be.true;
  });

  it('should handle driver:trip-tracker event successfully', async () => {
    const data = { latitude: 40.7128, longitude: -74.0060 };
    const tripTrackerStub = sandbox.stub(driverEventHandler, 'tripTracker').resolves();

    drivers(socket);

    const eventHandler = socket.on.getCall(1).args[1];
    await eventHandler(data, callback);

    expect(socket.on.calledWith('driver:trip-tracker')).to.be.true;
    expect(tripTrackerStub.calledOnce).to.be.true;
    expect(tripTrackerStub.calledWith({ ...data, metadata: {
      senderId: socket.id, userId: socket.userId, driverId: socket.driverId }
    }, callback)).to.be.true;
  });

});
