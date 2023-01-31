import { OneSqlExpression } from '../../types';
import { AndOrBuilder } from './and-or-builder';

export class ExpressionBuilder {
  isTrue(...condition: OneSqlExpression) {
    return new AndOrBuilder([condition.join(' ')]);
  }
}
