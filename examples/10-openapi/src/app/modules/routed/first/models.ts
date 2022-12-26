import { property } from '@ditsmod/openapi';

export class Model1 {
  @property()
  property1: string;
  @property()
  property2: number;
}

export class Model2 {
  @property({ minimum: 1, maximum: 100000 })
  resourceId: number;

  @property()
  model1: Model1;

  @property({ type: 'array' }, { array: Number })
  model2: number[];

  @property({ type: 'array' }, { array: Model1 })
  model3: Model1[];
}
