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
    let prevLevel = 0;
    return this.items.map((item) => {
      const providerName = getProviderName(item.token);
      if (item.injector?.level) {
        prevInjector = item.injector;
        return `[${providerName} in ${item.injector.level}]`;
      } else {
        if (this.hasOneLevel()) {
          return providerName;
        }
        let level = 0;
        if (prevInjector === item.injector) {
          level = prevLevel;
        } else {
          level = ++prevLevel;
          prevInjector = item.injector;
        }
        return `[${providerName} in injector${level}]`;
      }
    });
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
