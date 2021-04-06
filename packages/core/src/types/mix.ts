import { Type } from '@ts-stack/di';

export type AnyFn = (...args: any[]) => any;

/**
 * It is just `{ [key: string]: any }` an object interface.
 */
 export interface AnyObj {
  [key: string]: any;
}

export interface CanActivate {
  canActivate(params?: any[]): boolean | number | Promise<boolean | number>;
}

export type ControllerType = Type<any>;

export interface DecoratorMetadata<MV extends AnyObj = AnyObj> {
  otherDecorators: any[];
  /**
   * Decorator value.
   */
  value: MV;
}
