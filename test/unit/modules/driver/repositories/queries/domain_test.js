const sinon = require('sinon');
const assert = require('assert');
const User = require('../../../../../../src/modules/driver/repositories/queries/domain');
const query = require('../../../../../../src/modules/driver/repositories/queries/query');


describe('viewUser', () => {

  const db = {
    setCollection: sinon.stub()
  };

  const user = new User(db);

  it('should return user data without _id and password', async() => {

    const queryResult = {
      err: null,
      data: {
        '_id': '65cb2250a10d1f8be67f5517',
        'email': 'email@gmail.com',
        'fullName': 'John Doe',
        'password': '2f658e9318691b9b89e97fe9c7706a56:340312dc133fddb35315d4a5baa3ac1e',
        'referralCode': '',
        'userId': '5430e14f-21a7-4d63-85f8-9267e4211b6f',
        'isConfirmed': true,
        'isAdmin': true
      }
    };

    sinon.stub(query.prototype, 'findOneUser').resolves(queryResult);

    const userId = '65cb2250a10d1f8be67f5517';
    const result = await user.viewUser(userId);

    query.prototype.findOneUser.restore();

    assert.equal(result.data.email, 'email@gmail.com');
    assert.equal(result.data._id, undefined);
    assert.equal(result.data.password, undefined);
  });

  it('should handle errors from findOneUser', async() => {
    const error = new Error('Database error');
    sinon.stub(query.prototype, 'findOneUser').rejects(error);

    const userId = '65cb2250a10d1f8be67f5517';
    try {
      await user.viewUser(userId);
      assert.fail('Expected error was not thrown');
    } catch (err) {
      assert.equal(err, error);
    } finally {
      query.prototype.findOneUser.restore();
    }
  });

  it('should return error', async() => {

    const queryResult = {
      'err': true,
      'data': null
    };

    sinon.stub(query.prototype, 'findOneUser').resolves(queryResult);

    const userId = '65cb2250a10d1f8be67f5517';
    const result = await user.viewUser(userId);

    query.prototype.findOneUser.restore();
    assert.equal(result.err.message, 'Can not find user');

  });
});
