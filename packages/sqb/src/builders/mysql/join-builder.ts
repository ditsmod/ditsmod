import { Class } from '@ditsmod/core';
import { OneSqlExpression } from '../../types';

export class JoinBuilder {
  on(...clause: OneSqlExpression) {
    return new AndOrBuilder([clause.join(' ')], 4);
  }

  using<T1 extends Class, T2 extends Class>(
    classes: [T1, T2],
    ...fields: (keyof InstanceType<T1> & keyof InstanceType<T2>)[]
  ) {
    return fields.join(', ');
  }
}

export class ExpressionBuilder {
  isTrue(...condition: OneSqlExpression) {
    return new AndOrBuilder([condition.join(' ')]);
  }
}

export class AndOrBuilder {
  protected expressions: string[] = [];

  constructor(expressions: string[] = [], protected spaces = 2) {
    this.expressions.push(...expressions);
  }

  and(...clause: OneSqlExpression) {
    const b = new AndOrBuilder(this.expressions, this.spaces);
    b.expressions.push(`${' '.repeat(this.spaces - 1)} and ${clause.join(' ')}`);
    return b;
  }

  or(...clause: OneSqlExpression) {
    const b = new AndOrBuilder(this.expressions, this.spaces);
    b.expressions.push(`${' '.repeat(this.spaces - 1)} or ${clause.join(' ')}`);
    return b;
  }
}

export class OpenedAndOrBuilder extends AndOrBuilder {
  declare expressions: string[];
}
