
const assert = require('assert');
const sinon = require('sinon');

const Query = require('../../../../../../src/modules/driver/repositories/queries/query');

describe('findOneUser', () => {

  const db = {
    setCollection: sinon.stub(),
    findOne: sinon.stub().resolves({
      'err': null,
      'data': {
        '_id': '65cb2250a10d1f8be67f5517',
        'email': 'email@gmail.com',
        'fullName': 'John Doe',
        'password': '2f658e9318691b9b89e97fe9c7706a56:340312dc133fddb35315d4a5baa3ac1e',
        'referralCode': '',
        'userId': '5430e14f-21a7-4d63-85f8-9267e4211b6f',
        'isConfirmed': true,
        'isAdmin': true
      }
    })
  };

  it('should return success', async() => {
    const query = new Query(db);
    const result = await query.findOneUser({});
    assert.notEqual(result.data, null);
    assert.equal(result.data.email, 'email@gmail.com');
  });

});

describe('findById', () => {

  const db = {
    setCollection: sinon.stub(),
    findOne: sinon.stub().resolves({
      'err': null,
      'data': {
        '_id': '65cb2250a10d1f8be67f5517',
        'email': 'email@gmail.com',
        'fullName': 'John Doe',
        'password': '2f658e9318691b9b89e97fe9c7706a56:340312dc133fddb35315d4a5baa3ac1e',
        'referralCode': '',
        'userId': '5430e14f-21a7-4d63-85f8-9267e4211b6f',
        'isConfirmed': true,
        'isAdmin': true
      }
    })
  };

  it('should return success', async() => {
    const query = new Query(db);
    const result = await query.findById('65cb2250a10d1f8be67f5517');
    assert.notEqual(result.data, null);
    assert.equal(result.data.email, 'email@gmail.com');
  });

});
