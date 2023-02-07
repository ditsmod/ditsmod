import { AndOrBuilder } from './and-or-builder';
import { ExpressionBuilder } from './expression-builder';
import { JoinBuilder } from './join-builder';

class SelectQuery {
  select: string[] = [];
  from: string[] = [];
  join: string[] = [];
  where: string[] = [];
  groupBy: string[] = [];
  having: string[] = [];
  orderBy: string[] = [];
  limit: string = '';
  run: (query: string, ...args: any[]) => any = (query) => query;
}

class MySqlSelectBuilderConfig {
  indentation = 0;
}

type JoinType = 'join' | 'left join' | 'right join';
type JoinCallback = (joinBuilder: JoinBuilder) => AndOrBuilder | string;
type SelectCallback<T extends object = any> = (selectBuilder: MySqlSelectBuilder<T>) => MySqlSelectBuilder<T>;
type TableAndAlias<T> = T | `${Extract<T, string>} as ${string}`;

export class MySqlSelectBuilder<T extends object = any> {
  #query = new SelectQuery();
  #config = new MySqlSelectBuilderConfig();

  protected mergeQuery(query: Partial<SelectQuery>) {
    this.#query.select.push(...(query.select || []));
    this.#query.from.push(...(query.from || []));
    this.#query.join.push(...(query.join || []));
    this.#query.where.push(...(query.where || []));
    this.#query.groupBy.push(...(query.groupBy || []));
    this.#query.having.push(...(query.having || []));
    this.#query.orderBy.push(...(query.orderBy || []));
    this.#query.limit = query.limit || this.#query.limit;
    this.#query.run = query.run || this.#query.run;
    return this.#query;
  }

