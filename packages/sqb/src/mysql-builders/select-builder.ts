import { JoinBuilder, JoinOnBuilder, OpenedJoinOnBuilder } from './join-builder';

class SelectQuery {
  select: string[] = [];
  from: object[] = [];
  join: any[] = [];
  where: string[] = [];
}

export class SelectBuilder {
  #query = new SelectQuery();

  protected mergeQuery(query: Partial<SelectQuery> = new SelectQuery()) {
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
    const query = b.mergeQuery(this.#query);
    query.select.push(...fields);
    return b;
  }

  from(...objects: object[]) {
    const b = new SelectBuilder();
    const query = b.mergeQuery(this.#query);
    query.from.push(...objects);
    return b;
  }

  join(table: object, cb: (jb: JoinBuilder) => JoinOnBuilder | Pick<JoinBuilder, 'toString'>) {
    const b = new SelectBuilder();
    const jb = new JoinBuilder();
    const jbResult = cb(jb);
    if (jbResult instanceof JoinOnBuilder) {
      const query = (jbResult as OpenedJoinOnBuilder).getQuery();
      query.join[0] = `join ${table}\n  on ${query.join.at(0)}`;
      b.mergeQuery(this.#query);
      b.mergeQuery(query);
    }
    return b;
  }

  $if(condition: any, cb: (sb: SelectBuilder) => SelectBuilder) {
    const b = new SelectBuilder();
    b.mergeQuery(this.#query);
    if (condition) {
      const additionalSelect = cb(new SelectBuilder());
      additionalSelect.mergeQuery(additionalSelect.#query);
    }
    return b;
  }

  where(...expression: string[]) {
    const b = new SelectBuilder();
    const query = b.mergeQuery(this.#query);
    query.where.push(...expression);
    return b;
  }

  toString(): string {
    this.mergeQuery(); // Init if query is empty.
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
