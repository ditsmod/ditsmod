import { Type } from '@ts-stack/di';
import { ServiceProvider } from '../types/mix';

export function providerUseValue<T extends Type<any>>(provide: T, useValue: T['prototype'], multi?: boolean): ServiceProvider {
  return { provide, useValue, multi };
}