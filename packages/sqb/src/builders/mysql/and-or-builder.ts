import { OneSqlExpression } from '../../types';

export class AndOrBuilder<T extends object = any> {
  protected expressions: string[] = [];
  protected index = -1;

  constructor(expressions: string[] = [], protected spaces = 2) {
    this.expressions.push(...expressions);
  }

  and(obj: T): AndOrBuilder;
  and(...clause: OneSqlExpression): AndOrBuilder;
  and(...clause: OneSqlExpression) {
    const b = new AndOrBuilder(this.expressions, this.spaces);
    const firstEl = clause[0];
    let currentClause = '';
    if (clause.length == 1 && typeof firstEl == 'object') {
      const clauses: string[] = [];
      for (const prop in firstEl) {
        clauses.push(`${prop} = ${firstEl[prop]}`);
      }
      currentClause = clauses.join(`${' '.repeat(this.spaces - 1)} and `);
    } else if (this.expressions.length == 0) {
      currentClause = clause.join(' ');
    } else {
      currentClause = `${' '.repeat(this.spaces - 1)} and ${clause.join(' ')}`;
    }
    b.expressions.push(currentClause);
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
