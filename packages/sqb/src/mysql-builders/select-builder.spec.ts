import 'reflect-metadata';

import { setAlias } from '../utils';
import { SelectBuilder } from '../mysql-builders/select-builder';
import { table } from '../decorators/table';

describe('SelectBuilder', () => {
  @table({ tableName: 'table_1' })
  class Table1 {
    id: number;
    one: string;
    two: number;
    three: string;
  }

  @table({ tableName: 'table_2' })
  class Table2 {
    id: number;
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

  it('case1', () => {
    const sql1 = new SelectBuilder()
      .select(t1.one, t1.two, t2.six, t3.seven)
      .from(t1)
      .join(t2, (jb) => jb.on(`${t2.five} = ${t1.two}`).and(`${t2.five} > 6`).or(`${t1.two} < 8`))
      .join(t3, (jb) => jb.on(`${t2.four} = ${t1.two}`).or(`${t3.seven} = 7`))
      .$if(true, (sb) => {
        return sb.join(t1, (jb) => {
          return jb.on(`${t1.one} = ${t2.id}`);
        });
      })
      // .join(t3, (jb) => jb.using([Table2, Table1], 'id'))
      .where(`${t2.six} > 6`, `${t2.six} < 10`);

    console.log(`${sql1}`);
  });
});
