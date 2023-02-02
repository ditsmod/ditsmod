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

  it('insert from set', () => {
    const sql = new MysqlInsertBuilder().insertFromSet<Partial<Users>>(users, {
      firstName: "'Kostia'",
      lastName: "'Tretiak'",
    });

    expect(sql.toString()).toBe(`insert into users
set firstName = 'Kostia', lastName = 'Tretiak'`);
  });

  it('insert from values as array of arrays', () => {
    const sql = new MysqlInsertBuilder().insertFromValues(
      users,
      [u.firstName, u.middleName, u.lastName],
      [
        ["'Kostia'", "'middleName'", "'Tretiak'"],
        ["'FirstName'", "'middleName'", "'LastName'"],
      ]
    );

    expect(sql.toString()).toBe(`insert into users (
  firstName,
  middleName,
  lastName
)
values ('Kostia', 'middleName', 'Tretiak'), ('FirstName', 'middleName', 'LastName')`);
  });

  it('insert from values with builder', () => {
    const sql = new MysqlInsertBuilder().insertFromValues(users, [u.firstName, u.lastName], (builder) => {
      return builder.row("'Kostia'", "'Tretiak'").row("'FirstName'", "'LastName'");
    });

    expect(sql.toString()).toBe(`insert into users (
  firstName,
  lastName
)
values ('Kostia', 'Tretiak'), ('FirstName', 'LastName')`);
  });

  it('insert from select', () => {
    const sql = new MysqlInsertBuilder().insertFromSelect(users, [u.firstName, u.lastName], (builder) => {
      return builder
        .select(u.firstName, u.lastName)
        .from(users)
        .where((eb) => eb.isTrue(u.userId, '=', 1));
    });

    expect(sql.toString()).toBe(`insert into users (
  firstName,
  lastName
)
select
  firstName,
  lastName
from users
where userId = 1`);
  });
});
