import { Column, REQUIRED } from '@ditsmod/openapi';

export class Model1 {
  @Column({ minimum: 3, maximum: 50, description: `ID should be between 3 and 50.` })
  id: number;

  @Column({ minLength: 3, maxLength: 10 })
  username: string;

  @Column({ [REQUIRED]: true }, Number)
  numbers: number[];
}

export class Model2 {
  @Column()
  model1: Model1;
}
