import { Column } from '@ditsmod/openapi';

export class Model1 {
  @Column()
  property1: string;
  @Column()
  property2: number;
}

export class Model2 {
  @Column({ minimum: 1, maximum: 100000 })
  resourceId: number;

  @Column()
  model1: Model1;

  @Column({ type: 'array' }, Number)
  model2: number[];

  @Column({ type: 'array' }, Model1)
  model3: Model1[];
}
