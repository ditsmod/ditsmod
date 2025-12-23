import { CyclicDependency } from '#errors';
import { getProviderName } from '#utils/get-provider-name.js';
import { Injector } from './injector.js';

export interface PathItem {
  token: any;
  injector: Injector | null | undefined;
}
/**
 * Used by the {@link Injector} to trace when resolving provider dependencies.
 */
export class PathTracer {
  protected items: PathItem[] = [];

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
    let prevInjector: Injector | null | undefined;
    let level = 0;
    return this.mergeItems().map((item) => {
      const tokenName = getProviderName(item.token);
      const injectorStr = item.injectors
        .map((inj) => {
          if (inj?.level) {
            prevInjector = inj;
            return inj.level;
          } else {
            if (this.hasOneLevel()) {
              return '';
            }
            if (prevInjector !== inj) {
              ++level;
              prevInjector = inj;
            }
            return `injector${level}`;
          }
        })
        .join(' >> ');

      return injectorStr ? `[${tokenName} in ${injectorStr}]` : tokenName;
    });
  }

  protected mergeItems() {
    let prevToken: any;
    const mergedItems: { token: any; injectors: (Injector | null | undefined)[] }[] = [];
    this.items.forEach((item) => {
      if (prevToken === item.token) {
        const prevItem = mergedItems.at(-1)!;
        prevItem.injectors.unshift(item.injector);
      } else {
        mergedItems.push({ token: item.token, injectors: [item.injector] });
      }
      prevToken = item.token;
    });

    return mergedItems;
  }

  protected hasOneLevel() {
    let oneLevel = true;
    let prevInjector: Injector | null | undefined = null;
    for (let i = 0; i < this.items.length; i++) {
      const curInjector = this.items[i].injector;
      if (prevInjector && curInjector && curInjector !== prevInjector) {
        oneLevel = false;
        break;
      }
      prevInjector = curInjector;
    }
    return oneLevel;
  }
}
