
const commonHelper = require('all-in-one');
const haversine = require('haversine');
const Query = require('../queries/query');
const Command = require('./command');
const Redis = require('../../../../helpers/databases/redis/redis');
const { NotFoundError, UnauthorizedError, ConflictError } = commonHelper.Error;
const wrapper = commonHelper.Wrapper;
const _ = require('lodash');
const config = require('../../../../infra');
const producer = require('../../../../helpers/events/kafka/producer');
const REDIS_CLIENT_CONFIGURATION = config.get('/redis');
const moment = require('moment');
class Driver {

  constructor(db){
    this.command = new Command(db);
    this.query = new Query(db);
    this.redisClient = new Redis(REDIS_CLIENT_CONFIGURATION);
  }

  async activateBeacon(data) {
    const ctx = 'domain-activateBeacon';
    const driverData = await this.query.findOneUser({userId:data.driverId, isMitra:true});
    if(driverData.err){
      commonHelper.log(['ERROR',ctx],{error:driverData.err, message:'driver data not found'});
      return wrapper.error(new NotFoundError({message:'driver not found',code:4004}));
    }
    if(!driverData.data.isVerified || !driverData.data.isCompleted){
      commonHelper.log(['ERROR',ctx],'driver not verified or completed');
      return wrapper.error(new UnauthorizedError({message:'driver not verified or completed',code:4003}));
    }
    let workLogData;
    const dateNow = new Date();
    const workDate = moment(dateNow).format('YYYY-MM-DD');
    const worklog = await this.query.findWorkLog({ driverId: data.driverId, workDate });
    if(worklog.err || _.isEmpty(worklog.data)){
      commonHelper.log(['INFO',ctx],'worklog not found, creating new worklog');
      const createWorkLog = await this.command.createWorkLog({ driverId: data.driverId, workDate });
      if(createWorkLog.err){
        commonHelper.log(['ERROR',ctx],{error:createWorkLog.err, message:'failed to create worklog'});
        return wrapper.error(new ConflictError({message:'failed to create worklog',code:4005}));
      }
      workLogData = {
        id: createWorkLog.data.id,
        driverId: data.driverId,
        workDate,
        log:[]
      };
    }else{
      commonHelper.log(['INFO',ctx],'worklog found');
      workLogData = worklog.data;
      // fetch existing log activities
      const activities = await this.query.findActivitiesByWorkLogId(worklog.data.id);
      if(!activities.err){
        commonHelper.log(['INFO',ctx],'log activities found');
        workLogData.log = activities.data;
      }else{
        workLogData.log = [];
      }
    }
    const active = data.status === 'work';

    if (workLogData.log.length > 0) {
      const lastLog = workLogData.log[workLogData.log.length - 1];
      const durationMinutes = moment(dateNow).diff(moment(lastLog.workTime), 'minutes');

      if (lastLog.active == active && lastLog.status === data.status) {
        commonHelper.log(['INFO', ctx], 'status and active same as last log, no need to insert activity');
        return wrapper.error(new ConflictError({ message: 'Status and active same as last log', code: 4007 }));
      }
      if (durationMinutes < 10 && !active) {
        commonHelper.log(['ERROR', ctx], 'cannot activate beacon within 10 minutes of last activity');
        return wrapper.error(new ConflictError({ message: 'Cannot activate beacon within 10 minutes of last activity', code: 4002 }));
      }
    }

    const insertActivity = await this.command.insertActivity({
      workLogId: workLogData.id,
      workTime: dateNow,
      active,
      status: data.status
    });

    if (insertActivity.err) {
      commonHelper.log(['ERROR', ctx], { error: insertActivity.err, message: 'failed to insert activity' });
      return wrapper.error(new ConflictError({ message: 'failed to insert activity', code: 4006 }));
    }
    let urlSocket = `${config.get('/socketServer/url')}?driver=${data.driverId}`;
    if (data.status !== 'work') {
      urlSocket = 'selamat istirahat';
    }
    return wrapper.data(urlSocket);
  }

