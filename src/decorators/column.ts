import { makePropTypeDecorator } from 'ts-di';

export interface ColumnsDecoratorFactory<T = any> {
  (options?: T): any;
  new (options?: T): T;
}

export const Column = makePropTypeDecorator('Column', (data: any) => data) as ColumnsDecoratorFactory;
