import { NoSqlActions, TableAndAlias } from '../types.js';
import { MySqlSelectBuilder } from './mysql-select-builder.js';

class InsertQuery {
  table: string = '';
  fields: string[] = [];
  set: string[] = [];
  values: string[] = [];
  ignore: boolean = false;
  selectQuery: string = '';
  alias: string = '';
  onDuplicateKeyUpdate: string[] = [];
  run: (query: string, opts: any, ...args: any[]) => any = (query) => query;
  escape: (value: any) => string = (value) => value;
}

export class MysqlInsertBuilder<Tables extends object = object> implements NoSqlActions {
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

  insertFromSet<T extends keyof Tables>(table: T, obj: Partial<Tables[T]>): MysqlInsertBuilder<Tables> {
    const insertBuilder = new MysqlInsertBuilder<Tables>();
    const insertQuery = insertBuilder.mergeQuery(this.#query);
    insertQuery.table = table as string;
    for (const prop in obj) {
      insertQuery.set.push(`${prop} = ${this.#query.escape(obj[prop])}`);
    }
    return insertBuilder;
  }

  insertFromValues<T extends keyof Tables>(
    table: T,
    fields: (keyof Tables[T])[],
    values: (string | number)[][]
  ): MysqlInsertBuilder<Tables>;
  insertFromValues<T extends keyof Tables>(
    table: T,
    fields: (keyof Tables[T])[],
    valuesCallback: (valuesBuilder: ValuesBuilder) => ValuesBuilder
  ): MysqlInsertBuilder<Tables>;
  insertFromValues<T extends keyof Tables>(
    table: T,
    fields: Extract<keyof Tables[T], string>[],
    arrayOrCallback: (string | number)[][] | ((valuesBuilder: ValuesBuilder) => ValuesBuilder)
  ) {
    const insertBuilder = new MysqlInsertBuilder<Tables>();
    const insertQuery = insertBuilder.mergeQuery(this.#query);
    insertQuery.table = table as string;
    insertQuery.fields.push(...fields);
    let values: (string | number)[][];
    if (Array.isArray(arrayOrCallback)) {
      values = arrayOrCallback;
    } else {
      values = [...arrayOrCallback(new ValuesBuilder())];
    }
    values.forEach((tuple) => {
      const escapedTuple = tuple.map((v) => this.#query.escape(v));
      insertQuery.values.push(`(${escapedTuple.join(', ')})`);
    });
    return insertBuilder;
  }

  insertFromSelect<T extends keyof Tables>(
    table: T,
    fields: Extract<keyof Tables[T], string>[],
    selectCallback: (selectBuilder: MySqlSelectBuilder<Tables>) => MySqlSelectBuilder<Tables>
  ): MysqlInsertBuilder<Tables> {
    const insertBuilder = new MysqlInsertBuilder<Tables>();
    const insertQuery = insertBuilder.mergeQuery(this.#query);
    insertQuery.table = table as string;
    insertQuery.fields.push(...fields);
    const selectBuilder = new MySqlSelectBuilder().$setEscape(this.#query.escape);
    insertQuery.selectQuery = selectCallback(selectBuilder).toString();
    return insertBuilder;
  }

  ignore() {
    const insertBuilder = new MysqlInsertBuilder<Tables>();
    insertBuilder.mergeQuery(this.#query).ignore = true;
    return insertBuilder;
  }

  onDuplicateKeyUpdate<T extends keyof Tables>(obj: Partial<Tables[T]>): MysqlInsertBuilder<Tables>;
  onDuplicateKeyUpdate<T extends keyof Tables>(alias: string, obj: Partial<Tables[T]>): MysqlInsertBuilder<Tables>;
  onDuplicateKeyUpdate<T extends keyof Tables>(aliasOrObj: string | Partial<Tables[T]>, obj?: Partial<Tables[T]>) {
    const insertBuilder = new MysqlInsertBuilder<Tables>();
    const insertQuery = insertBuilder.mergeQuery(this.#query);
    if (obj) {
      insertQuery.alias = aliasOrObj as string;
    } else {
      obj = aliasOrObj as Partial<Tables[T]>;
    }
    for (const prop in obj) {
      insertQuery.onDuplicateKeyUpdate.push(`${prop} = ${this.#query.escape(obj[prop])}`);
    }
    return insertBuilder;
  }

  $if(condition: any, insertCallback: (updatebuilder: MysqlInsertBuilder) => MysqlInsertBuilder) {
    const b1 = new MysqlInsertBuilder<Tables>();
    b1.mergeQuery(this.#query);
    if (condition) {
      const b2 = insertCallback(new MysqlInsertBuilder<Tables>());
      b1.mergeQuery(b2.#query);
    }
    return b1;
  }

  $setEscape(callback: (value: any) => string) {
    const b = new MysqlInsertBuilder<Tables>();
    b.mergeQuery(this.#query).escape = callback;
    return b;
  }

  $setRun<R = string, O extends object = any>(callback: (query: string, opts: O, ...args: any[]) => R) {
    const b = new MysqlInsertBuilder<Tables>();
    b.mergeQuery(this.#query).run = callback;
    return b;
  }

  $run<R = string, O extends object = any>(opts = {} as O, ...args: any[]): Promise<R> {
    return this.#query.run(this.toString(), opts, ...args);
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

export class ValuesBuilder {
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
