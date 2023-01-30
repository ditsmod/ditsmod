import { Class } from '@ditsmod/core';
import { OneSqlExpression } from '../../types';

export class JoinBuilder {
  on(...clause: OneSqlExpression) {
    return new AndOrBuilder([clause.join(' ')]);
  }

  using<T1 extends Class, T2 extends Class>(
    classes: [T1, T2],
    ...fields: (keyof InstanceType<T1> & keyof InstanceType<T2>)[]
  ) {
    return fields.join(', ');
  }
}

export class AndOrBuilder {
  protected expressions: string[] = [];

  constructor(expressions: string[] = []) {
    this.expressions.push(...expressions);
  }

  and(...clause: OneSqlExpression) {
    const b = new AndOrBuilder(this.expressions);
    b.expressions.push(`    and ${clause.join(' ')}`);
    return b;
  }

  or(...clause: OneSqlExpression) {
    const b = new AndOrBuilder(this.expressions);
    b.expressions.push(`    or ${clause.join(' ')}`);
    return b;
  }
}

export class OpenedAndOrBuilder extends AndOrBuilder {
  declare expressions: string[];
}
