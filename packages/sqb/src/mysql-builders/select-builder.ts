import { JoinBuilder, JoinOnBuilder, OpenedJoinOnBuilder } from './join-builder';

class Query {
  select: string[];
  from: object[];
  join: any[];
  where: string[];
}

export class SelectBuilder {
  #query: Query;

  protected mergeQuery(query: Query) {
    if (this.#query) {
      this.#query.select.push(...(query?.select || []));
      this.#query.from.push(...(query?.from || []));
      this.#query.join.push(...(query?.join || []));
      this.#query.where.push(...(query?.where || []));
    } else {
      this.#query = { ...query };
      this.#query.select = (query?.select || []).slice();
      this.#query.from = (query?.from || []).slice();
      this.#query.join = (query?.join || []).slice();
      this.#query.where = (query?.where || []).slice();
    }
    return this.#query;
  }

  select(...fields: any[]) {
    fields.forEach((f, i) => {
      if (typeof f != 'string') {
        const msg = `SelectBuilder: failed build query select: element with ${i} index must have string type (got ${typeof f})`;
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
    objects.forEach((obj) => query.from.push(obj));
    return b;
  }

  join(obj: object, cb: (jb: JoinBuilder) => JoinOnBuilder | Pick<JoinBuilder, 'toString'>) {
    const b = new SelectBuilder();
    const jb = new JoinBuilder();
    const jbResult = cb(jb);
    if (jbResult instanceof JoinOnBuilder) {
      const query = (jbResult as OpenedJoinOnBuilder).mergeQuery(new Query());
      query.join[0] = `join ${obj}\n  on ${query.join.at(0)}`;
      b.mergeQuery(this.#query);
      b.mergeQuery(query as Query);
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
    this.mergeQuery(new Query()); // Init if query is empty.
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
