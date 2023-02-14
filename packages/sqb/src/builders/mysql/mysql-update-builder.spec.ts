import 'reflect-metadata';

import { getTableMetadata } from '../../utils';
import { table } from '../../decorators/table';
import { MySqlUpdateBuilder } from './mysql-update-builder';

describe('MySqlUpdateBuilder', () => {
  @table({ tableName: 'users' })
  class Users {
    userId: number;
    id2: number;
    one: string;
    two: number;
    three: string;
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

  const [u, users_as_u, uAlias] = getTableMetadata(Users, 'u');
  const [p, posts_as_p, pAlias] = getTableMetadata(Posts, 'p');
  const [a, articles_as_a, aAlias] = getTableMetadata(Articles, 'a');

  it('should escape value', () => {
    const sql1 = new MySqlUpdateBuilder<Tables>()
      .$setEscape((value) => `'${value}'`)
      .where((eb) => eb.isTrue({ one: 'two' }));

    expect(`${sql1}`).toBe("\nwhere one = 'two'");
  });

  it('should works all features', () => {
    const sql1 = new MySqlUpdateBuilder<Tables>()
      .update('users as u')
      .update('inner_select', (selectBuilder) => selectBuilder.select('one').from('some_table'))
      .join(posts_as_p, (jb) => jb.on(p.five, '=', u.two).and(p.five, '>', 6).or(u.two, '<', 8))
      .join(
        'm',
        (s) => s.select('one').from('table1'),
        (jb) => jb.on('m.five', '=', u.two).and('m.five', '>', 6).or('m.two', '<', 8)
      )
      .leftJoin(articles_as_a, (jb) => jb.on(p.four, '=', u.two).or(a.seven, '=', 7))
      .$if(true, (selectBuilder) => {
        return selectBuilder.rightJoin(users_as_u, (joinBuilder) => {
          return joinBuilder.on(u.one, '=', p.userId);
        });
      })
      .$if(false, (selectBuilder) => {
        return selectBuilder.rightJoin(users_as_u, (joinBuilder) => {
          return joinBuilder.on(u.one, '=', p.userId);
        });
      })
      .join(articles_as_a, (jb) => jb.using([Posts, Users], 'userId', 'id2'))
      .set<Partial<Users>>({ one: 'someone', two: 1 })
      .set('other', '=', 'some_other')
      .set('other2 = some_other2')
      .where((eb) => eb.isTrue(p.six, '>', 6).and(p.six, '<', 10))
      .orderBy(a.seven, u.one)
      .limit(1, 54);

    const expectSql = `update users as u, (
select
  one
from some_table
) as inner_select
join posts as p
  on p.five = u.two
    and p.five > 6
    or u.two < 8
join (
select
  one
from table1
) as m
  on m.five = u.two
    and m.five > 6
    or m.two < 8
left join articles as a
  on p.four = u.two
    or a.seven = 7
right join users as u
  on u.one = p.userId
join articles as a
  using(userId, id2)
set one = someone,
  two = 1,
  other = some_other,
  other2 = some_other2
where p.six > 6
  and p.six < 10
order by
  a.seven,
  u.one
limit 1, 54`;

    expect(`${sql1}`).toBe(expectSql);
  });
});