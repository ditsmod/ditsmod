import { Column } from '@ditsmod/openapi';
import { VALIDATION_ARGS } from '@ditsmod/openapi-validation';

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
    [VALIDATION_ARGS]: [OpenapiModelsDict, 'invalidUserName'],
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
