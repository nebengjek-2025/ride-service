const Consumer = require('./consumer');

const ConsumerManager = {
  instances: {},

  getInstance: function(groupId) {
    if (!this.instances[groupId]) {
      this.instances[groupId] = new Consumer({ groupId });
      this.instances[groupId].connect();
    }
    return this.instances[groupId];
  },
};
module.exports = ConsumerManager;
