import { AndOrBuilder } from './and-or-builder';
import { ExpressionBuilder } from './expression-builder';
import { JoinBuilder } from './join-builder';
import { MySqlSelectBuilder } from './mysql-select-builder';

class UpdateQuery {
  update: string[] = [];
  join: string[] = [];
  set: string[] = [];
  where: string[] = [];
  orderBy: string[] = [];
  limit: string = '';
}

class UpdateBuilderConfig {
  indentation = 0;
}

type JoinType = 'join' | 'left join' | 'right join';
type JoinCallback = (joinBuilder: JoinBuilder) => AndOrBuilder | string;
type SelectCallback = (selectBuilder: MySqlSelectBuilder) => MySqlSelectBuilder;

export class UpdateBuilder {
  #query = new UpdateQuery();
  #config = new UpdateBuilderConfig();

  protected mergeQuery(query: Partial<UpdateQuery>) {
    this.#query.update.push(...(query.update || []));
    this.#query.join.push(...(query.join || []));
    this.#query.set.push(...(query.set || []));
    this.#query.where.push(...(query.where || []));
    this.#query.orderBy.push(...(query.orderBy || []));
    this.#query.limit = query.limit || '';
    return this.#query;
  }

  update(alias: string, selectCallback: SelectCallback): UpdateBuilder;
  update(table: string): UpdateBuilder;
  update(tableOrAlias: string, selectCallback?: SelectCallback) {
    const builder = new UpdateBuilder();
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

  protected baseJoin(joinType: JoinType, table: string, joinCallback: JoinCallback): UpdateBuilder;
  protected baseJoin(
    joinType: JoinType,
    alias: string,
    selectCallback: SelectCallback,
    joinCallback: JoinCallback
  ): UpdateBuilder;
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
    const updateBuilder = new UpdateBuilder();
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

  join(table: string, joinCallback: JoinCallback): UpdateBuilder;
  join(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): UpdateBuilder;
  join(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('join', table, selectOrJoinCallback, joinCallback);
  }

  leftJoin(table: string, joinCallback: JoinCallback): UpdateBuilder;
  leftJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): UpdateBuilder;
  leftJoin(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('left join', table, selectOrJoinCallback, joinCallback);
  }

  rightJoin(table: string, joinCallback: JoinCallback): UpdateBuilder;
  rightJoin(alias: string, selectCallback: SelectCallback, joinCallback: JoinCallback): UpdateBuilder;
  rightJoin(table: string, selectOrJoinCallback: any, joinCallback?: any) {
    return this.baseJoin('right join', table, selectOrJoinCallback, joinCallback);
  }

  set<T extends object>(obj: T): UpdateBuilder {
    const updateBuilder = new UpdateBuilder();
    const updateQuery = updateBuilder.mergeQuery(this.#query);
    for (const prop in obj) {
      updateQuery.set.push(`${prop} = ${obj[prop]}`);
    }
    return updateBuilder;
  }

  where(cb: (eb: ExpressionBuilder) => AndOrBuilder) {
    const b = new UpdateBuilder();
    const eb = new ExpressionBuilder();
    b.mergeQuery(this.#query);
    b.mergeQuery({ where: [...cb(eb)] });
    return b;
  }

  orderBy(...fields: [string, ...string[]]) {
    const b = new UpdateBuilder();
    b.mergeQuery(this.#query).orderBy.push(...fields);
    return b;
  }

  limit(rowCount: number): UpdateBuilder;
  limit(offset: number, rowCount: number): UpdateBuilder;
  limit(offsetOrCount: number, rowCount?: number) {
    const b = new UpdateBuilder();
    const limit = rowCount ? [offsetOrCount, rowCount] : [];
    b.mergeQuery(this.#query).limit = limit.join(', ');
    return b;
  }

  $if(condition: any, updateCallback: (updatebuilder: UpdateBuilder) => UpdateBuilder) {
    const b1 = new UpdateBuilder();
    b1.mergeQuery(this.#query);
    if (condition) {
      const b2 = updateCallback(new UpdateBuilder());
      b1.mergeQuery(b2.#query);
    }
    return b1;
  }

  toString(): string {
    const { update, join, set, where, orderBy, limit } = this.#query;
    const indentation = ' '.repeat(this.#config.indentation);
    const separator = `\n${indentation}`;
    let sql = '';

    if (update.length) {
      sql += `${separator}update ${update.join(', ')}`;
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
