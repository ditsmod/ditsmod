import { makeDecorator, Type } from '@ts-stack/di';

export interface EntityDecoratorFactory<T = any> {
  (options?: T): any;
  new (options?: T): EntityDecorator & T;
}

export interface EntityDecorator {
  tableName?: string;
}

export const Entity: EntityDecoratorFactory = makeDecorator('Entity', (data: any) => data);

export class ModelMetadata {
  entityMetadata: any;
  columnMetadata: any;
}

export interface Translator {
  select(): string;
  insert(): string;
}

export interface DatabaseMetadata {
  dbService: Type<DatabaseService>;
  tableName: string;
  primaryColumns: string[];
}

export interface DatabaseService {
  query: (...args: any[]) => any;
}

export abstract class Model {}
export type EntityModel = typeof Model;
export type ModelMetadataMap = Map<EntityModel, ModelMetadata>;
