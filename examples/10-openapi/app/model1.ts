import { Column } from '@ditsmod/openapi';

export class Model1 {
  @Column()
  property1: string;
  @Column()
  property2: number;
}
