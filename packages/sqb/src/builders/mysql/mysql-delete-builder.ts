import { NoSqlActions } from '../types';
import { AndOrBuilder, ExpressionBuilder } from './and-or-builder';
import { JoinBuilder } from './join-builder';
import { MySqlSelectBuilder } from './mysql-select-builder';

class DeleteQuery {
  del: string[] = [];
  from: string[] = [];
  using: string[] = [];
  join: string[] = [];
  where: string[] = [];
  orderBy: string[] = [];
  limit: string = '';
  run: (query: string, opts: any, ...args: any[]) => any = (query) => query;
  escape: (value: any) => string = (value) => value;
}

class DeleteBuilderConfig {
  indentation = 0;
}

type JoinType = 'join' | 'left join' | 'right join';
type JoinCallback = (joinBuilder: JoinBuilder) => AndOrBuilder | string;
type SelectCallback = (selectBuilder: MySqlSelectBuilder) => MySqlSelectBuilder;

export class MySqlDeleteBuilder<T extends object = any> implements NoSqlActions {
  #query = new DeleteQuery();
  #config = new DeleteBuilderConfig();

  protected mergeQuery(query: Partial<DeleteQuery>) {
    this.#query.del.push(...(query.del || []));
    this.#query.from.push(...(query.from || []));
    this.#query.using.push(...(query.using || []));
    this.#query.join.push(...(query.join || []));
    this.#query.where.push(...(query.where || []));
    this.#query.orderBy.push(...(query.orderBy || []));
    this.#query.limit = query.limit || '';
    this.#query.escape = query.escape || this.#query.escape;
    this.#query.run = query.run || this.#query.run;
    return this.#query;
  }

  delete(...tables: string[]) {
    const builder = new MySqlDeleteBuilder();
    builder.mergeQuery(this.#query).del.push(...tables);
    return builder;
  }

  from(alias: string, selectCallback: (builder: MySqlSelectBuilder) => MySqlSelectBuilder): MySqlDeleteBuilder;
  from(table: string): MySqlDeleteBuilder;
  from(tableOrAlias: string, selectCallback?: (b: MySqlSelectBuilder) => MySqlSelectBuilder) {
    const b = new MySqlDeleteBuilder();
    let from = '';

    if (selectCallback) {
      const selectBuilder = selectCallback(new MySqlSelectBuilder());
      from = `(\n${selectBuilder}\n) as ${tableOrAlias}`;
    } else {
      from = tableOrAlias;
    }
    b.mergeQuery(this.#query).from.push(from);
    return b;
  }

  using(...tables: string[]) {
    const builder = new MySqlDeleteBuilder();
    builder.mergeQuery(this.#query).using.push(...tables);
    return builder;
  }

  protected baseJoin(joinType: JoinType, table: string, joinCallback: JoinCallback): MySqlDeleteBuilder;
  protected baseJoin(
    joinType: JoinType,
    alias: string,
    selectCallback: SelectCallback,
    joinCallback: JoinCallback
  ): MySqlDeleteBuilder;
  protected baseJoin(
    joinType: JoinType,
    tableOrAlias: string,
    selectOrJoinCallback: JoinCallback | SelectCallback,
    joinCallback?: JoinCallback
  ) {
    if (joinCallback) {
      const selectBuilder = (selectOrJoinCallback as SelectCallback)(new MySqlSelectBuilder());
      tableOrAlias = `(\n${selectBuilder}\n) as ${tableOrAlias}`;
    } else {
      joinCallback = selectOrJoinCallback as JoinCallback;
    }
    const deleteBuilder = new MySqlDeleteBuilder();
    const joinQuery = joinCallback(new JoinBuilder());
    if (joinQuery instanceof AndOrBuilder) {
      const join = [...joinQuery];
      join[0] = `${joinType} ${tableOrAlias}\n  on ${join.at(0)}`;
      deleteBuilder.mergeQuery(this.#query);
      deleteBuilder.mergeQuery({ join });
    } else {
      deleteBuilder.mergeQuery(this.#query);
      deleteBuilder.mergeQuery({ join: [`${joinType} ${tableOrAlias}\n  using(${joinQuery})`] });
    }
    return deleteBuilder;
  }

  join(table: string, joinCallback: JoinCallback): MySqlDeleteBuilder;
  join(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlDeleteBuilder;
  join(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('join', table, selectOrJoinCallback, joinCallback);
  }

  leftJoin(table: string, joinCallback: JoinCallback): MySqlDeleteBuilder;
  leftJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlDeleteBuilder;
  leftJoin(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('left join', table, selectOrJoinCallback, joinCallback);
  }

  rightJoin(table: string, joinCallback: JoinCallback): MySqlDeleteBuilder;
  rightJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlDeleteBuilder;
  rightJoin(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('right join', table, selectOrJoinCallback, joinCallback);
  }

  where(expressCallback: (eb: ExpressionBuilder) => AndOrBuilder) {
    const b = new MySqlDeleteBuilder();
    const eb = new ExpressionBuilder();
    b.mergeQuery(this.#query);
    b.mergeQuery({ where: [...expressCallback(eb)] });
    return b;
  }

  orderBy(...fields: [string, ...string[]]) {
    const b = new MySqlDeleteBuilder();
    b.mergeQuery(this.#query).orderBy.push(...fields);
    return b;
  }

  limit(rowCount: number): MySqlDeleteBuilder;
  limit(offset: number, rowCount: number): MySqlDeleteBuilder;
  limit(offsetOrCount: number, rowCount?: number) {
    const b = new MySqlDeleteBuilder();
    const limit = rowCount ? [offsetOrCount, rowCount] : [];
    b.mergeQuery(this.#query).limit = limit.join(', ');
    return b;
  }

  $if(condition: any, deleteCallback: (deletebuilder: MySqlDeleteBuilder) => MySqlDeleteBuilder) {
    const b1 = new MySqlDeleteBuilder();
    b1.mergeQuery(this.#query);
    if (condition) {
      const b2 = deleteCallback(new MySqlDeleteBuilder());
      b1.mergeQuery(b2.#query);
    }
    return b1;
  }

  $setEscape(callback: (value: any) => string) {
    const b = new MySqlDeleteBuilder<T>();
    b.mergeQuery(this.#query).escape = callback;
    return b;
  }

  $setRun<R = string, O extends object = any>(callback: (query: string, opts: O, ...args: any[]) => R) {
    const b = new MySqlDeleteBuilder<T>();
    b.mergeQuery(this.#query).run = callback;
    return b;
  }

  $run<R = string, O extends object = any>(opts = {} as O, ...args: any[]): Promise<R> {
    return this.#query.run(this.toString(), opts, ...args);
  }

  toString(): string {
    const { del, from, using, join, where, orderBy, limit } = this.#query;
    const indentation = ' '.repeat(this.#config.indentation);
    const separator = `\n${indentation}`;
    let sql = '';

    if (del.length) {
      sql += `delete ${del.join(', ')}`;
    }
    if (from.length) {
      sql += `${separator}from ${from.join(', ')}`;
    }
    if (using.length) {
      sql += `\nusing ${using.join(', ')}`;
    }
    if (join.length) {
      sql += `${separator}${join.join(`${separator}`)}`;
    }
    if (where.length) {
      sql += `${separator}where ${where.join(`${separator}`)}`;
    }
    if (orderBy.length) {
      sql += `${separator}order by${separator}  ${orderBy.join(`,${separator}  `)}`;
    }
    if (limit.length) {
      sql += `${separator}limit ${limit}`;
    }

    return sql;
  }
}
