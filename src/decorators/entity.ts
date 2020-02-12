import { makeDecorator } from 'ts-di';

export interface EntityDecoratorFactory<T = any> {
  (options?: T): any;
  new (options?: T): T;
}

export const Entity: EntityDecoratorFactory = makeDecorator('Entity', (data: any) => data);
