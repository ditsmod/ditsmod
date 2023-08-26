import { Class } from '@ditsmod/core';

import { OneSqlExpression } from '../../types.js';
import { AndOrBuilder } from './and-or-builder.js';

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
