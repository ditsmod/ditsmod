import type { ParamsMeta } from './top/types-and-models.js';

export type ParentArgsShape = number | ParentArgsShape[];

export class ParentParams {
  static getTokensAndArgsShape(paramsByClass: (ParamsMeta | null)[][]) {
    let aParamsMeta: (ParamsMeta | null)[] = [];
    let argsShape: ParentArgsShape[] = [];
    let hasParentParams: boolean = false;

    for (const params of paramsByClass) {
      const parentTokens = aParamsMeta;
      const parentShape = argsShape;

      const nextTokens: (ParamsMeta | null)[] = [];
      const nextShape: ParentArgsShape[] = [];

      for (const param of params) {
        if (param?.[0] === ParentParams) {
          hasParentParams = true;
          const offset = nextTokens.length;

          nextTokens.push(...parentTokens);
          nextShape.push(this.rebaseShape(parentShape, offset));
        } else {
          const index = nextTokens.length;

          nextTokens.push(param);
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

  protected static rebaseShape(shape: ParentArgsShape[], offset: number): ParentArgsShape[] {
    return shape.map((item) => {
      return Array.isArray(item) ? this.rebaseShape(item, offset) : item + offset;
    });
  }
}
