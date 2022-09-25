import { Property, REQUIRED } from '@ditsmod/openapi';

export class Model1 {
  @Property({ minimum: 3, maximum: 50, description: `ID should be between 3 and 50.` })
  id: number;

  @Property({ minLength: 3, maxLength: 10 })
  username: string;

  @Property({ [REQUIRED]: true }, Number)
  numbers: number[];
}

export class Model2 {
  @Property()
  model1: Model1;
}
