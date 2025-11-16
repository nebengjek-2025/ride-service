
const commonHelper = require('all-in-one');
const mongoConnection = require('./connection');

const wrapper = commonHelper.Wrapper;
const errorQueryMessage = 'Error querying MongoDB';
const errorEmptyMessage = 'Data Not Found Please Try Another Input';
const ctx = 'Database.MongoDB';

class DB {

  constructor(config) {
    this.config = config;
  }

  async getDatabase(collectionName) {
    const result = await mongoConnection.getConnection(this.config);
    const cacheConnection = result.data.db;
    const connection = cacheConnection.db();
    return connection.collection(collectionName);
  }

  async findOne(parameter, collectionName) {
    try {
      const db = await this.getDatabase(collectionName);
      const result = await db.findOne(parameter);
      if (!result) {
        /* istanbul ignore next */
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result);
    } catch (err) {
      commonHelper.log(['ERROR'],{ctx, message:errorQueryMessage, scope:'findOne', error:`${err}`});
      return wrapper.error(errorQueryMessage);
    }
  }

  async insertOne(document, collectionName) {
    try {
      const db = await this.getDatabase(collectionName);
      const result = await db.insertOne(document);
      if (!result) {
        /* istanbul ignore next */
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result);
    } catch (err) {
      commonHelper.log(['ERROR'],{ctx, message:errorQueryMessage, scope:'insertOne', error:`${err}`});
      return wrapper.error(errorQueryMessage);
    }
  }

  async updateOne(parameter, updateQuery, collectionName) {
    try {
      const document = { $set: { ...updateQuery } };
      const db = await this.getDatabase(collectionName);
      const result = await db.updateOne(parameter, document);
      if (!result) {
        /* istanbul ignore next */
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result);
    } catch (err) {
      commonHelper.log(['ERROR'],{ctx, message:errorQueryMessage, scope:'updateOne', error:`${err}`});
      return wrapper.error(errorQueryMessage);
    }
  }

  async countData(parameter, collectionName) {
    try {
      const db = await this.getDatabase(collectionName);
      const result = await db.countDocuments(parameter);
      if (!result) {
        /* istanbul ignore next */
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result);
    } catch (err) {
      commonHelper.log(['ERROR'],{ctx, message:errorQueryMessage, scope:'countData', error:`${err}`});
      return wrapper.error(errorQueryMessage);
    }
  }

  async findMany(parameter, projection, sort, page, limit, collectionName) {
    try {
      const db = await this.getDatabase(collectionName);
      const skip = limit * (page - 1);
      const result = await db.find(parameter, { projection }).sort(sort).limit(limit).skip(skip).toArray();
      if (!result) {
        /* istanbul ignore next */
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result);
    } catch (err) {
      commonHelper.log(['ERROR'],{ctx, message:errorQueryMessage, scope:'findMany', error:`${err}`});
      return wrapper.error(errorQueryMessage);
    }
  }

}

module.exports = DB;
