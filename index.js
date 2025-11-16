const commonHelper = require('all-in-one');
const gracfulShutdown = require('./src/app/graceful_shutdown');
const AppServer = require('./src/app/server');
const configs = require('./src/infra');

const appServer = new AppServer();

const port = process.env.PORT || configs.get('/port') || 1337;
const server = appServer.server.listen(port, () => {
  const ctx = 'app-listen';
  commonHelper.log(['Info'], `${ctx} service started, listening at ${port}`);
});

gracfulShutdown.init(server);

