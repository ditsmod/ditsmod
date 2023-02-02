import { OneSqlExpression } from '../../types';

export class AndOrBuilder {
  protected expressions: string[] = [];
  protected index = -1;

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

  protected [Symbol.iterator]() {
    return this;
  }

  protected next() {
    return { value: this.expressions[++this.index], done: !(this.index in this.expressions) };
  }
}
