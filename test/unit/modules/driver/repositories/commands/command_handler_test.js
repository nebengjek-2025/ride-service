const sinon = require('sinon');
const assert = require('assert');
const commandHandler = require('../../../../../../src/modules/driver/repositories/commands/command_handler');
const Driver = require('../../../../../../src/modules/driver/repositories/commands/domain');

describe('driver-commandHandler', () => {

  const data = {
    success: true,
    data: 'success',
    message: 'success',
    code: 200
  };

  let payload;

  describe('locationUpdate', () => {
    payload = {
      latitude:1.1234,
      longitude:1.123456,
      metadata: {
        driverId:'123456',
        senderId:'123456',
      }
    };
    it('should info success locationUpdate', async() => {
      sinon.stub(Driver.prototype, 'locationUpdate').resolves(data);

      const rs = await commandHandler.locationUpdate(payload);

      assert.equal(rs.code, 200);

      Driver.prototype.locationUpdate.restore();
    });
  });

  describe('broadcastPickupPassanger', () => {
    payload = {
      socketId:'123456',
      driverId:'123456',
      passangerId:'123456',
      routeSummary: {}
    };
    it('should info success broadcastPickupPassanger', async() => {
      sinon.stub(Driver.prototype, 'broadcastPickupPassanger').resolves(data);

      const rs = await commandHandler.broadcastPickupPassanger(payload);

      assert.equal(rs.code, 200);

      Driver.prototype.broadcastPickupPassanger.restore();
    });
  });

  describe('tripTracker', () => {
    payload = {
      latitude:1.1234,
      longitude:1.123456,
      metadata: {
        driverId:'123456',
        senderId:'123456',
      }
    };
    it('should info success tripTracker', async() => {
      sinon.stub(Driver.prototype, 'tripTracker').resolves(data);

      const rs = await commandHandler.tripTracker(payload);

      assert.equal(rs.code, 200);

      Driver.prototype.tripTracker.restore();
    });
  });
});
