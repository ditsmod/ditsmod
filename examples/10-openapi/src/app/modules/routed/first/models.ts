import { Property } from '@ditsmod/openapi';

export class Model1 {
  @Property()
  property1: string;
  @Property()
  property2: number;
}

export class Model2 {
  @Property({ minimum: 1, maximum: 100000 })
  resourceId: number;

  @Property()
  model1: Model1;

  @Property({ type: 'array' }, Number)
  model2: number[];

  @Property({ type: 'array' }, Model1)
  model3: Model1[];
}
