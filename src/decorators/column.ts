import { makePropDecorator } from 'ts-di';

export type ColumnDecoratorFactory = (type?: string) => PropertyDecorator;

export const Column = makePropDecorator('Column') as ColumnDecoratorFactory;
