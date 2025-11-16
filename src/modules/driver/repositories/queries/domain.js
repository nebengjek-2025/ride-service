
const commonHelper = require('all-in-one');
const Query = require('./query');

const wrapper = commonHelper.Wrapper;
const { NotFoundError } = commonHelper.Error;

class User {

  constructor(db){
    this.query = new Query(db);
  }

  async viewUser(userId) {
    const user = await this.query.findOneUser({userId});
    if (user.err) {
      return wrapper.error(new NotFoundError('Can not find user'));
    }
    const { data } = user;
    delete data._id;
    delete data.password;
    return wrapper.data(data);
  }

}

module.exports = User;
