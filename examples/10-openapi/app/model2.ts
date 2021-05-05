import { Column } from '@ditsmod/openapi';
import { Model1 } from './model1';

export class Model2 {
  @Column({ minimum: 1, maximum: 100000 })
  resourceId: number;

  @Column()
  model1: Model1;
}
