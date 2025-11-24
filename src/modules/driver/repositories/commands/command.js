const wrapper = require('all-in-one/helper/wrapper');

class Command {

  constructor(db) {
    this.db = db;
  }

  async createWorkLog(params = {}) {
    try {
      const query = `
        INSERT INTO work_logs (driver_id, work_date, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
      `;
      const values = [params.driverId, params.workDate];
      const result = await this.db.preparedQuery(query, values);

      if (result.err) {
        return result;
      }

      return wrapper.data({ id: result.data.insertId });
    } catch (err) {
      return wrapper.error(err);
    }
  }

  async insertActivity(params = {}) {
    try {
      const query = `
        INSERT INTO log_activities (work_log_id, work_time, active, status, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;
      const values = [
        params.workLogId,
        params.workTime,
        params.active ? 1 : 0,
        params.status
      ];

      const result = await this.db.preparedQuery(query, values);
      if (result.err) {
        return result;
      }

      return wrapper.data({ id: result.data.insertId });
    } catch (err) {
      return wrapper.error(err);
    }
  }

  async upsertDriverAvailability(params = {}) {
    try {
      const query = `
        INSERT INTO driver_availability (
          driver_id,
          socketId,
          is_available,
          status,
          last_seen_at,
          updated_at
        ) VALUES (?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          socketId    = VALUES(socketId),
          is_available = VALUES(is_available),
          status       = VALUES(status),
          last_seen_at = NOW(),
          updated_at   = NOW();
      `;

      const values = [
        params.driverId,
        params.socketId || null,
        params.isAvailable ? 1 : 0,
        params.status
      ];

      const result = await this.db.preparedQuery(query, values);
      if (result.err) return result;

      return wrapper.data({ affectedRows: result.data.affectedRows });
    } catch (err) {
      return wrapper.error(err);
    }
  }
}

module.exports = Command;
