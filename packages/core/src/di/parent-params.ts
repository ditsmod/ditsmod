import type { ParamsMeta } from './top/types-and-models.js';

export type ArgsShape = number | ArgsShape[];

export class ParentParams {
  static getTokensAndArgsShape(paramsByClass: (ParamsMeta | null)[][]) {
    let tokens: (ParamsMeta | null)[] = [];
    let argsShape: ArgsShape[] = [];

    for (const params of paramsByClass) {
      const parentTokens = tokens;
      const parentShape = argsShape;

      const nextTokens: (ParamsMeta | null)[] = [];
      const nextShape: ArgsShape[] = [];

      for (const param of params) {
        if (param?.[0] === ParentParams) {
          const offset = nextTokens.length;

          nextTokens.push(...parentTokens);
          nextShape.push(this.rebaseShape(parentShape, offset));
        } else {
          const index = nextTokens.length;

          nextTokens.push(param);
          nextShape.push(index);
        }
      }

      tokens = nextTokens;
      argsShape = nextShape;
    }

    return { tokens, argsShape };
  }

  static getArgs(shape: ArgsShape[], results: unknown[]): unknown[] {
    return shape.map((item) => {
      return Array.isArray(item) ? this.getArgs(item, results) : results[item];
    });
  }

  protected static rebaseShape(shape: ArgsShape[], offset: number): ArgsShape[] {
    return shape.map((item) => {
      return Array.isArray(item) ? this.rebaseShape(item, offset) : item + offset;
    });
  }
}
