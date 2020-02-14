import { makePropTypeDecorator } from 'ts-di';

import { ObjectAny } from '../types/types';

export interface ColumnsDecoratorFactory<T = any> {
  (options?: T): any;
  new (options?: T): ColumnDecorator & T;
}

export type ColumnDecorator = <T>(
  target: ObjectAny,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>
) => ColumnDecoratorMetadata;

export interface ColumnDecoratorMetadata {
  [key: string]: [ColumnType, ...ColumnMetadata[]];
}

// tslint:disable-next-line: ban-types
export type ColumnType = undefined | Boolean | String | Array<any> | Number | Object;

export interface ColumnMetadata {
  isPrimaryColumn?: boolean;
  isGeneratedValue?: boolean;
}

export const Column = makePropTypeDecorator('Column', (data: any) => data) as ColumnsDecoratorFactory;
