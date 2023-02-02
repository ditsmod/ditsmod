import { MySqlSelectBuilder } from './mysql-select-builder';

class InsertQuery {
  table: string = '';
  fields: string[] = [];
  set: string[] = [];
  values: string[] = [];
  ignore: boolean = false;
  selectQuery: string = '';
}

export class MysqlInsertBuilder {
  #query = new InsertQuery();

  protected mergeQuery(query: Partial<InsertQuery>) {
    this.#query.table = query.table || '';
    this.#query.fields = query.fields || [];
    this.#query.set.push(...(query.set || []));
    this.#query.values.push(...(query.values || []));
    this.#query.ignore = query.ignore || false;
    this.#query.selectQuery = query.selectQuery || '';
    return this.#query;
  }

  insertFromSet<T extends object>(table: string, obj: T) {
    const insertBuilder = new MysqlInsertBuilder();
    const insertQuery = insertBuilder.mergeQuery(this.#query);
    insertQuery.table = table;
    for (const prop in obj) {
      insertQuery.set.push(`${prop} = ${obj[prop]}`);
    }
    return insertBuilder;
  }

  insertFromValues(table: string, fields: string[], values: (string | number)[][]): MysqlInsertBuilder;
  insertFromValues(
    table: string,
    fields: string[],
    valuesCallback: (valuesBuilder: ValuesBuilder) => ValuesBuilder
  ): MysqlInsertBuilder;
  insertFromValues(
    table: string,
    fields: string[],
    arrayOrCallback: (string | number)[][] | ((valuesBuilder: ValuesBuilder) => ValuesBuilder)
  ) {
    const insertBuilder = new MysqlInsertBuilder();
    const insertQuery = insertBuilder.mergeQuery(this.#query);
    insertQuery.table = table;
    insertQuery.fields.push(...fields);
    let values: (string | number)[][];
    if (Array.isArray(arrayOrCallback)) {
      values = arrayOrCallback;
    } else {
      values = [...arrayOrCallback(new ValuesBuilder())];
    }
    values.forEach(tuple => insertQuery.values.push(`(${tuple.join(', ')})`));
    return insertBuilder;
  }

  insertFromSelect(
    table: string,
    fields: string[],
    selectCallback: (selectBuilder: MySqlSelectBuilder) => MySqlSelectBuilder
  ) {
    const insertBuilder = new MysqlInsertBuilder();
    const insertQuery = insertBuilder.mergeQuery(this.#query);
    insertQuery.table = table;
    insertQuery.fields.push(...fields);
    insertQuery.selectQuery = selectCallback(new MySqlSelectBuilder()).toString();
    return insertBuilder;
  }

  ignore() {
    const insertBuilder = new MysqlInsertBuilder();
    insertBuilder.mergeQuery(this.#query).ignore = true;
    return insertBuilder;
  }

  onDuplicateKeyUpdate(table: string) {}

  toString(): string {
    const { table, fields, ignore, set, values, selectQuery } = this.#query;
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
      sql += `\n${selectQuery}`;
    }
    return sql;
  }
}

class ValuesBuilder {
  protected rows: any[][] = [];
  protected index = -1;

  row(...row: any[]): ValuesBuilder {
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
