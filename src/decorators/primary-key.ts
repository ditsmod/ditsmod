import { makePropDecorator } from 'ts-di';

export type PrimaryKeyDecoratorFactory = (type?: string) => PropertyDecorator;

export const PrimaryKey = makePropDecorator('PrimaryKey') as PrimaryKeyDecoratorFactory;
