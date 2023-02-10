import { RunCallback } from '../types';
import { MySqlSelectBuilder } from './mysql-select-builder';

class InsertQuery {
  table: string = '';
  fields: string[] = [];
  set: string[] = [];
  values: string[] = [];
  ignore: boolean = false;
  selectQuery: string = '';
  alias: string = '';
  onDuplicateKeyUpdate: string[] = [];
  run: (query: string, ...args: any[]) => any = (query) => query;
  escape: (value: any) => string = (value) => value;
}

export class MysqlInsertBuilder<T extends object = object> implements RunCallback {
  #query = new InsertQuery();

  protected mergeQuery(query: Partial<InsertQuery>) {
    this.#query.table = query.table || '';
    this.#query.fields = query.fields || [];
    this.#query.set.push(...(query.set || []));
    this.#query.values.push(...(query.values || []));
    this.#query.ignore = query.ignore || false;
    this.#query.selectQuery = query.selectQuery || '';
    this.#query.alias = query.alias || '';
    this.#query.onDuplicateKeyUpdate.push(...(query.onDuplicateKeyUpdate || []));
    this.#query.escape = query.escape || this.#query.escape;
    this.#query.run = query.run || this.#query.run;
    return this.#query;
  }

  insertFromSet<T extends object>(table: string, obj: T): MysqlInsertBuilder<T> {
    const insertBuilder = new MysqlInsertBuilder<T>();
    const insertQuery = insertBuilder.mergeQuery(this.#query);
    insertQuery.table = table;
    for (const prop in obj) {
      insertQuery.set.push(`${prop} = ${this.#query.escape(obj[prop])}`);
    }
    return insertBuilder;
  }

  insertFromValues<T extends object>(
    table: string,
    fields: (keyof T)[],
    values: (string | number)[][]
  ): MysqlInsertBuilder<T>;
  insertFromValues<T extends object>(
    table: string,
    fields: (keyof T)[],
    valuesCallback: (valuesBuilder: ValuesBuilder) => ValuesBuilder
  ): MysqlInsertBuilder<T>;
  insertFromValues<T extends object>(
    table: string,
    fields: Extract<keyof T, string>[],
    arrayOrCallback: (string | number)[][] | ((valuesBuilder: ValuesBuilder) => ValuesBuilder)
  ) {
    const insertBuilder = new MysqlInsertBuilder<T>();
    const insertQuery = insertBuilder.mergeQuery(this.#query);
    insertQuery.table = table;
    insertQuery.fields.push(...fields);
    let values: (string | number)[][];
    if (Array.isArray(arrayOrCallback)) {
      values = arrayOrCallback;
    } else {
      values = [...arrayOrCallback(new ValuesBuilder())];
    }
    values.forEach((tuple) => insertQuery.values.push(`(${tuple.join(', ')})`));
    return insertBuilder;
  }

  insertFromSelect<T extends object>(
    table: string,
    fields: Extract<keyof T, string>[],
    selectCallback: (selectBuilder: MySqlSelectBuilder) => MySqlSelectBuilder
  ): MysqlInsertBuilder<T> {
    const insertBuilder = new MysqlInsertBuilder<T>();
    const insertQuery = insertBuilder.mergeQuery(this.#query);
    insertQuery.table = table;
    insertQuery.fields.push(...fields);
    insertQuery.selectQuery = selectCallback(new MySqlSelectBuilder()).toString();
    return insertBuilder;
  }

  ignore() {
    const insertBuilder = new MysqlInsertBuilder<T>();
    insertBuilder.mergeQuery(this.#query).ignore = true;
    return insertBuilder;
  }

  onDuplicateKeyUpdate(obj: Partial<T>): MysqlInsertBuilder<T>;
  onDuplicateKeyUpdate(alias: string, obj: Partial<T>): MysqlInsertBuilder<T>;
  onDuplicateKeyUpdate(aliasOrObj: string | Partial<T>, obj?: Partial<T>) {
    const insertBuilder = new MysqlInsertBuilder<T>();
    const insertQuery = insertBuilder.mergeQuery(this.#query);
    if (obj) {
      insertQuery.alias = aliasOrObj as string;
    } else {
      obj = aliasOrObj as Partial<T>;
    }
    for (const prop in obj) {
      insertQuery.onDuplicateKeyUpdate.push(`${prop} = ${this.#query.escape(obj[prop])}`);
    }
    return insertBuilder;
  }

  $if(condition: any, insertCallback: (updatebuilder: MysqlInsertBuilder) => MysqlInsertBuilder) {
    const b1 = new MysqlInsertBuilder<T>();
    b1.mergeQuery(this.#query);
    if (condition) {
      const b2 = insertCallback(new MysqlInsertBuilder<T>());
      b1.mergeQuery(b2.#query);
    }
    return b1;
  }

  $setEscape(callback: (value: any) => string): MysqlInsertBuilder {
    const b = new MysqlInsertBuilder<T>();
    b.mergeQuery(this.#query).escape = callback;
    return b;
  }

  $setRun(callback: (query: string, ...args: any[]) => any) {
    const b = new MysqlInsertBuilder<T>();
    b.mergeQuery(this.#query).run = callback;
    return b;
  }

  $run<T = string>(...args: any[]): Promise<T> {
    return this.#query.run(this.toString(), ...args);
  }

  toString(): string {
    const { table, fields, ignore, set, values, selectQuery, alias, onDuplicateKeyUpdate } = this.#query;
    let sql = '';

    if (table) {
      sql += 'insert';
      if (ignore) {
        sql += ' ignore';
      }
      sql += ` into ${table}`;
    }
    if (fields.length) {
      sql += ` (\n  ${fields.join(',\n  ')}\n)`;
    }
    if (set.length) {
      sql += `\nset ${set.join(', ')}`;
    } else if (values.length) {
      sql += `\nvalues ${values.join(', ')}`;
    } else if (selectQuery.length) {
      if (alias.length) {
        sql += `\nselect * from (\n${selectQuery}\n) as ${alias}`;
      } else {
        sql += `\n${selectQuery}`;
      }
      if (onDuplicateKeyUpdate.length) {
        sql += `\non duplicate key update ${onDuplicateKeyUpdate.join(', ')}`;
      }
    }

    if (set.length || values.length) {
      if (alias.length) {
        sql += ` as ${alias}`;
      }
      if (onDuplicateKeyUpdate.length) {
        sql += `\non duplicate key update ${onDuplicateKeyUpdate.join(', ')}`;
      }
    }
    return sql;
  }
}

class ValuesBuilder {
  protected rows: (string | number)[][] = [];
  protected index = -1;

  row(...row: (string | number)[]): ValuesBuilder {
    const b = new ValuesBuilder();
    b.rows.push(...this.rows, row);
    return b;
  }

  protected [Symbol.iterator]() {
    return this;
  }

  protected next() {
    return { value: this.rows[++this.index], done: !(this.index in this.rows) };
  }
}
