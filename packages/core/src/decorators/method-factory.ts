import { makePropDecorator } from '@ts-stack/di';

/**
 * Uses to mark methods in a class for FactoryProvider.
 */
export const methodFactory = makePropDecorator();