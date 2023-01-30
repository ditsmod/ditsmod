import { Class } from '@ditsmod/core';

export class JoinBuilder {
  on(clause: string) {
    return new JoinOnBuilder([clause]);
  }

  using<T1 extends Class, T2 extends Class>(
    classes: [T1, T2],
    ...fields: (keyof InstanceType<T1> & keyof InstanceType<T2>)[]
  ) {
    return fields.join(', ');
  }
}

export class JoinOnBuilder {
  protected join: string[] = [];

  constructor(join: string[]) {
    this.join.push(...join);
  }

  and(clause: string) {
    const b = new JoinOnBuilder(this.join);
    b.join.push(`    and ${clause}`);
    return b;
  }

  or(clause: string) {
    const b = new JoinOnBuilder(this.join);
    b.join.push(`    or ${clause}`);
    return b;
  }
}

export class OpenedJoinOnBuilder extends JoinOnBuilder {
  declare join: string[];
}
