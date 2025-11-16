const wrapper = require('all-in-one/helper/wrapper');

class Query {

  constructor(db) {
    this.db = db;
  }

  async findWorkLog(params = {}) {
    try {
      const conditions = [];
      const values = [];

      if (params.id) {
        conditions.push('id = ?');
        values.push(params.id);
      }

      if (params.driverId) {
        conditions.push('driver_id = ?');
        values.push(params.driverId);
      }

      if (params.workDate) {
        conditions.push('work_date = ?');
        values.push(params.workDate);
      }

      if (conditions.length === 0) {
        return wrapper.error(new Error('No parameters provided to find work log'));
      }

      const whereClause = conditions.join(' AND ');
      const query = `
        SELECT id, driver_id AS driverId, work_date AS workDate, created_at AS createdAt
        FROM work_logs
        WHERE ${whereClause}
        LIMIT 1;
      `;

      const result = await this.db.preparedQuery(query, values);
      if (result.err) {
        return result;
      }
      if (result.data.length === 0) {
        return wrapper.error(new Error('WorkLog not found'));
      }

      return wrapper.data(result.data[0]);
    } catch (err) {
      return wrapper.error(err);
    }
  }

  async findActivitiesByWorkLogId(workLogId) {
    try {
      const query = `
        SELECT id, work_time AS workTime, active, status, created_at AS createdAt
        FROM log_activities
        WHERE work_log_id = ?
        ORDER BY work_time ASC
      `;
      const result = await this.db.preparedQuery(query, [workLogId]);

      if (result.err) {
        return result;
      }

      return wrapper.data(result.data);
    } catch (err) {
      return wrapper.error(err);
    }
  }

  async findOneUser(params = {}) {
    const conditions = [];
    const values = [];

    if (params.mobileNumber) {
      conditions.push('mobile_number = ?');
      values.push(params.mobileNumber);
    }

    if (params.email) {
      conditions.push('email = ?');
      values.push(params.email);
    }

    if (params.userId) {
      conditions.push('user_id = ?');
      values.push(params.userId);
    }

    if (conditions.length === 0) {
      return wrapper.error(new Error('No parameters provided to find user'));
    }

    // additional dynamic filters
    if (params.fullName) {
      conditions.push('full_name LIKE ?');
      values.push(`%${params.fullName}%`);
    }

    if (params.isMitra !== undefined) {
      conditions.push('isMitra = ?');
      values.push(params.isMitra ? 1 : 0);
    }

    if (params.isVerified !== undefined) {
      conditions.push('isVerified = ?');
      values.push(params.isVerified ? 1 : 0);
    }

    if (params.isCompleted !== undefined) {
      conditions.push('isCompleted = ?');
      values.push(params.isCompleted ? 1 : 0);
    }

    if (params.excludeUserId) {
      conditions.push('user_id != ?');
      values.push(params.excludeUserId);
    }

    const whereClause = conditions.join(' AND ');
    const query = `
      SELECT mobile_number, email, full_name, user_id, password, isMitra, isVerified, isCompleted
      FROM users
      WHERE ${whereClause}
      LIMIT 1;
    `;
    const result = await this.db.preparedQuery(query, values);
    if (result.err) {
      return result;
    }
    if (result.data.length === 0) {
      return wrapper.error(new Error('User not found'));
    }
    return wrapper.data(result.data[0]);
  }

  async findById(id) {
    const query = `
    SELECT user_id, full_name, email, mobile_number
    FROM users
    WHERE user_id = ?
    LIMIT 1;
  `;
    const result = await this.db.preparedQuery(query, [id]);
    return result;
  }

}

module.exports = Query;
