
const commonHelper = require('all-in-one');
const _ = require('lodash');

const wrapper = commonHelper.Wrapper;
const commandHandler = require('../repositories/commands/command_handler');
const commandModel = require('../repositories/commands/command_model');
const { ERROR:httpError, SUCCESS:http } = commonHelper;

const activateBeacon = async (req, res) => {
  const { user_id } = req.userMeta;
  const payload = req.body;
  payload.driverId = user_id;
  const validatePayload = commonHelper.isValidPayload(payload, commandModel.BeaconRequest);
  const postRequest = async (result) => {
    return result.err ? result : commandHandler.activateBeacon(result.data);
  };
  const sendResponse = async (result) => {
    (result.err)
      ? wrapper.response(res, 'fail', result, 'Update beacon driver', httpError.CONFLICT)
      : wrapper.response(res, 'success', result, 'Update beacon driver', http.OK);
  };
  sendResponse(await postRequest(validatePayload));
};

module.exports = {
  activateBeacon
};
