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

  @table({ tableName: 'posts' })
  class Posts {
    postId: number;
    authodId: number;
    postBody: string;
  }

  const [u, users_as_u, uAlias] = getTableMetadata(Users, 'u');
  const [p, posts_as_p, pAlias] = getTableMetadata(Posts, 'p');

  it('case1', () => {
    const sql = MysqlInsertBuilder.insertInto(users_as_u, [u.firstName, u.lastName], (builder) => {
      return builder
        .select(u.firstName, u.lastName)
        .from(users_as_u)
        .where((eb) => eb.isTrue(u.userId, '=', 1));
    });

    console.log(sql.toString());
  });
});
