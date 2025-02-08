
import { table } from '#decorators/table.js';
import { getTableMetadata } from '../../utils.js';
import { MysqlInsertBuilder } from './mysql-insert-builder.js';

describe('MysqlInsertBuilder', () => {
  @table({ tableName: 'users' })
  class Users {
    userId: number;
    firstName: string;
    middleName: string;
    lastName: string;
  }

  @table({ tableName: 'posts' })
  class Posts {
    userId: number;
    id2: number;
    four: string;
    five: number;
    six: string;
  }

  @table({ tableName: 'articles' })
  class Articles {
    seven: object;
  }

  interface Tables {
    users: Users;
    posts: Posts;
    articles: Articles;
    other: unknown;
    table1: unknown;
  }

  const [u, users, uAlias] = getTableMetadata(Users, 'u', true);

  it('insert from set', () => {
    const sql = new MysqlInsertBuilder<Tables>().insertFromSet('users', {
      firstName: "'Kostia'",
      lastName: "'Tretiak'",
    });

    expect(sql.toString()).toBe(`insert into users
set firstName = 'Kostia', lastName = 'Tretiak'`);
  });

  it('insert from set with "ON DUPLICATE KEY UPDATE"', () => {
    const sql = new MysqlInsertBuilder<Tables>()
      .insertFromSet('users', {
        firstName: "'Kostia'",
        lastName: "'Tretiak'",
      })
      .onDuplicateKeyUpdate({ firstName: "'Mostia'" });

    expect(sql.toString()).toBe(`insert into users
set firstName = 'Kostia', lastName = 'Tretiak'
on duplicate key update firstName = 'Mostia'`);
  });

  it('insert from set with "ON DUPLICATE KEY UPDATE" with alias', () => {
    const sql = new MysqlInsertBuilder<Tables>()
      .insertFromSet('users', {
        firstName: "'Kostia'",
        lastName: "'Tretiak'",
      })
      .onDuplicateKeyUpdate('new', { firstName: "'Mostia'" });

    expect(sql.toString()).toBe(`insert into users
set firstName = 'Kostia', lastName = 'Tretiak' as new
on duplicate key update firstName = 'Mostia'`);
  });

  it('insert from values as array of arrays', () => {
    const sql = new MysqlInsertBuilder<Tables>().insertFromValues(
      'users',
      ['firstName', 'middleName', 'lastName'],
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

  it('insert from values as array of arrays with "ON DUPLICATE KEY UPDATE" and alias', () => {
    const sql = new MysqlInsertBuilder<Tables>()
      .insertFromValues(
        'users',
        ['firstName', 'middleName', 'lastName'],
        [
          ["'Kostia'", "'middleName'", "'Tretiak'"],
          ["'FirstName'", "'middleName'", "'LastName'"],
        ]
      )
      .onDuplicateKeyUpdate('new', { firstName: 'Mostia' });

    expect(sql.toString()).toBe(`insert into users (
  firstName,
  middleName,
  lastName
)
values ('Kostia', 'middleName', 'Tretiak'), ('FirstName', 'middleName', 'LastName') as new
on duplicate key update firstName = Mostia`);
  });

  it('insert from values with builder', () => {
    const sql = new MysqlInsertBuilder<Tables>().insertFromValues('users', ['firstName', 'lastName'], (builder) => {
      return builder.row("'Kostia'", "'Tretiak'").row("'FirstName'", "'LastName'");
    });

    expect(sql.toString()).toBe(`insert into users (
  firstName,
  lastName
)
values ('Kostia', 'Tretiak'), ('FirstName', 'LastName')`);
  });

  it('insert from select', () => {
    const sql = new MysqlInsertBuilder<Tables>().insertFromSelect('users', ['firstName', 'lastName'], (builder) => {
      return builder
        .select(u.firstName, u.lastName)
        .from('users')
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

  it('insert from select with "where" and escape value in it', () => {
    const sql = new MysqlInsertBuilder<Tables>()
      .$setEscape((value) => `'${value}'`)
      .insertFromSelect('users', ['firstName', 'lastName'], (builder) => {
        return builder
          .select(u.firstName, u.lastName)
          .from('users')
          .where((eb) => eb.isTrue({ firstName: 'other-name' }));
      });

    expect(sql.toString()).toBe(`insert into users (
  firstName,
  lastName
)
select
  firstName,
  lastName
from users
where firstName = 'other-name'`);
  });

  it('insert from select with "ON DUPLICATE KEY UPDATE" and alias', () => {
    const sql = new MysqlInsertBuilder<Tables>()
      .insertFromSelect('users', ['firstName', 'lastName'], (builder) => {
        return builder
          .select(u.firstName, u.lastName)
          .from('users')
          .where((eb) => eb.isTrue(u.userId, '=', 1));
      })
      .onDuplicateKeyUpdate('new', { firstName: 'Mostia' });

    expect(sql.toString()).toBe(`insert into users (
  firstName,
  lastName
)
select * from (
select
  firstName,
  lastName
from users
where userId = 1
) as new
on duplicate key update firstName = Mostia`);
  });
});
