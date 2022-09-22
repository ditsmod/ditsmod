import { Column } from '@ditsmod/openapi';
import { getInvalidArgs, IS_REQUIRED } from '@ditsmod/openapi-validation';

import { OpenapiModelsDict } from './locales/current';

export class Model1 {
  @Column({ minimum: 3, maximum: 50, description: `ID should be between 3 and 50.` })
  resourceId: number;

  @Column({
    [IS_REQUIRED]: true,
    ...getInvalidArgs(OpenapiModelsDict, 'invalidUserName'),
  })
  username: string;
}
