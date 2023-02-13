import { NoSqlActions, TableAndAlias } from '../types';
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

export class MySqlDeleteBuilder<Tables extends object = any, FromTable extends keyof Tables = keyof Tables>
  implements NoSqlActions
{
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
    const builder = new MySqlDeleteBuilder<Tables>();
    builder.mergeQuery(this.#query).del.push(...(tables as string[]));
    return builder;
  }

  from(alias: string, selectCallback: (builder: MySqlSelectBuilder) => MySqlSelectBuilder): MySqlDeleteBuilder<Tables>;
  from(table: TableAndAlias<FromTable>): MySqlDeleteBuilder<Tables>;
  from(
    tableOrAlias: string | TableAndAlias<FromTable>,
    selectCallback?: (b: MySqlSelectBuilder) => MySqlSelectBuilder
  ) {
    const b = new MySqlDeleteBuilder<Tables>();
    let from = '';

    if (selectCallback) {
      const selectBuilder = selectCallback(new MySqlSelectBuilder());
      from = `(\n${selectBuilder}\n) as ${tableOrAlias as string}`;
    } else {
      from = tableOrAlias as string;
    }
    b.mergeQuery(this.#query).from.push(from);
    return b;
  }

  using(...tables: string[]) {
    const builder = new MySqlDeleteBuilder<Tables>();
    builder.mergeQuery(this.#query).using.push(...tables);
    return builder;
  }

  protected baseJoin(
    joinType: JoinType,
    table: TableAndAlias<FromTable>,
    joinCallback: JoinCallback
  ): MySqlDeleteBuilder<Tables>;
  protected baseJoin(
    joinType: JoinType,
    alias: string,
    selectCallback: SelectCallback,
    joinCallback: JoinCallback
  ): MySqlDeleteBuilder<Tables>;
  protected baseJoin(
    joinType: JoinType,
    tableOrAlias: string | TableAndAlias<FromTable>,
    selectOrJoinCallback: JoinCallback | SelectCallback,
    joinCallback?: JoinCallback
  ) {
    if (joinCallback) {
      const selectBuilder = (selectOrJoinCallback as SelectCallback)(new MySqlSelectBuilder());
      tableOrAlias = `(\n${selectBuilder}\n) as ${tableOrAlias as string}`;
    } else {
      joinCallback = selectOrJoinCallback as JoinCallback;
    }
    const deleteBuilder = new MySqlDeleteBuilder<Tables>();
    const joinQuery = joinCallback(new JoinBuilder());
    if (joinQuery instanceof AndOrBuilder) {
      const join = [...joinQuery];
      join[0] = `${joinType} ${tableOrAlias as string}\n  on ${join.at(0)}`;
      deleteBuilder.mergeQuery(this.#query);
      deleteBuilder.mergeQuery({ join });
    } else {
      deleteBuilder.mergeQuery(this.#query);
      deleteBuilder.mergeQuery({ join: [`${joinType} ${tableOrAlias as string}\n  using(${joinQuery})`] });
    }
    return deleteBuilder;
  }

  join(table: TableAndAlias<FromTable>, joinCallback: JoinCallback): MySqlDeleteBuilder<Tables>;
  join(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlDeleteBuilder<Tables>;
  join(table: string | TableAndAlias<FromTable>, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('join', table as string, selectOrJoinCallback, joinCallback);
  }

  leftJoin(table: TableAndAlias<FromTable>, joinCallback: JoinCallback): MySqlDeleteBuilder<Tables>;
  leftJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlDeleteBuilder<Tables>;
  leftJoin(table: string | TableAndAlias<FromTable>, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('left join', table as string, selectOrJoinCallback, joinCallback);
  }

  rightJoin(table: TableAndAlias<FromTable>, joinCallback: JoinCallback): MySqlDeleteBuilder<Tables>;
  rightJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlDeleteBuilder<Tables>;
  rightJoin(table: string | TableAndAlias<FromTable>, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('right join', table as string, selectOrJoinCallback, joinCallback);
  }

  where(expressCallback: (eb: ExpressionBuilder) => AndOrBuilder) {
    const b = new MySqlDeleteBuilder<Tables>();
    const eb = new ExpressionBuilder(this.#query.escape);
    b.mergeQuery(this.#query);
    b.mergeQuery({ where: [...expressCallback(eb)] });
    return b;
  }

  orderBy(...fields: [string, ...string[]]) {
    const b = new MySqlDeleteBuilder<Tables>();
    b.mergeQuery(this.#query).orderBy.push(...fields);
    return b;
  }

  limit(rowCount: number): MySqlDeleteBuilder<Tables>;
  limit(offset: number, rowCount: number): MySqlDeleteBuilder<Tables>;
  limit(offsetOrCount: number, rowCount?: number) {
    const b = new MySqlDeleteBuilder<Tables>();
    const limit = rowCount ? [offsetOrCount, rowCount] : [];
    b.mergeQuery(this.#query).limit = limit.join(', ');
    return b;
  }

  $if(condition: any, deleteCallback: (deletebuilder: MySqlDeleteBuilder<Tables>) => MySqlDeleteBuilder<Tables>) {
    const b1 = new MySqlDeleteBuilder<Tables>();
    b1.mergeQuery(this.#query);
    if (condition) {
      const b2 = deleteCallback(new MySqlDeleteBuilder<Tables>());
      b1.mergeQuery(b2.#query);
    }
    return b1;
  }

  $setEscape(callback: (value: any) => string) {
    const b = new MySqlDeleteBuilder<Tables>();
    b.mergeQuery(this.#query).escape = callback;
    return b;
  }

  $setRun<R = string, O extends object = any>(callback: (query: string, opts: O, ...args: any[]) => R) {
    const b = new MySqlDeleteBuilder<Tables>();
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
