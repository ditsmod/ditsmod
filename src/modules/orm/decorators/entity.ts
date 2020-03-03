import { makeDecorator, Type } from '@ts-stack/di';

export interface EntityDecoratorFactory<T = any> {
  (options?: T): any;
  new (options?: T): EntityDecorator & T;
}

export interface EntityDecorator {
  tableName?: string;
}

export const Entity: EntityDecoratorFactory = makeDecorator('Entity', (data: any) => data);

export class MetadataModel {
  entityMetadata: any;
  columnMetadata: any;
}

export interface DatabaseService {
  query: (...args: any[]) => any;
}

export abstract class Model {}
export type EntityModel = typeof Model;
