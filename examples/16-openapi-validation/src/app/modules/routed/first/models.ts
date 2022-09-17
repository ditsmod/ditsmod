import { Column } from '@ditsmod/openapi';
import { getInvalidArgs, IS_REQUIRED } from '@ditsmod/openapi-validation';

import { OpenapiModelsDict } from './locales/current';

export class Model1 {
  @Column()
  property1: string;
  @Column()
  property2: number;
}

export class Model2 {
  @Column({ minimum: 1, maximum: 100000 })
  resourceId: number;

  @Column({
    [IS_REQUIRED]: true,
    ...getInvalidArgs(OpenapiModelsDict, 'invalidUserName'),
    description: `User name should be between 0 and 10 symbols.`,
  })
  username: string;

  // @Column()
  // model1: Model1;

  // @Column({ type: 'array' }, Number)
  // model2: number[];

  // @Column({ type: 'array' }, Model1)
  // model3: Model1[];
}
