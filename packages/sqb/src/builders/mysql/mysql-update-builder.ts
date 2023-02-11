import { NoSqlActions } from '../types';
import { AndOrBuilder } from './and-or-builder';
import { JoinBuilder } from './join-builder';
import { MySqlSelectBuilder } from './mysql-select-builder';

class UpdateQuery {
  update: string[] = [];
  join: string[] = [];
  set: string[] = [];
  where: string[] = [];
  orderBy: string[] = [];
  limit: string = '';
  run: (query: string, opts: any, ...args: any[]) => any = (query) => query;
  escape: (value: any) => string = (value) => value;
}

class UpdateBuilderConfig {
  indentation = 0;
}

type JoinType = 'join' | 'left join' | 'right join';
type JoinCallback = (joinBuilder: JoinBuilder) => AndOrBuilder | string;
type SelectCallback = (selectBuilder: MySqlSelectBuilder) => MySqlSelectBuilder;

export class MySqlUpdateBuilder<T extends object = any> implements NoSqlActions {
  #query = new UpdateQuery();
  #config = new UpdateBuilderConfig();

  protected mergeQuery(query: Partial<UpdateQuery>) {
    this.#query.update.push(...(query.update || []));
    this.#query.join.push(...(query.join || []));
    this.#query.set.push(...(query.set || []));
    this.#query.where.push(...(query.where || []));
    this.#query.orderBy.push(...(query.orderBy || []));
    this.#query.limit = query.limit || '';
    this.#query.escape = query.escape || this.#query.escape;
    this.#query.run = query.run || this.#query.run;
    return this.#query;
  }

  update(alias: string, selectCallback: SelectCallback): MySqlUpdateBuilder;
  update(table: string): MySqlUpdateBuilder;
  update(tableOrAlias: string, selectCallback?: SelectCallback) {
    const builder = new MySqlUpdateBuilder();
    let update = '';

    if (selectCallback) {
      const selectBuilder = selectCallback(new MySqlSelectBuilder());
      update = `(\n${selectBuilder}\n) as ${tableOrAlias}`;
    } else {
      update = tableOrAlias;
    }
    builder.mergeQuery(this.#query).update.push(update);
    return builder;
  }

  protected baseJoin(joinType: JoinType, table: string, joinCallback: JoinCallback): MySqlUpdateBuilder;
  protected baseJoin(
    joinType: JoinType,
    alias: string,
    selectCallback: SelectCallback,
    joinCallback: JoinCallback
  ): MySqlUpdateBuilder;
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
    const updateBuilder = new MySqlUpdateBuilder();
    const joinQuery = joinCallback(new JoinBuilder());
    if (joinQuery instanceof AndOrBuilder) {
      const join = [...joinQuery];
      join[0] = `${joinType} ${tableOrAlias}\n  on ${join.at(0)}`;
      updateBuilder.mergeQuery(this.#query);
      updateBuilder.mergeQuery({ join });
    } else {
      updateBuilder.mergeQuery(this.#query);
      updateBuilder.mergeQuery({ join: [`${joinType} ${tableOrAlias}\n  using(${joinQuery})`] });
    }
    return updateBuilder;
  }

  join(table: string, joinCallback: JoinCallback): MySqlUpdateBuilder;
  join(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlUpdateBuilder;
  join(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('join', table, selectOrJoinCallback, joinCallback);
  }

  leftJoin(table: string, joinCallback: JoinCallback): MySqlUpdateBuilder;
  leftJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlUpdateBuilder;
  leftJoin(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('left join', table, selectOrJoinCallback, joinCallback);
  }

  rightJoin(table: string, joinCallback: JoinCallback): MySqlUpdateBuilder;
  rightJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlUpdateBuilder;
  rightJoin(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('right join', table, selectOrJoinCallback, joinCallback);
  }

  set<T extends object>(obj: T): MySqlUpdateBuilder {
    const updateBuilder = new MySqlUpdateBuilder();
    const updateQuery = updateBuilder.mergeQuery(this.#query);
    for (const prop in obj) {
      updateQuery.set.push(`${prop} = ${obj[prop]}`);
    }
    return updateBuilder;
  }

  where(expressCallback: (eb: AndOrBuilder) => AndOrBuilder) {
    const b = new MySqlUpdateBuilder();
    const eb = new AndOrBuilder();
    b.mergeQuery(this.#query);
    b.mergeQuery({ where: [...expressCallback(eb)] });
    return b;
  }

  orderBy(...fields: [string, ...string[]]) {
    const b = new MySqlUpdateBuilder();
    b.mergeQuery(this.#query).orderBy.push(...fields);
    return b;
  }

  limit(rowCount: number): MySqlUpdateBuilder;
  limit(offset: number, rowCount: number): MySqlUpdateBuilder;
  limit(offsetOrCount: number, rowCount?: number) {
    const b = new MySqlUpdateBuilder();
    const limit = rowCount ? [offsetOrCount, rowCount] : [];
    b.mergeQuery(this.#query).limit = limit.join(', ');
    return b;
  }

  $if(condition: any, updateCallback: (updatebuilder: MySqlUpdateBuilder) => MySqlUpdateBuilder) {
    const b1 = new MySqlUpdateBuilder();
    b1.mergeQuery(this.#query);
    if (condition) {
      const b2 = updateCallback(new MySqlUpdateBuilder());
      b1.mergeQuery(b2.#query);
    }
    return b1;
  }

  $setEscape(callback: (value: any) => string) {
    const b = new MySqlUpdateBuilder<T>();
    b.mergeQuery(this.#query).escape = callback;
    return b;
  }

  $setRun<R = string, O extends object = any>(callback: (query: string, opts: O, ...args: any[]) => R) {
    const b = new MySqlUpdateBuilder<T>();
    b.mergeQuery(this.#query).run = callback;
    return b;
  }

  $run<R = string, O extends object = any>(opts = {} as O, ...args: any[]): Promise<R> {
    return this.#query.run(this.toString(), opts, ...args);
  }

  toString(): string {
    const { update, join, set, where, orderBy, limit } = this.#query;
    const indentation = ' '.repeat(this.#config.indentation);
    const separator = `\n${indentation}`;
    let sql = '';

    if (update.length) {
      sql += `update ${update.join(', ')}`;
    }
    if (join.length) {
      sql += `${separator}${join.join(`${separator}`)}`;
    }
    if (set.length) {
      sql += `\nset ${set.join(', ')}`;
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
