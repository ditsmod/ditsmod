import { MySqlSelectBuilder } from './mysql-select-builder';

class InsertQuery {
  insertIntoTable: string = '';
  insertIntoFields: string[] = [];
  ignore: boolean = false;
  selectQuery: string = '';
}

export class MysqlInsertBuilder {
  #query = new InsertQuery();

  protected mergeQuery(query: Partial<InsertQuery>) {
    this.#query.insertIntoTable = query.insertIntoTable || '';
    this.#query.insertIntoFields.push(...(query.insertIntoFields || []));
    this.#query.ignore = query.ignore || false;
    this.#query.selectQuery = query.selectQuery || '';
    return this.#query;
  }

  static insertInto(
    table: string,
    fields: string[],
    selectCallback: (selectBuilder: MySqlSelectBuilder) => MySqlSelectBuilder
  ) {
    return new this().insertInto(table, fields, selectCallback);
  }

  insertInto(
    table: string,
    fields: string[],
    selectCallback: (selectBuilder: MySqlSelectBuilder) => MySqlSelectBuilder
  ) {
    const insertBuilder = new MysqlInsertBuilder();
    const insertQuery = insertBuilder.mergeQuery(this.#query);
    insertQuery.insertIntoTable = table;
    insertQuery.insertIntoFields.push(...fields);
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
    const { insertIntoTable, insertIntoFields, ignore, selectQuery } = this.#query;
    let sql = '';

    if (insertIntoTable) {
      sql += 'insert';
      if (ignore) {
        sql += ' ignore';
      }
      sql += ` into ${insertIntoTable}`;
    }
    if (insertIntoFields.length) {
      sql += `\n  ${insertIntoFields.join(',\n  ')}`;
    }
    if (selectQuery.length) {
      sql += `\n${selectQuery}`;
    }
    return sql;
  }
}
