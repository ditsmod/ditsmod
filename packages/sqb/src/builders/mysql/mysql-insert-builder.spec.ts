import 'reflect-metadata';

import { table } from '../../decorators/table';
import { getTableMetadata } from '../../utils';
import { MysqlInsertBuilder } from './mysql-insert-builder';

describe('MysqlInsertBuilder', () => {
  @table({ tableName: 'users' })
  class Users {
    userId: number;
    firstName: string;
    middleName: string;
    lastName: string;
  }

  const [u, users, uAlias] = getTableMetadata(Users, 'u', true);

  it('insert from values as array of arrays', () => {
    const sql = new MysqlInsertBuilder().insertFromValues(
      users,
      [u.firstName, u.middleName, u.lastName],
      [
        ["'Kostia'", "'middleName'", "'Tretiak'"],
        ["'FirstName'", "'middleName'", "'LastName'"],
      ]
    );

    console.log(sql.toString());
  });

  it('insert from values with builder', () => {
    const sql = new MysqlInsertBuilder().insertFromValues(users, [u.firstName, u.lastName], (builder) => {
      return builder.row("'Kostia'", "'Tretiak'").row("'FirstName'", "'LastName'");
    });

    console.log(sql.toString());
  });

  it('insert from select', () => {
    const sql = new MysqlInsertBuilder().insertFromSelect(users, [u.firstName, u.lastName], (builder) => {
      return builder
        .select(u.firstName, u.lastName)
        .from(users)
        .where((eb) => eb.isTrue(u.userId, '=', 1));
    });

    console.log(sql.toString());
  });
});
