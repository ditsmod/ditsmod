import { Class } from '@ditsmod/core';

class JoinQuery {
  join: any[];
}

export class JoinBuilder {
  #query: JoinQuery;

  protected mergeQuery(query: JoinQuery) {
    if (this.#query) {
      this.#query.join.push(...(query?.join || []));
    } else {
      this.#query = { ...query };
      this.#query.join = (query?.join || []).slice();
    }
    return this.#query;
  }

  on(clause: string) {
    const b = new JoinOnBuilder();
    const query = (b as OpenedJoinOnBuilder).mergeQuery(new JoinQuery());
    query.join.push(clause);
    return b;
  }

  using<T1 extends Class, T2 extends Class>(
    classes: [T1, T2],
    ...fields: (keyof InstanceType<T1> & keyof InstanceType<T2>)[]
  ): Pick<JoinBuilder, 'toString'> {
    return this;
  }

  toString(): string {
    return '';
  }
}

export class JoinOnBuilder {
  #query: JoinQuery;

  protected mergeQuery(query: JoinQuery) {
    if (this.#query) {
      this.#query.join.push(...(query?.join || []));
    } else {
      this.#query = { ...query };
      this.#query.join = (query?.join || []).slice();
    }
    return this.#query;
  }

  and(clause: string) {
    const b = new JoinOnBuilder();
    const query = b.mergeQuery(this.#query);
    query.join.push(`    and ${clause}`);
    return b;
  }

  or(clause: string) {
    const b = new JoinOnBuilder();
    const query = b.mergeQuery(this.#query);
    query.join.push(`    or ${clause}`);
    return b;
  }
}

export abstract class OpenedJoinOnBuilder extends JoinOnBuilder {
  override mergeQuery(query: JoinQuery): JoinQuery {
    return '' as any;
  }
}
