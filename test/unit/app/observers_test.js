const sinon = require('sinon');
const { expect } = require('chai');
const commonHelper = require('all-in-one');
const driverEventHandler = require('../../../src/modules/driver/handlers/event_handler');
const { init } = require('../../../src/app/observers');

// src/app/observers.test.js

describe('Observers - init', () => {
  let logStub;
  let initConsumersStub;

  beforeEach(() => {
    logStub = sinon.stub(commonHelper, 'log');
    initConsumersStub = sinon.stub(driverEventHandler, 'initConsumers');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should log "Observer is Running..." and call initConsumers', () => {
    init();

    expect(logStub.calledOnceWith(['Info'], 'Observer is Running...')).to.be.true;
    expect(initConsumersStub.calledOnce).to.be.true;
  });
});