  async locationUpdate(data) {
    // check is driver idle
    const keyStatusDriver = `DRIVER:PICKING-PASSANGER:${data.metadata.driverId}`;
    const statusDriver = await this.redisClient.getData(keyStatusDriver);
    if(!_.isEmpty(statusDriver.data)){
      return wrapper.error(new ConflictError({message:'driver picking passanger',data:statusDriver.data,code:4001}));
    }
    const key = `PASSANGER:PICKUP:${data.metadata.driverId}`;
    const offerPassanger = await this.redisClient.getData(key);
    commonHelper.info(['INFO','domain-locationUpdate'],`offerPassanger data: ${offerPassanger.data}`);
    if(!_.isEmpty(offerPassanger.data)){
      const offerData = JSON.parse(offerPassanger.data).data;
      global.io.to(data.metadata.senderId).emit('pickup-passanger', {routeSummary:offerData.routeSummary, passangerId: offerData.passangerId});
    }
    const geoaddlocation = await this.redisClient.addDriverLocation(data.metadata.driverId,data.latitude,data.longitude);
    // upsert driver available
    const driverAvailable = await this.command.upsertDriverAvailability({
      driverId: data.metadata.driverId,
      isAvailable: true,
      status: "online",
      socketId: data.metadata.senderId
    });
    if(driverAvailable.err){
      commonHelper.log(['ERROR','domain-locationUpdate'],{error:driverAvailable.err, message:'failed to upsert driver availability'});
      return wrapper.error(driverAvailable.err);
    }
 
    return wrapper.data(geoaddlocation);
  }

  async tripTracker(data) {
    try {
      const {latitude, longitude, orderId} = data;
      const {driverId} = data.metadata;
      const currentLocation = { latitude, longitude };
      const redisKey = `order:${orderId}:driver:${driverId}`;
      const prevLocationData = await this.redisClient.getData(redisKey);
      let distance = 0;
      if (!_.isEmpty(prevLocationData.data)) {
        const prevLocation = JSON.parse(prevLocationData.data).data;
        distance = haversine(prevLocation, currentLocation, { unit: 'km' });
      }

      const updatedDistance = await this.redisClient.hincrbyfloat(`order:${orderId}:distance`, driverId, distance);
      if(updatedDistance.error){
        /* istanbul ignore next */
        return wrapper.error(updatedDistance.error);
      }
      const distanceUpdate = parseFloat(updatedDistance.data);
      await this.redisClient.setDataEx(redisKey, currentLocation,60);
      const dataDistance = {
        driverId,
        distance:distanceUpdate.toFixed(2)
      };
      await this.redisClient.setData(`trip:${orderId}`, dataDistance);
      return wrapper.data(distanceUpdate.toFixed(2));
    } catch (error) {
      /* istanbul ignore next */
      return wrapper.error(error);
    }

  }

  async broadcastPickupPassanger(data) {
    const routeSummary = await this.redisClient.getData(`USER:ROUTE:${data.message.userId}`);
    const cacheRoute = JSON.parse(routeSummary.data);
    const drivers = await this.redisClient.getNearbyDrivers(data.message.routeSummary?.route?.origin?.longitude || cacheRoute.route?.origin?.longitude, data.message.routeSummary?.route?.origin?.latitude || cacheRoute.route?.origin?.latitude, 3);
    if(drivers.err){
      // retry in case of error
      commonHelper.log(['ERROR','domain-broadcastPickupPassanger'],{error:drivers.err, message:'failed to get nearby drivers'});
      return wrapper.error(drivers.err);
    }

    if(drivers.data.length === 0){
      commonHelper.log(['INFO','domain-broadcastPickupPassanger'],'no drivers found nearby');
      return wrapper.error(new NotFoundError({message:'no drivers found nearby',code:4004}));
    }
    for(const driverId of drivers.data){
      const driverInfo = await this.query.findDriver(driverId);
      if(driverInfo.err || _.isEmpty(driverInfo.data)){
        commonHelper.log(['ERROR','domain-broadcastPickupPassanger'],{error:driverInfo.err, message:`driver not found: ${driverId}`});
        continue;
      }
      if(!driverInfo.data[0].is_available){
        commonHelper.log(['INFO','domain-broadcastPickupPassanger'],`driver not available: ${driverId}`);
        continue;
      }

      const payload = {
        driverId,
        passangerId: data.message.userId,
        routeSummary: data.message.routeSummary || cacheRoute.routeSummary,
        socketId: driverInfo.data[0].socketId
      };
      if(global.io.sockets.sockets.has(payload.socketId)){
        commonHelper.log(['INFO','domain-broadcastPickupPassanger'],`driver found nearby: ${driverId}, socketId: ${payload.socketId}`);
        const key = `PASSANGER:PICKUP:${driverId}`;
        await this.redisClient.setDataEx(key,payload,300);
        global.io.to(data.socketId).emit('pickup-passanger', {routeSummary:payload.routeSummary, passangerId: payload.passangerId});
      }else{
        commonHelper.log(['INFO','domain-broadcastPickupPassanger'],`socket ID not found in active connections: ${payload.socketId}`);
        const key = `PASSANGER:PICKUP:${driverId}`;
        await this.redisClient.setDataEx(key,payload,300);
      }
      return wrapper.data();
    }
    commonHelper.log(['INFO','domain-broadcastPickupPassanger'],'no drivers found nearby');
    return wrapper.error(new NotFoundError({message:'no drivers found nearby',code:4004}));
  }

}

module.exports = Driver;
