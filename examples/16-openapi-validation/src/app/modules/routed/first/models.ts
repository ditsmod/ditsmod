import { property, REQUIRED } from '@ditsmod/openapi';

export class Model1 {
  @property({ minimum: 3, maximum: 50, description: 'ID should be between 3 and 50.' })
  id: number;

  @property({ minLength: 3, maxLength: 10 })
  username: string;

  @property({ [REQUIRED]: true }, { array: Number })
  numbers: number[];
}

export class Model2 {
  @property()
  model1: Model1;
}