  select(...fields: [string, ...string[]]) {
    const b = new MySqlSelectBuilder<T>();
    b.mergeQuery(this.#query).select.push(...fields);
    return b;
  }

  from(alias: string, selectCallback: (builder: MySqlSelectBuilder<T>) => MySqlSelectBuilder<T>): MySqlSelectBuilder<T>;
  from(table: TableAndAlias<keyof T>): MySqlSelectBuilder<T>;
  from(tableOrAlias: string | keyof T, selectCallback?: (b: MySqlSelectBuilder<T>) => MySqlSelectBuilder<T>) {
    const b = new MySqlSelectBuilder<T>();
    let from = '';

    if (selectCallback) {
      const sbResult = selectCallback(b);
      from = `(\n${sbResult}\n) as ${tableOrAlias as string}`;
    } else {
      from = tableOrAlias as string;
    }
    b.mergeQuery(this.#query).from.push(from);
    return b;
  }

  protected baseJoin(
    joinType: JoinType,
    table: TableAndAlias<keyof T>,
    joinCallback: JoinCallback
  ): MySqlSelectBuilder<T>;
  protected baseJoin(
    joinType: JoinType,
    alias: string,
    selectCallback: SelectCallback,
    joinCallback: JoinCallback
  ): MySqlSelectBuilder<T>;
  protected baseJoin(
    joinType: JoinType,
    tableOrAlias: string | TableAndAlias<keyof T>,
    selectOrJoinCallback: JoinCallback | SelectCallback,
    joinCallback?: JoinCallback
  ) {
    if (joinCallback) {
      const innerSelectBuilder = new MySqlSelectBuilder<T>();
      const selectQuery = (selectOrJoinCallback as SelectCallback)(innerSelectBuilder);
      tableOrAlias = `(\n${selectQuery}\n) as ${tableOrAlias as string}`;
    } else {
      joinCallback = selectOrJoinCallback as JoinCallback;
    }
    const currentBuilder = new MySqlSelectBuilder<T>();
    const joinBuilder = new JoinBuilder();
    const joinQuery = joinCallback(joinBuilder);
    if (joinQuery instanceof AndOrBuilder) {
      const join = [...joinQuery];
      join[0] = `${joinType} ${tableOrAlias as string}\n  on ${join.at(0)}`;
      currentBuilder.mergeQuery(this.#query);
      currentBuilder.mergeQuery({ join });
    } else {
      currentBuilder.mergeQuery(this.#query);
      currentBuilder.mergeQuery({ join: [`${joinType} ${tableOrAlias as string}\n  using(${joinQuery})`] });
    }
    return currentBuilder;
  }

  join(table: TableAndAlias<keyof T>, joinCallback: JoinCallback): MySqlSelectBuilder<T>;
  join(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlSelectBuilder<T>;
  join(table: string | TableAndAlias<keyof T>, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('join', table as string, selectOrJoinCallback, joinCallback);
  }

  leftJoin(table: TableAndAlias<keyof T>, joinCallback: JoinCallback): MySqlSelectBuilder<T>;
  leftJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlSelectBuilder<T>;
  leftJoin(table: string | TableAndAlias<keyof T>, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('left join', table as string, selectOrJoinCallback, joinCallback);
  }

  rightJoin(table: TableAndAlias<keyof T>, joinCallback: JoinCallback): MySqlSelectBuilder<T>;
  rightJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlSelectBuilder<T>;
  rightJoin(table: string | TableAndAlias<keyof T>, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('right join', table as string, selectOrJoinCallback, joinCallback);
  }

  where(expressCallback: (eb: ExpressionBuilder) => AndOrBuilder) {
    const b = new MySqlSelectBuilder<T>();
    const eb = new ExpressionBuilder();
    b.mergeQuery(this.#query);
    b.mergeQuery({ where: [...expressCallback(eb)] });
    return b;
  }

  groupBy(...fields: [string, ...string[]]) {
    const b = new MySqlSelectBuilder<T>();
    b.mergeQuery(this.#query).groupBy.push(...fields);
    return b;
  }

  having(expressCallback: (eb: ExpressionBuilder) => AndOrBuilder) {
    const b = new MySqlSelectBuilder<T>();
    const eb = new ExpressionBuilder();
    b.mergeQuery(this.#query);
    b.mergeQuery({ having: [...expressCallback(eb)] });
    return b;
  }

  orderBy(...fields: [string, ...string[]]) {
    const b = new MySqlSelectBuilder<T>();
    b.mergeQuery(this.#query).orderBy.push(...fields);
    return b;
  }

  limit(rowCount: number): MySqlSelectBuilder<T>;
  limit(offset: number, rowCount: number): MySqlSelectBuilder<T>;
  limit(offsetOrCount: number, rowCount?: number) {
    const b = new MySqlSelectBuilder<T>();
    const limit = rowCount ? [offsetOrCount, rowCount] : [];
    b.mergeQuery(this.#query).limit = limit.join(', ');
    return b;
  }

  $if(condition: any, selectCallback: (sb: MySqlSelectBuilder<T>) => MySqlSelectBuilder<T>) {
    const b1 = new MySqlSelectBuilder<T>();
    b1.mergeQuery(this.#query);
    if (condition) {
      const b2 = selectCallback(new MySqlSelectBuilder<T>());
      b1.mergeQuery(b2.#query);
    }
    return b1;
  }

  $setRun(callback: (query: string, ...args: any[]) => any) {
    const b = new MySqlSelectBuilder<T>();
    b.mergeQuery(this.#query).run = callback;
    return b;
  }

  $run<T = string>(...args: any[]): T {
    return this.#query.run(this.toString(), ...args);
  }

  toString(): string {
    const { select, from, join, where, orderBy, groupBy, having, limit } = this.#query;
    const indentation = ' '.repeat(this.#config.indentation);
    const separator = `\n${indentation}`;
    let sql = '';

    if (select.length) {
      sql += `${indentation}select${separator}  ${select.join(`,${separator}  `)}`;
    }
    if (from.length) {
      sql += `${separator}from ${from.join(', ')}`;
    }
    if (join.length) {
      sql += `${separator}${join.join(`${separator}`)}`;
    }
    if (where.length) {
      sql += `${separator}where ${where.join(`${separator}`)}`;
    }
    if (groupBy.length) {
      sql += `${separator}group by${separator}  ${groupBy.join(`,${separator}  `)}`;
    }
    if (having.length) {
      sql += `${separator}having ${having.join(`${separator}`)}`;
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
