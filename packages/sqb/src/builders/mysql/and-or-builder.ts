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

  protected andOr(type: AndOrType, obj: T): AndOrBuilder;
  protected andOr(type: AndOrType, ...clause: OneSqlExpression): AndOrBuilder;
  protected andOr(type: AndOrType, ...clause: OneSqlExpression) {
    const b = new AndOrBuilder(this.expressions, this.spaces, this.escape);
    const firstEl = clause[0];
    const indentation = ' '.repeat(this.spaces - 1);
    let currentClause = '';
    if (clause.length == 1 && typeof firstEl == 'object') {
      const clauses: string[] = [];
      for (const prop in firstEl) {
        clauses.push(`${prop} = ${this.escape(firstEl[prop])}`);
      }
      currentClause = clauses.join(`\n${indentation} ${type} `);
    } else if (this.expressions.length == 0) {
      currentClause = clause.join(' ');
    } else {
      currentClause = `${indentation} ${type} ${clause.join(' ')}`;
    }
    b.expressions.push(currentClause);
    return b;
  }

  and(obj: T): AndOrBuilder;
  and(...clause: OneSqlExpression): AndOrBuilder;
  and(...clause: OneSqlExpression) {
    return this.andOr('and', ...clause);
  }

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
