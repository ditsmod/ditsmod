import { Class } from '@ditsmod/core';

class JoinQuery {
  join: string[] = [];
}

export class JoinBuilder {
  on(clause: string) {
    const b = new JoinOnBuilder();
    (b as OpenedJoinOnBuilder).getQuery().join.push(clause);
    return b;
  }

  using<T1 extends Class, T2 extends Class>(
    classes: [T1, T2],
    ...fields: (keyof InstanceType<T1> & keyof InstanceType<T2>)[]
  ) {
    return fields.join(', ');
  }
}

export class JoinOnBuilder {
  #query = new JoinQuery();

  protected mergeQuery(query = new JoinQuery()) {
    this.#query.join.push(...query.join);
    return this.#query;
  }

  protected getQuery() {
    return this.#query;
  }

  and(clause: string) {
    const b = new JoinOnBuilder();
    b.mergeQuery(this.#query).join.push(`    and ${clause}`);
    return b;
  }

  or(clause: string) {
    const b = new JoinOnBuilder();
    b.mergeQuery(this.#query).join.push(`    or ${clause}`);
    return b;
  }
}

export abstract class OpenedJoinOnBuilder extends JoinOnBuilder {
  override mergeQuery(query: JoinQuery): JoinQuery {
    return super.mergeQuery(query);
  }

  override getQuery(): JoinQuery {
    return super.getQuery();
  }
}
