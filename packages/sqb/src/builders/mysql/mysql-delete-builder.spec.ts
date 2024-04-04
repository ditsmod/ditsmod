import { table } from '#decorators/table.js';
import { getTableMetadata } from '../../utils.js';
import { MySqlDeleteBuilder } from './mysql-delete-builder.js';

describe('MySqlDeleteBuilder', () => {
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

  const [u, users_as_u, uAlias] = getTableMetadata(Users, 'u');
  const [p, posts_as_p, pAlias] = getTableMetadata(Posts, 'p');
  const [a, articles_as_a, aAlias] = getTableMetadata(Articles, 'a');

  interface Tables {
    users: Users;
    posts: Posts;
    articles: Articles;
  }

  it('should works all features', () => {
    const sql1 = new MySqlDeleteBuilder<Tables>()
      .delete(uAlias)
      .from('inner_select', (selectBuilder) => selectBuilder.select('one').from('some_table'))
      .using(users_as_u)
      .join('posts as p', (jb) => jb.on(p.five, '=', u.two).and(p.five, '>', 6).or(u.two, '<', 8))
      .join(
        'm',
        (s) => s.select('one').from('table1'),
        (jb) => jb.on('m.five', '=', u.two).and('m.five', '>', 6).or('m.two', '<', 8),
      )
      .leftJoin('articles as a', (jb) => jb.on(p.four, '=', u.two).or(a.seven, '=', 7))
      .$if(true, (selectBuilder) => {
        return selectBuilder.rightJoin('users as u', (joinBuilder) => {
          return joinBuilder.on(u.one, '=', p.userId);
        });
      })
      .$if(false, (selectBuilder) => {
        return selectBuilder.rightJoin('users as u', (joinBuilder) => {
          return joinBuilder.on(u.one, '=', p.userId);
        });
      })
      .join('articles as a', (jb) => jb.using([Posts, Users], 'userId', 'id2'))
      .where((eb) => eb.isTrue(p.six, '>', 6).and(p.six, '<', 10))
      .orderBy(a.seven, u.one)
      .limit(1, 54);

    const expectSql = `delete u
from (
select
  one
from some_table
) as inner_select
using users as u
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
where p.six > 6
  and p.six < 10
order by
  a.seven,
  u.one
limit 1, 54`;

    expect(`${sql1}`).toBe(expectSql);
  });
});
