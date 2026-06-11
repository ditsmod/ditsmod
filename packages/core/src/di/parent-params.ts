import { inject, type InjectTransformResult } from './decorators.js';
import { DecoratorAndValue } from './top/decorator-and-value.js';
import type { ParameterMeta } from './top/types-and-models.js';

export type ParentRecipe = number | ParentRecipe[];

export class ParentParams {
  static getParamsMetaAndRecipe(paramsMetaOfClass: (ParameterMeta | null)[][]) {
    let aParamsMeta: (ParameterMeta | null)[] = [];
    let recipe: ParentRecipe[] = [];
    let hasParentParams: boolean = false;

    for (const aParameterMeta of paramsMetaOfClass) {
      const parentParamsMeta = aParamsMeta;
      const parentRecipe = recipe;

      const nextParamsMeta: (ParameterMeta | null)[] = [];
      const nextRecipe: ParentRecipe[] = [];

      for (const parameterMeta of aParameterMeta) {
        if (this.hasParentParams(parameterMeta)) {
          hasParentParams = true;
          const offset = nextParamsMeta.length;

          nextParamsMeta.push(...parentParamsMeta);
          nextRecipe.push(this.rebaseRecipe(parentRecipe, offset));
        } else {
          const index = nextParamsMeta.length;

          nextParamsMeta.push(parameterMeta);
          nextRecipe.push(index);
        }
      }

      aParamsMeta = nextParamsMeta;
      recipe = nextRecipe;
    }

    return { aParamsMeta, recipe, hasParentParams };
  }

  static getArgs(recipe: ParentRecipe[], results: unknown[]): unknown[] {
    return recipe.map((item) => {
      return Array.isArray(item) ? this.getArgs(item, results) : results[item];
    });
  }

  protected static hasParentParams(parameterMeta: ParameterMeta | null): boolean | void {
    if (parameterMeta?.at(0) === ParentParams) {
      // Only the first item can be a non-DecoratorAndValue type.
      return true;
    }
    for (const parameterItem of parameterMeta || []) {
      if (parameterItem instanceof DecoratorAndValue) {
        if (parameterItem.decoratorId === inject) {
          return ParentParams === (parameterItem.value as InjectTransformResult).token;
        }
      }
    }
  }

  protected static rebaseRecipe(recipe: ParentRecipe[], offset: number): ParentRecipe[] {
    return recipe.map((item) => {
      return Array.isArray(item) ? this.rebaseRecipe(item, offset) : item + offset;
    });
  }
}
