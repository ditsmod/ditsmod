import { inject, type InjectTransformResult } from './decorators.js';
import { DecoratorAndValue } from './top/decorator-and-value.js';
import type { ParameterMeta } from './top/types-and-models.js';

export type ParentArgsShape = number | ParentArgsShape[];

export class ParentParams {
  static getTokensAndArgsShape(parameterMetaOfClass: (ParameterMeta | null)[][]) {
    let aParamsMeta: (ParameterMeta | null)[] = [];
    let argsShape: ParentArgsShape[] = [];
    let hasParentParams: boolean = false;

    for (const aParameterMeta of parameterMetaOfClass) {
      const parentTokens = aParamsMeta;
      const parentShape = argsShape;

      const nextTokens: (ParameterMeta | null)[] = [];
      const nextShape: ParentArgsShape[] = [];

      for (const parameterMeta of aParameterMeta) {
        if (this.hasParentParams(parameterMeta)) {
          hasParentParams = true;
          const offset = nextTokens.length;

          nextTokens.push(...parentTokens);
          nextShape.push(this.rebaseShape(parentShape, offset));
        } else {
          const index = nextTokens.length;

          nextTokens.push(parameterMeta);
          nextShape.push(index);
        }
      }

      aParamsMeta = nextTokens;
      argsShape = nextShape;
    }

    return { aParamsMeta, argsShape, hasParentParams };
  }

  static getArgs(shape: ParentArgsShape[], results: unknown[]): unknown[] {
    return shape.map((item) => {
      return Array.isArray(item) ? this.getArgs(item, results) : results[item];
    });
  }

  protected static hasParentParams(parameterMeta: ParameterMeta | null): boolean | void {
    let token: any;
    for (const parameterItem of parameterMeta || []) {
      if (parameterItem instanceof DecoratorAndValue) {
        if (parameterItem.decoratorId === inject) {
          return ParentParams === (parameterItem.value as InjectTransformResult).token;
        }
      } else {
        token = parameterItem;
      }
    }
    return token === ParentParams;
  }

  protected static rebaseShape(shape: ParentArgsShape[], offset: number): ParentArgsShape[] {
    return shape.map((item) => {
      return Array.isArray(item) ? this.rebaseShape(item, offset) : item + offset;
    });
  }
}
