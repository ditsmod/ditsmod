import { jest } from '@jest/globals';

import { table } from '#decorators/table.js';
import { getTableMetadata } from '../../utils.js';
import { MySqlSelectBuilder } from './mysql-select-builder.js';

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

  it('should apply and execute "run" callback', () => {
    const cb = jest.fn();
    const sql1 = new MySqlSelectBuilder<Tables>().$setHook(cb).select('field1');
    const opts = { one: 'three' };
    const args = [1, 2];

    expect(() => sql1.$runHook(opts, ...args)).not.toThrow();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('select\n  field1', opts, ...args);

    expect(() => sql1.$if(true, sb => sb).$runHook(opts, ...args)).not.toThrow();
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('should not store state', () => {
    const sb = new MySqlSelectBuilder<Tables>();
    expect(`${sb}`).toBe('');
    expect(`${sb.select(u.one, u.two, p.six, a.seven)}`).toBe(`select
  u.one,
  u.two,
  p.six,
  a.seven`);
    expect(`${sb}`).toBe('');
    expect(`${sb.from('articles as a')}`).toBe('\nfrom articles as a');
    expect(`${sb}`).toBe('');
    const expectedJoin = '\njoin posts as p\n  on p.five = u.two';
    expect(`${sb.join('posts as p', (jb) => jb.on(p.five, '=', u.two))}`).toBe(expectedJoin);
    expect(`${sb}`).toBe('');
    expect(`${sb.where((eb) => eb.isTrue(p.four, '=', u.two))}`).toBe('\nwhere p.four = u.two');
    expect(`${sb.where((eb) => eb.isTrue({ four: 'two' }))}`).toBe('\nwhere four = two');
    expect(`${sb.$setEscape(value => `'${value}'`).where((eb) => eb.isTrue({ four: 'two' }))}`).toBe("\nwhere four = 'two'");
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

  it('internal "and" "or" expressions', () => {
    const sb = new MySqlSelectBuilder<Tables>();

    const exp = `${sb.where((eb) =>
      eb.isTrue({ four: 'two' }).and((b) => {
        return b.or('p.six = 1').or('p.six = 2');
      })
    )}`;
    const actual = `
where four = two
  and (
    p.six = 1
      or p.six = 2
  )`;
    expect(exp).toBe(actual);
  });

  it('should works all features', () => {
    const sql1 = new MySqlSelectBuilder<Tables>()
      .select(u.one, u.two, p.six, a.seven)
      .from('users as u')
      .from('alias_lvl1', (b1) => {
        return b1.select('one').from('alias_lvl2', (b2) => {
          return b2.select('one', 'three').from('other');
        });
      })
      .join('posts as p', (jb) => jb.on(p.five, '=', u.two).and(p.five, '>', 6).or(u.two, '<', 8))
      .join(
        'm',
        (s) => s.select('one').from('table1'),
        (jb) => jb.on('m.five', '=', u.two).and('m.five', '>', 6).or('m.two', '<', 8)
      )
      .leftJoin('articles as a', (jb) => jb.on(p.four, '=', u.two).or(a.seven, '=', 7))
      .$if(true, (sb) => {
        return sb.rightJoin('users as u', (jb) => {
          return jb.on(u.one, '=', p.userId);
        });
      })
      .$if(false, (sb) => {
        return sb.rightJoin('users as u', (jb) => {
          return jb.on(u.one, '=', p.userId);
        });
      })
      .join('articles as a', (jb) => jb.using([Posts, Users], 'userId', 'id2'))
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
from users as u, (
select
  one
from (
select
  one,
  three
from other
) as alias_lvl2
) as alias_lvl1
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
