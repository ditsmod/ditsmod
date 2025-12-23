import { CyclicDependency } from '#errors';
import { getProviderName } from '#utils/get-provider-name.js';
import { type Injector } from './injector.js';

export interface PathItem {
  token: any;
  injector: Injector | null | undefined;
}
export interface InjectorItems {
  injector: Injector | null | undefined;
  injectorNumber: number;
}
export interface MergedItem {
  token: any;
  injectors: InjectorItems[];
}
/**
 * Used by the {@link Injector} to trace when resolving provider dependencies.
 */
export class PathTracer {
  protected items: PathItem[] = [];
  /**
   * The hierarchy of injectors has one level.
   */
  protected hasOneLevel: boolean;

  addItem(token: any, injector: Injector | null | undefined) {
    if (this.items.some((path) => path.injector === injector && path.token === token)) {
      this.items.unshift({ token, injector });
      throw new CyclicDependency(this.path);
    }
    this.items.unshift({ token, injector });
    return this;
  }

  removeFirstItem() {
    this.items.splice(0, 1);
  }

  /**
   * Returns an array in which each element is represented in two form:
   * 1. __`tokenName`__ (if there is no hierarchy of injectors).
   * 2. __`tokenName in injectorLevel`__ (if there are multiple levels of injector hierarchy).
   */
  get path() {
    return this.mergeItems().map((item) => {
      const injectorStr = item.injectors
        .map((inj) => {
          return inj.injector?.level ? inj.injector?.level : `injector${inj.injectorNumber}`;
        })
        .join(' >> ');

      const tokenName = getProviderName(item.token);
      return this.hasOneLevel ? tokenName : `[${tokenName} in ${injectorStr}]`;
    });
  }

  /**
   * If identical tokens follow each other in a trace, their injectors
   * merge into a single array for that tokens.
   */
  protected mergeItems() {
    const mergedItems: MergedItem[] = [];
    let prevInjector: Injector | null | undefined;
    let prevToken: any;
    let injectorNumber = 0;
    this.items.forEach((item) => {
      if (prevInjector !== item.injector) {
        injectorNumber++;
        prevInjector = item.injector;
      }
      if (prevToken === item.token) {
        const prevItem = mergedItems.at(-1)!;
        prevItem.injectors.unshift({ injector: item.injector, injectorNumber });
      } else {
        mergedItems.push({
          token: item.token,
          injectors: [{ injector: item.injector, injectorNumber }],
        });
        prevToken = item.token;
      }
    });
    this.hasOneLevel = injectorNumber == 1;

    return mergedItems;
  }
}
