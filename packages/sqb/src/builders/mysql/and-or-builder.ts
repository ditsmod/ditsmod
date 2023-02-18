import { OneSqlExpression } from '../../types';

type AndOrType = 'and' | 'or';

export class ExpressionBuilder<T extends object = any> {
  constructor(protected escape: (value: any) => string = (value) => value) {}

  isTrue(obj: T): AndOrBuilder;
  isTrue(...condition: OneSqlExpression): AndOrBuilder;
  isTrue(...condition: OneSqlExpression) {
    return new AndOrBuilder([], 2, this.escape).and(...condition);
  }
}

export class AndOrBuilder<T extends object = any> {
  protected index = -1;

  constructor(
    protected expressions: string[] = [],
    protected spaces = 2,
    protected escape: (value: any) => string = (value) => value
  ) {}

  protected andOr(type: AndOrType, callback: (cb: AndOrBuilder) => AndOrBuilder): AndOrBuilder;
  protected andOr(type: AndOrType, obj: T): AndOrBuilder;
  protected andOr(type: AndOrType, ...clause: OneSqlExpression): AndOrBuilder;
  protected andOr(type: AndOrType, ...clause: OneSqlExpression) {
    const [firstEl, , thirdEl] = clause;
    if (thirdEl) {
      clause[2] = this.escape(thirdEl);
    }
    const indentation = ' '.repeat(this.spaces - 1);
    let clauseAsStr = '';
    if (clause.length == 1 && typeof firstEl == 'object') {
      const clauses: string[] = [];
      for (const prop in firstEl) {
        clauses.push(`${prop} = ${this.escape(firstEl[prop])}`);
      }
      clauseAsStr = clauses.join(`\n${indentation} ${type} `);
    } else if (clause.length == 1 && typeof firstEl == 'function') {
      const b = new AndOrBuilder([], this.spaces, this.escape);
      const result = firstEl(b) as AndOrBuilder;
      clauseAsStr = `  ${type} (\n    ${[...result].join('\n    ')}\n  )`;
    } else if (this.expressions.length == 0) {
      clauseAsStr = clause.join(' ');
    } else {
      clauseAsStr = `${indentation} ${type} ${clause.join(' ')}`;
    }
    const b = new AndOrBuilder(this.expressions, this.spaces, this.escape);
    b.expressions.push(clauseAsStr);
    return b;
  }

  and(callback: (cb: AndOrBuilder) => AndOrBuilder): AndOrBuilder;
  and(obj: T): AndOrBuilder;
  and(...clause: OneSqlExpression): AndOrBuilder;
  and(...clause: OneSqlExpression) {
    return this.andOr('and', ...clause);
  }

  or(callback: (cb: AndOrBuilder) => AndOrBuilder): AndOrBuilder;
  or(obj: T): AndOrBuilder;
  or(...clause: OneSqlExpression): AndOrBuilder;
  or(...clause: OneSqlExpression) {
    return this.andOr('or', ...clause);
  }

  protected [Symbol.iterator]() {
    return this;
  }

  protected next() {
    return { value: this.expressions[++this.index], done: !(this.index in this.expressions) };
  }
}
