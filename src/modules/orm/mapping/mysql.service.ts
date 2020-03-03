import { createPool, Pool, PoolConnection } from 'mysql';
import { Injectable } from '@ts-stack/di';

import { Logger } from '../../../types/logger';

const {
  MYSQL_HOST: host,
  MYSQL_PORT: port,
  MYSQL_USER: user,
  MYSQL_PASSWORD: password,
  MYSQL_DATABASE: database
} = process.env;

@Injectable()
export class MysqlService {
  private pool: Pool;

  constructor(private log: Logger) {}

  getConnection(): Promise<PoolConnection> {
    return new Promise((resolve, reject) => {
      if (!this.pool) {
        this.pool = createPool({ host, port: +port, user, password, database });
      }

      this.pool.getConnection((err, connection) => {
        if (err) {
          reject(err);

          if (err.fatal) {
            this.log.fatal('getConnection():', err);
          } else {
            this.log.error('getConnection():', err);
          }
        } else {
          resolve(connection);
        }
      });
    });
  }

  async query(sql: string, params?: any): Promise<any> {
    const connection = await this.getConnection();
    return new Promise((resolve, reject) => {
      connection.query(sql, params, (err, rows, fields) => {
        /**
         * Release connections so they can be used for other requests.
         */
        connection.release();
        if (err) {
          reject(err);
          if (err.fatal) {
            this.log.fatal('query():', err);
          } else {
            this.log.error('query():', err);
          }
        } else {
          resolve(rows);
        }
      });
    });
  }
}
