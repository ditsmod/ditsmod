import 'reflect-metadata';

import { getTableMetadata } from '../../utils';
import { MySqlSelectBuilder } from './mysql-select-builder';
import { table } from '../../decorators/table';

describe('MySqlSelectBuilder', () => {
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

  it('aliases works as expected', () => {
    expect(`${u}`).toBe('users as u');
    expect(`${p}`).toBe('posts as p');
    expect(`${a}`).toBe('articles as a');
    expect(users_as_u).toBe('users as u');
    expect(posts_as_p).toBe('posts as p');
    expect(articles_as_a).toBe('articles as a');
    expect(uAlias).toBe('u');
    expect(pAlias).toBe('p');
    expect(aAlias).toBe('a');
  });

  it('should not store state', () => {
    const sb = new MySqlSelectBuilder();
    expect(`${sb}`).toBe('');
    expect(`${sb.select(u.one, u.two, p.six, a.seven)}`).toBe(`select
  u.one,
  u.two,
  p.six,
  a.seven`);
    expect(`${sb}`).toBe('');
    expect(`${sb.from(articles_as_a)}`).toBe('\nfrom articles as a');
    expect(`${sb}`).toBe('');
    const expectedJoin = '\njoin posts as p\n  on p.five = u.two';
    expect(`${sb.join(posts_as_p, (jb) => jb.on(p.five, '=', u.two))}`).toBe(expectedJoin);
    expect(`${sb}`).toBe('');
    expect(`${sb.where((eb) => eb.isTrue(p.four, '=', u.two))}`).toBe('\nwhere p.four = u.two');
    expect(`${sb}`).toBe('');
    expect(`${sb.orderBy(a.seven, u.one)}`).toBe('\norder by\n  a.seven,\n  u.one');
    expect(`${sb}`).toBe('');
    expect(`${sb.groupBy(u.two)}`).toBe('\ngroup by\n  u.two');
    expect(`${sb}`).toBe('');
    const expectedHaving = '\nhaving u.two > 1\n  and p.six > 6';
    expect(`${sb.having((eb) => eb.isTrue(u.two, '>', 1).and(p.six, '>', 6))}`).toBe(expectedHaving);
    expect(`${sb}`).toBe('');
    expect(`${sb.limit(1, 54)}`).toBe('\nlimit 1, 54');
    expect(`${sb}`).toBe('');
  });

  it('should works all features', () => {
    const sql1 = new MySqlSelectBuilder()
      .select(u.one, u.two, p.six, a.seven)
      .from(users_as_u)
      .join(posts_as_p, (jb) => jb.on(p.five, '=', u.two).and(p.five, '>', 6).or(u.two, '<', 8))
      .leftJoin(articles_as_a, (jb) => jb.on(p.four, '=', u.two).or(a.seven, '=', 7))
      .$if(true, (sb) => {
        return sb.rightJoin(users_as_u, (jb) => {
          return jb.on(u.one, '=', p.userId);
        });
      })
      .$if(false, (sb) => {
        return sb.rightJoin(users_as_u, (jb) => {
          return jb.on(u.one, '=', p.userId);
        });
      })
      .join(articles_as_a, (jb) => jb.using([Posts, Users], 'userId', 'id2'))
      .where((eb) => eb.isTrue(p.six, '>', 6).and(p.six, '<', 10))
      .orderBy(a.seven, u.one)
      .groupBy(u.two)
      .having((eb) => eb.isTrue(u.two, '>', 1).and(p.six, '>', 6))
      .limit(1, 54);

    const expectSql = `select
  u.one,
  u.two,
  p.six,
  a.seven
from users as u
join posts as p
  on p.five = u.two
    and p.five > 6
    or u.two < 8
left join articles as a
  on p.four = u.two
    or a.seven = 7
right join users as u
  on u.one = p.userId
join articles as a
  using(userId, id2)
where p.six > 6
  and p.six < 10
group by
  u.two
having u.two > 1
  and p.six > 6
order by
  a.seven,
  u.one
limit 1, 54`;

    expect(`${sql1}`).toBe(expectSql);
  });
});
