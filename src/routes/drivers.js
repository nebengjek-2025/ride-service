const { async } = require('validate.js');
const driverEventHandler = require('../modules/driver/handlers/event_handler');

module.exports = (socket) => {
  socket.on('driver:location-update', async (data, callback) => {
    data.metadata = {senderId:socket.id,userId:socket.userId, driverId:socket.driverId};
    await driverEventHandler.locationUpdate(data,callback);
  });
  socket.on('driver:trip-tracker', async (data, callback) => {
    data.metadata = {senderId:socket.id,userId:socket.userId, driverId:socket.driverId};
    await driverEventHandler.tripTracker(data,callback);
  });
  socket.on('driver:request-pickup', async (data, callback) => {
    data.metadata = {senderId:socket.id,userId:socket.userId, driverId:socket.driverId};
    await driverEventHandler.requestPickup(data,callback);
  });
};
