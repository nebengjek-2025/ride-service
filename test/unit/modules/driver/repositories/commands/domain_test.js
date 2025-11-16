const sinon = require('sinon');
const { expect } = require('chai');
const commonHelper = require('all-in-one');
const Driver = require('../../../../../../src/modules/driver/repositories/commands/domain');
const Redis = require('../../../../../../src/helpers/databases/redis/redis');
const producer = require('../../../../../../src/helpers/events/kafka/producer');
const { ConflictError } = commonHelper.Error;
const wrapper = commonHelper.Wrapper;

describe('Driver', () => {
  let sandbox;
  let redisClientStub;
  let driver;
  let logStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    redisClientStub = {
      getData: sandbox.stub(),
      setData: sandbox.stub(),
      setDataEx: sandbox.stub(),
      addDriverLocation: sandbox.stub(),
      hincrbyfloat: sandbox.stub()
    };
    driver = new Driver({ redisClient: redisClientStub });
    global.io = {
      sockets: {
        sockets: new Map()
      },
      to: sandbox.stub().returns({ emit: sandbox.stub() })
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('locationUpdate', () => {
    it('should handle location update successfully', async () => {
      const data = {
        metadata: { driverId: 'driver1', senderId: 'sender1' },
        latitude: 40.7128,
        longitude: -74.0060
      };
      redisClientStub.getData.onFirstCall().resolves({ data: '' });
      redisClientStub.getData.onSecondCall().resolves({ data: '' });
      sandbox.stub(producer, 'kafkaSendProducerAsync').resolves();
      redisClientStub.addDriverLocation.resolves({ data: 'locationAdded' });

      const result = await driver.locationUpdate(data);

      expect(result).to.deep.equal(wrapper.data({ data: 0, err:null }));
    });

    it('should return conflict error if driver is picking passenger', async () => {
      const data = {
        metadata: { driverId: 'driver1', senderId: 'sender1' },
        latitude: 40.7128,
        longitude: -74.0060
      };
      sinon.stub(Redis.prototype, 'getData').returns({ data: 'picking' });

      const result = await driver.locationUpdate(data);
      Redis.prototype.getData.restore();
      expect(result).to.deep.equal(wrapper.error(new ConflictError({ message: 'driver picking passanger', data: 'picking', code: 4001 })));
    });
  });

  describe('tripTracker', () => {
    it('should handle trip tracking successfully', async () => {
      const data = {
        latitude: 40.7128,
        longitude: -74.0060,
        orderId: 'order1',
        metadata: { driverId: 'driver1' }
      };
      redisClientStub.getData.resolves({ data: JSON.stringify({ data: { latitude: 40.7127, longitude: -74.0059 } }) });
      redisClientStub.hincrbyfloat.resolves({ data: 1.5 });
      redisClientStub.setDataEx.resolves();
      redisClientStub.setData.resolves();

      const result = await driver.tripTracker(data);

      expect(result).to.deep.equal(wrapper.data('0.00'));
    });

    it('should handle trip tracking error', async () => {
      const data = {
        latitude: 40.7128,
        longitude: -74.0060,
        orderId: 'order1',
        metadata: { driverId: 'driver1' }
      };
      sinon.stub(Redis.prototype, 'hincrbyfloat').returns({ data: 'NaN' });
      const result = await driver.tripTracker(data);
      Redis.prototype.hincrbyfloat.restore();
      expect(result).to.deep.equal({data:'NaN', err:null});
    });
  });

  describe('broadcastPickupPassanger', () => {
    it('should broadcast pickup passenger successfully', async () => {
      const data = {
        socketId: 'socket1',
        routeSummary: 'routeSummary',
        passangerId: 'passanger1',
        driverId: 'driver1'
      };
      sandbox.stub(global.io.sockets.sockets, 'has').returns(true);

      const result = await driver.broadcastPickupPassanger(data);

      expect(global.io.sockets.sockets.has.calledOnce).to.be.true;
      expect(global.io.to.calledOnce).to.be.true;
      expect(result).to.deep.equal(wrapper.data());
    });

    it('should set data with expiration if socket does not exist', async () => {
      const data = {
        socketId: 'socket1',
        routeSummary: 'routeSummary',
        passangerId: 'passanger1',
        driverId: 'driver1'
      };
      sandbox.stub(global.io.sockets.sockets, 'has').returns(false);
      redisClientStub.setDataEx.resolves();

      const result = await driver.broadcastPickupPassanger(data);

      expect(result).to.deep.equal(wrapper.data());
    });
  });
});
