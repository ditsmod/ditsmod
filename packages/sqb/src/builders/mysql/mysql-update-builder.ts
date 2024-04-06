import { OneSqlExpression } from '../../types.js';
import { defaultEscapeFn, defaultRunFn, mergeEscapeAndRun } from '../../utils.js';
import { NoSqlActions, TableAndAlias } from '../types.js';
import { AndOrBuilder } from './and-or-builder.js';
import { JoinBuilder } from './join-builder.js';
import { MySqlSelectBuilder } from './mysql-select-builder.js';

class UpdateQuery {
  update: string[] = [];
  join: string[] = [];
  set: string[] = [];
  where: string[] = [];
  orderBy: string[] = [];
  limit: string = '';
  run = defaultRunFn;
  escape = defaultEscapeFn;
}

class UpdateBuilderConfig {
  indentation = 0;
}

type JoinType = 'join' | 'left join' | 'right join';
type JoinCallback = (joinBuilder: JoinBuilder) => AndOrBuilder | string;
type SelectCallback = (selectBuilder: MySqlSelectBuilder) => MySqlSelectBuilder;

export class MySqlUpdateBuilder<Tables extends object = any> implements NoSqlActions {
  #query = new UpdateQuery();
  #config = new UpdateBuilderConfig();

  protected mergeQuery(query: Partial<UpdateQuery>) {
    this.#query.update.push(...(query.update || []));
    this.#query.join.push(...(query.join || []));
    this.#query.set.push(...(query.set || []));
    this.#query.where.push(...(query.where || []));
    this.#query.orderBy.push(...(query.orderBy || []));
    this.#query.limit = query.limit || '';
    mergeEscapeAndRun(this.#query, query);
    return this.#query;
  }

  update(alias: string, selectCallback: SelectCallback): MySqlUpdateBuilder<Tables>;
  update(table: TableAndAlias<keyof Tables>): MySqlUpdateBuilder<Tables>;
  update(tableOrAlias: string | TableAndAlias<keyof Tables>, selectCallback?: SelectCallback) {
    const builder = new MySqlUpdateBuilder<Tables>();
    let update = '';

    if (selectCallback) {
      const selectBuilder = new MySqlSelectBuilder().$setEscape(this.#query.escape);
      const selectResult = selectCallback(selectBuilder);
      update = `(\n${selectResult}\n) as ${tableOrAlias as string}`;
    } else {
      update = tableOrAlias as string;
    }
    builder.mergeQuery(this.#query).update.push(update);
    return builder;
  }

  protected baseJoin(joinType: JoinType, table: string, joinCallback: JoinCallback): MySqlUpdateBuilder<Tables>;
  protected baseJoin(
    joinType: JoinType,
    alias: string,
    selectCallback: SelectCallback,
    joinCallback: JoinCallback,
  ): MySqlUpdateBuilder<Tables>;
  protected baseJoin(
    joinType: JoinType,
    tableOrAlias: string,
    selectOrJoinCallback: JoinCallback | SelectCallback,
    joinCallback?: JoinCallback,
  ) {
    if (joinCallback) {
      const selectBuilder = new MySqlSelectBuilder().$setEscape(this.#query.escape);
      const selectResult = (selectOrJoinCallback as SelectCallback)(selectBuilder);
      tableOrAlias = `(\n${selectResult}\n) as ${tableOrAlias}`;
    } else {
      joinCallback = selectOrJoinCallback as JoinCallback;
    }
    const updateBuilder = new MySqlUpdateBuilder<Tables>();
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

  join(table: string, joinCallback: JoinCallback): MySqlUpdateBuilder<Tables>;
  join(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlUpdateBuilder<Tables>;
  join(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('join', table, selectOrJoinCallback, joinCallback);
  }

  leftJoin(table: string, joinCallback: JoinCallback): MySqlUpdateBuilder<Tables>;
  leftJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlUpdateBuilder<Tables>;
  leftJoin(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('left join', table, selectOrJoinCallback, joinCallback);
  }

  rightJoin(table: string, joinCallback: JoinCallback): MySqlUpdateBuilder<Tables>;
  rightJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlUpdateBuilder<Tables>;
  rightJoin(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('right join', table, selectOrJoinCallback, joinCallback);
  }

  set<T extends object>(obj: T): MySqlUpdateBuilder<Tables>;
  set(...clause: OneSqlExpression): MySqlUpdateBuilder<Tables>;
  set<T extends object>(...clause: OneSqlExpression): MySqlUpdateBuilder<Tables> {
    const [firstEl, , thirdEl] = clause;
    if (thirdEl) {
      clause[2] = this.#query.escape(thirdEl);
    }
    const updateBuilder = new MySqlUpdateBuilder<Tables>();
    const updateQuery = updateBuilder.mergeQuery(this.#query);
    if (clause.length == 1 && typeof firstEl == 'object') {
      for (const prop in firstEl) {
        updateQuery.set.push(`${prop} = ${this.#query.escape(firstEl[prop])}`);
      }
    } else {
      updateQuery.set.push(clause.join(' '));
    }
    return updateBuilder;
  }

  where(expressCallback: (aob: AndOrBuilder) => AndOrBuilder): MySqlUpdateBuilder<Tables>;
  where<T extends object>(obj: T): MySqlUpdateBuilder<Tables>;
  where(...clause: OneSqlExpression): MySqlUpdateBuilder<Tables>;
  where<T extends object>(...clause: any[]) {
    const [firstEl, , thirdEl] = clause;
    if (thirdEl) {
      clause[2] = this.#query.escape(thirdEl);
    }
    const updateBuilder = new MySqlUpdateBuilder<Tables>();
    const updateQuery = updateBuilder.mergeQuery(this.#query);
    if (typeof firstEl == 'function') {
      const andOrBuilder = new AndOrBuilder([], 2, this.#query.escape);
      updateBuilder.mergeQuery({ where: [...firstEl(andOrBuilder)] });
    } else if (typeof firstEl == 'object') {
      const andClause: string[] = [];
      for (const prop in firstEl) {
        andClause.push(`${prop} = ${this.#query.escape(firstEl[prop])}`);
      }
      updateQuery.where.push(andClause.join('\n  and '));
    } else {
      updateQuery.where.push(`${clause.join(' ')}`);
    }
    return updateBuilder;
  }

  orderBy(...fields: [any, ...any[]]) {
    const b = new MySqlUpdateBuilder<Tables>();
    b.mergeQuery(this.#query).orderBy.push(...fields);
    return b;
  }

  limit(rowCount: number): MySqlUpdateBuilder<Tables>;
  limit(offset: number, rowCount: number): MySqlUpdateBuilder<Tables>;
  limit(offsetOrCount: number, rowCount?: number) {
    const b = new MySqlUpdateBuilder<Tables>();
    const limit = rowCount ? [offsetOrCount, rowCount] : [];
    b.mergeQuery(this.#query).limit = limit.join(', ');
    return b;
  }

  $if(condition: any, updateCallback: (updatebuilder: MySqlUpdateBuilder<Tables>) => MySqlUpdateBuilder<Tables>) {
    const b1 = new MySqlUpdateBuilder<Tables>();
    b1.mergeQuery(this.#query);
    if (condition) {
      const b2 = updateCallback(new MySqlUpdateBuilder<Tables>());
      b1.mergeQuery(b2.#query);
    }
    return b1;
  }

  $setEscape(callback: (value: any) => string) {
    const b = new MySqlUpdateBuilder<Tables>();
    b.mergeQuery(this.#query).escape = callback;
    return b;
  }

  $setHook<R = string, O extends object = any>(callback: (query: string, opts: O, ...args: any[]) => R) {
    const b = new MySqlUpdateBuilder<Tables>();
    b.mergeQuery(this.#query).run = callback;
    return b;
  }

  $runHook<R = string, O extends object = any>(opts = {} as O, ...args: any[]): Promise<R> {
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
      sql += `\nset ${set.join(',\n  ')}`;
    }
    if (where.length) {
      sql += `${separator}where ${where.join(`${separator}  and `)}`;
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
