import { edk } from '@ditsmod/core';
import { Type } from '@ts-stack/di';

class query {
  from<T extends Type<edk.AnyObj>, K extends keyof T['prototype'], F extends T['prototype'][K]>(
    model: T,
    table: K,
    ...fields: [F, ...F[]]
  ) {
    return `select ${fields.join(', ')} from ${table}`;
  }
}

class Tables {
  table1: 'field1' | 'field2' | 'field3';
  table2: 'field4' | 'field5' | 'field6';
}

new query().from(Tables, 'table1', 'field1', 'field2');
