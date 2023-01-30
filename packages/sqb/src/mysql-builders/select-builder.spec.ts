import 'reflect-metadata';

import { setAlias } from '../utils';
import { SelectBuilder } from '../mysql-builders/select-builder';
import { table } from '../decorators/table';

describe('SelectBuilder', () => {
  @table({ tableName: 'table_1' })
  class Table1 {
    id: number;
    id2: number;
    one: string;
    two: number;
    three: string;
  }

  @table({ tableName: 'table_2' })
  class Table2 {
    id: number;
    id2: number;
    four: string;
    five: number;
    six: string;
  }

  @table({ tableName: 'table_3' })
  class Table3 {
    seven: string;
  }

  const t1: Pick<Table1, 'one' | 'two'> = setAlias(Table1, 't1');
  const t2 = setAlias(Table2, 't2');
  const t3 = setAlias(Table3, 't3');

  it('should not store state', () => {
    const sb = new SelectBuilder();
    expect(`${sb}`).toBe('');
    expect(`${sb.select(t1.one, t1.two, t2.six, t3.seven)}`).toBe(`select
  t1.one,
  t1.two,
  t2.six,
  t3.seven`);
    expect(`${sb}`).toBe('');
    expect(`${sb.from(t3)}`).toBe('\nfrom table_3 as t3');
    expect(`${sb}`).toBe('');
    const expectedJoin = '\njoin table_2 as t2\n  on t2.five = t1.two';
    expect(`${sb.join(t2, (jb) => jb.on(`${t2.five} = ${t1.two}`))}`).toBe(expectedJoin);
    expect(`${sb}`).toBe('');
    expect(`${sb.where(`${t2.four} = ${t1.two}`)}`).toBe('\nwhere t2.four = t1.two');
    expect(`${sb}`).toBe('');
    expect(`${sb.orderBy(t3.seven, t1.one)}`).toBe('\norder by\n  t3.seven,\n  t1.one');
    expect(`${sb}`).toBe('');
    expect(`${sb.groupBy(t1.two)}`).toBe('\ngroup by\n  t1.two');
    expect(`${sb}`).toBe('');
    expect(`${sb.having(`${t1.two} > 1`, `${t2.six} > 6`)}`).toBe('\nhaving t1.two > 1\n  and t2.six > 6');
    expect(`${sb}`).toBe('');
    expect(`${sb.limit(1, 54)}`).toBe('\nlimit 1, 54');
    expect(`${sb}`).toBe('');
  });

  it('should works all features', () => {
    const sql1 = new SelectBuilder()
      .select(t1.one, t1.two, t2.six, t3.seven)
      .from(t1)
      .join(t2, (jb) => jb.on(`${t2.five} = ${t1.two}`).and(`${t2.five} > 6`).or(`${t1.two} < 8`))
      .leftJoin(t3, (jb) => jb.on(`${t2.four} = ${t1.two}`).or(`${t3.seven} = 7`))
      .$if(true, (sb) => {
        return sb.rightJoin(t1, (jb) => {
          return jb.on(`${t1.one} = ${t2.id}`);
        });
      })
      .$if(false, (sb) => {
        return sb.rightJoin(t1, (jb) => {
          return jb.on(`${t1.one} = ${t2.id}`);
        });
      })
      .join(t3, (jb) => jb.using([Table2, Table1], 'id', 'id2'))
      .where(`${t2.six} > 6`, `${t2.six} < 10`)
      .orderBy(t3.seven, t1.one)
      .groupBy(t1.two)
      .having(`${t1.two} > 1`, `${t2.six} > 6`)
      .limit(1, 54)
      ;

    const expectSql = `select
  t1.one,
  t1.two,
  t2.six,
  t3.seven
from table_1 as t1
join table_2 as t2
  on t2.five = t1.two
    and t2.five > 6
    or t1.two < 8
left join table_3 as t3
  on t2.four = t1.two
    or t3.seven = 7
right join table_1 as t1
  on t1.one = t2.id
join table_3 as t3
  using(id, id2)
where t2.six > 6
  and t2.six < 10
order by
  t3.seven,
  t1.one
group by
  t1.two
having t1.two > 1
  and t2.six > 6
limit 1, 54`;

    expect(`${sql1}`).toBe(expectSql);
  });
});
