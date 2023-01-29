import { JoinBuilder, JoinOnBuilder, OpenedJoinOnBuilder } from './join-builder';

class SelectQuery {
  select: string[] = [];
  from: object[] = [];
  join: any[] = [];
  where: string[] = [];
}

export class SelectBuilder {
  #query = new SelectQuery();

  protected mergeQuery(query: Partial<SelectQuery>) {
    this.#query.select.push(...(query.select || []));
    this.#query.from.push(...(query.from || []));
    this.#query.join.push(...(query.join || []));
    this.#query.where.push(...(query.where || []));
    return this.#query;
  }

  select(...fields: any[]) {
    fields.forEach((f, i) => {
      if (typeof f != 'string') {
        const msg = `SelectBuilder: failed query select building: element with ${i} index must have string type (got ${typeof f})`;
        throw new TypeError(msg);
      }
    });
    const b = new SelectBuilder();
    b.mergeQuery(this.#query).select.push(...fields);
    return b;
  }

  from(...tables: object[]) {
    const b = new SelectBuilder();
    b.mergeQuery(this.#query).from.push(...tables);
    return b;
  }

  protected baseJoin(
    joinType: 'join' | 'left join' | 'right join',
    table: object,
    cb: (jb: JoinBuilder) => JoinOnBuilder | string
  ) {
    const b = new SelectBuilder();
    const jb = new JoinBuilder();
    const jbResult = cb(jb);
    if (jbResult instanceof JoinOnBuilder) {
      const query = (jbResult as OpenedJoinOnBuilder).getQuery();
      query.join[0] = `${joinType} ${table}\n  on ${query.join.at(0)}`;
      b.mergeQuery(this.#query);
      b.mergeQuery(query);
    } else {
      b.mergeQuery(this.#query);
      b.mergeQuery({ join: [`${joinType} ${table}\n  using(${jbResult})`] });
    }
    return b;
  }

  join(table: object, cb: (jb: JoinBuilder) => JoinOnBuilder | string) {
    return this.baseJoin('join', table, cb);
  }

  leftJoin(table: object, cb: (jb: JoinBuilder) => JoinOnBuilder | string) {
    return this.baseJoin('left join', table, cb);
  }

  rightJoin(table: object, cb: (jb: JoinBuilder) => JoinOnBuilder | string) {
    return this.baseJoin('right join', table, cb);
  }

  $if(condition: any, cb: (sb: SelectBuilder) => SelectBuilder) {
    const b1 = new SelectBuilder();
    b1.mergeQuery(this.#query);
    if (condition) {
      const b2 = cb(new SelectBuilder());
      b1.mergeQuery(b2.#query);
    }
    return b1;
  }

  where(...expression: string[]) {
    const b = new SelectBuilder();
    b.mergeQuery(this.#query).where.push(...expression);
    return b;
  }

  toString(): string {
    const { select, from, join, where } = this.#query;
    let sql = '';

    if (select.length) {
      sql += `select\n  ${select.join(',\n  ')}`;
    }
    if (from.length) {
      sql += `\nfrom ${from.join(', ')}`;
    }
    if (join.length) {
      sql += `\n${join.join('\n')}`;
    }
    if (where.length) {
      sql += `\nwhere ${where.join('\n  and ')}`;
    }

    return sql;
  }
}
