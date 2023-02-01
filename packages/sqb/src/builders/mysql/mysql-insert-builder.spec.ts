import 'reflect-metadata';

import { table } from '../../decorators/table';
import { getTableMetadata } from '../../utils';
import { MysqlInsertBuilder } from './mysql-insert-builder';

describe('MysqlInsertBuilder', () => {
  @table({ tableName: 'users' })
  class Users {
    userId: number;
    firstName: string;
    lastName: string;
  }

  const [u, users, uAlias] = getTableMetadata(Users, 'u', true);

  it('case1', () => {
    const sql = new MysqlInsertBuilder().insertInto(users, [u.firstName, u.lastName], 'fromSelect', (builder) => {
      return builder
        .select(u.firstName, u.lastName)
        .from(users)
        .where((eb) => eb.isTrue(u.userId, '=', 1));
    });

    console.log(sql.toString());
  });
});
