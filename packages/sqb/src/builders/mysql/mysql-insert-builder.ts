import { MySqlSelectBuilder } from './mysql-select-builder';

class InsertQuery {
  table: string = '';
  fields: string[] = [];
  ignore: boolean = false;
  selectQuery: string = '';
}

export class MysqlInsertBuilder {
  #query = new InsertQuery();

  protected mergeQuery(query: Partial<InsertQuery>) {
    this.#query.table = query.table || '';
    this.#query.fields.push(...(query.fields || []));
    this.#query.ignore = query.ignore || false;
    this.#query.selectQuery = query.selectQuery || '';
    return this.#query;
  }

  insertInto(
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
    const { table, fields, ignore, selectQuery } = this.#query;
    let sql = '';

    if (table) {
      sql += 'insert';
      if (ignore) {
        sql += ' ignore';
      }
      sql += ` into ${table}`;
    }
    if (fields.length) {
      sql += `\n  ${fields.join(',\n  ')}`;
    }
    if (selectQuery.length) {
      sql += `\n${selectQuery}`;
    }
    return sql;
  }
}
