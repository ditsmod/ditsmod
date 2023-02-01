import { AndOrBuilder, OpenedAndOrBuilder } from './and-or-builder';
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
}

class MySqlSelectBuilderConfig {
  indentation = 0;
}

type JoinType = 'join' | 'left join' | 'right join';
type JoinCallback = (joinBuilder: JoinBuilder) => AndOrBuilder | string;
type SelectCallback = (selectBuilder: MySqlSelectBuilder) => MySqlSelectBuilder;

export class MySqlSelectBuilder {
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
    this.#query.limit = query.limit || '';
    return this.#query;
  }

  static select(...fields: [any, ...any[]]) {
    return new this().select(...fields);
  }

  select(...fields: [any, ...any[]]) {
    fields.forEach((f, i) => {
      if (typeof f != 'string') {
        const msg = `SelectBuilder: failed query select building: element with ${i} index must have string type (got ${typeof f})`;
        throw new TypeError(msg);
      }
    });
    const b = new MySqlSelectBuilder();
    b.mergeQuery(this.#query).select.push(...fields);
    return b;
  }

  from(alias: string, cb: (builder: MySqlSelectBuilder) => MySqlSelectBuilder): MySqlSelectBuilder;
  from(table: string): MySqlSelectBuilder;
  from(tableOrAlias: string, cb?: (b: MySqlSelectBuilder) => MySqlSelectBuilder) {
    const b = new MySqlSelectBuilder();
    let from = '';

    if (cb) {
      const sbResult = cb(b);
      from = `(\n${sbResult}\n) as ${tableOrAlias}`;
    } else {
      from = tableOrAlias;
    }
    b.mergeQuery(this.#query).from.push(from);
    return b;
  }

  protected baseJoin(joinType: JoinType, table: string, joinCallback: JoinCallback): MySqlSelectBuilder;
  protected baseJoin(
    joinType: JoinType,
    alias: string,
    selectCallback: SelectCallback,
    joinCallback: JoinCallback
  ): MySqlSelectBuilder;
  protected baseJoin(
    joinType: JoinType,
    tableOrAlias: string,
    selectOrJoinCallback: JoinCallback | SelectCallback,
    joinCallback?: JoinCallback
  ) {
    if (joinCallback) {
      const innerSelectBuilder = new MySqlSelectBuilder();
      const selectQuery = (selectOrJoinCallback as SelectCallback)(innerSelectBuilder);
      tableOrAlias = `(\n${selectQuery}\n) as ${tableOrAlias}`;
    } else {
      joinCallback = selectOrJoinCallback as JoinCallback;
    }
    const currentBuilder = new MySqlSelectBuilder();
    const joinBuilder = new JoinBuilder();
    const joinQuery = joinCallback(joinBuilder);
    if (joinQuery instanceof AndOrBuilder) {
      const join = (joinQuery as OpenedAndOrBuilder).expressions;
      join[0] = `${joinType} ${tableOrAlias}\n  on ${join.at(0)}`;
      currentBuilder.mergeQuery(this.#query);
      currentBuilder.mergeQuery({ join });
    } else {
      currentBuilder.mergeQuery(this.#query);
      currentBuilder.mergeQuery({ join: [`${joinType} ${tableOrAlias}\n  using(${joinQuery})`] });
    }
    return currentBuilder;
  }

  join(table: string, joinCallback: JoinCallback): MySqlSelectBuilder;
  join(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlSelectBuilder;
  join(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('join', table, selectOrJoinCallback, joinCallback);
  }

  leftJoin(table: string, joinCallback: JoinCallback): MySqlSelectBuilder;
  leftJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlSelectBuilder;
  leftJoin(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('left join', table, selectOrJoinCallback, joinCallback);
  }

  rightJoin(table: string, joinCallback: JoinCallback): MySqlSelectBuilder;
  rightJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): MySqlSelectBuilder;
  rightJoin(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('right join', table, selectOrJoinCallback, joinCallback);
  }

  where(cb: (eb: ExpressionBuilder) => AndOrBuilder) {
    const b = new MySqlSelectBuilder();
    const eb = new ExpressionBuilder();
    const ebResult = cb(eb);
    const where = (ebResult as OpenedAndOrBuilder).expressions;
    b.mergeQuery(this.#query);
    b.mergeQuery({ where });
    return b;
  }

  groupBy(...fields: [any, ...any[]]) {
    const b = new MySqlSelectBuilder();
    b.mergeQuery(this.#query).groupBy.push(...fields);
    return b;
  }

  having(cb: (eb: ExpressionBuilder) => AndOrBuilder) {
    const b = new MySqlSelectBuilder();
    const eb = new ExpressionBuilder();
    const ebResult = cb(eb);
    const having = (ebResult as OpenedAndOrBuilder).expressions;
    b.mergeQuery(this.#query);
    b.mergeQuery({ having });
    return b;
  }

  orderBy(...fields: [any, ...any[]]) {
    const b = new MySqlSelectBuilder();
    b.mergeQuery(this.#query).orderBy.push(...fields);
    return b;
  }

  limit(rowCount: number): MySqlSelectBuilder;
  limit(offset: number, rowCount: number): MySqlSelectBuilder;
  limit(offsetOrCount: number, rowCount?: number) {
    const b = new MySqlSelectBuilder();
    const limit = rowCount ? [offsetOrCount, rowCount] : [];
    b.mergeQuery(this.#query).limit = limit.join(', ');
    return b;
  }

  $if(condition: any, cb: (sb: MySqlSelectBuilder) => MySqlSelectBuilder) {
    const b1 = new MySqlSelectBuilder();
    b1.mergeQuery(this.#query);
    if (condition) {
      const b2 = cb(new MySqlSelectBuilder());
      b1.mergeQuery(b2.#query);
    }
    return b1;
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
