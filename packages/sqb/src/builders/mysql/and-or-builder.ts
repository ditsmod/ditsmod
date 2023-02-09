import { OneSqlExpression } from '../../types';

export class AndOrBuilder<T extends object = any> {
  protected expressions: string[] = [];
  protected index = -1;
  protected escape: (value: any) => string = (value) => value;

  constructor(expressions: string[] = [], protected spaces = 2, escape?: (value: any) => string) {
    this.escape = escape || this.escape;
    this.expressions.push(...expressions);
  }

  and(obj: T): AndOrBuilder;
  and(...clause: OneSqlExpression): AndOrBuilder;
  and(...clause: OneSqlExpression) {
    const b = new AndOrBuilder(this.expressions, this.spaces, this.escape);
    const firstEl = clause[0];
    const indentation = ' '.repeat(this.spaces - 1);
    let currentClause = '';
    if (clause.length == 1 && typeof firstEl == 'object') {
      const clauses: string[] = [];
      for (const prop in firstEl) {
        clauses.push(`${prop} = ${this.escape(firstEl[prop])}`);
      }
      currentClause = clauses.join(`\n${indentation} and `);
    } else if (this.expressions.length == 0) {
      currentClause = clause.join(' ');
    } else {
      currentClause = `${indentation} and ${clause.join(' ')}`;
    }
    b.expressions.push(currentClause);
    return b;
  }

  or(...clause: OneSqlExpression) {
    const b = new AndOrBuilder(this.expressions, this.spaces, this.escape);
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
