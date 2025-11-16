// sonarignore
const events = require('events');
events.EventEmitter.defaultMaxListeners = 20;
const apm = require('elastic-apm-node');
const commonHelper = require('all-in-one');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const routes = require('../routes');
const jwtAuth = require('../auth/jwt_auth_helper');
const observer = require('./observers');
const healtCheck = require('./health_check');
const driverHandler = require('../modules/driver/handlers/api_handler');
class AppServer {

  constructor() {
    this.init();
  }

  async init() {
    const app = express();
    this.server = http.createServer(app);

    let correlator;
    try {
      correlator = require('correlator');
    } catch (e) {
      correlator = () => (req, res, next) => next();
    }

    let cors;
    try {
      cors = require('cors');
    } catch (e) {
      cors = () => () => (req, res, next) => next();
    }
    app.use(helmet());
    app.use(correlator());
    app.use(cors({
      preflightMaxAge: 5,
      origin: ['*'],
      allowedHeaders: ['Authorization'],
      exposedHeaders: ['Authorization']
    }));
    app.use(commonHelper.initLogger());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));


    app.get('/', (req, res, next) => {
      res.status(200).send({ success: true, data: 'server init', message: 'This service is running properly', code: 200 });
      next();
    });
    app.get('/service/health', (req, res, next) => {
      healtCheck.checkServiceHealth(this.server);
      res.status(200).send({ success: true, data: 'server init', message: 'This service is running health check', code: 200 });
      next();
    });
    app.get('/socket-health', (req, res, next) => {
      try {
        // Only include serializable data
        const status = {
          running: Boolean(this.server && io),
          connectionsCount: io ? io.engine.clientsCount : 0,
          uptime: process.uptime(),
          rooms: io ? Array.from(io.sockets.adapter.rooms.keys())
            .filter(room => !io.sockets.adapter.sids.has(room)) : [],
          namespace: io ? Object.keys(io.nsps).join(', ') : '',
          timestamp: new Date().toISOString()
        };
        res.status(200).json(status);
      } catch (error) {
        commonHelper.log(['Error'], `Socket health check failed: ${error.message}`);
        res.status(500).json({
          running: false,
          error: error.message
        });
      }
      next();
    });
    app.post(
      '/driver/v1/activate-beacon',
      jwtAuth.verifyToken,
      driverHandler.activateBeacon,
    );

    // initiate socket io
    const io = new Server(this.server, {
      cors: {
        origin: '*',
      }
    });

    io.use(jwtAuth.authSocket);
    io.engine.use(helmet());
    io.use((socket, next) => {
      const logEvent = (eventName, data) => {
        const message = `${eventName} - ${JSON.stringify(data)}`;
        const clientIp = socket.handshake.address;
        const meta = {
          'service.name': process.env.SERVICE_NAME,
          'service.version': process.env.VERSION,
          'log.logger': 'socketio',
          tags: ['audit-log'],
          'event.name': eventName,
          'client.address': clientIp,
          'client.ip': clientIp,
          'user.id': socket.userId || '',
          'user.roles': socket.role ? [socket.role] : undefined,
          'event.data': data ? JSON.stringify(data) : '',
          'event.duration': 0,
          'http.response.date': new Date().toISOString(),
        };

        const obj = {
          context: 'service-info',
          scope: 'audit-log',
          message: message,
          meta: meta,
          ...apm.currentTraceIds,
        };

        commonHelper.log(['Info','socket'],obj);
      };
      socket.onAny((eventName, ...args) => {
        logEvent(eventName, args);
      });
      next();
    });
    const onConnection = (socket) => {
      commonHelper.log(['Info'], `Socket connected: ${socket.id}, userId: ${socket.userId}, driverId: ${socket.driverId}`);
      routes(socket);
    };
    global.io = io;
    io.on('connection', onConnection);
    observer.init();
  }
}

module.exports = AppServer;
