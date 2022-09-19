import { Injectable } from '@ts-stack/di';

import { InjectorPerApp } from '../models/injector-per-app';
import { ServiceProvider } from '../types/mix';

/**
 * Used only for extensions.
 */
@Injectable()
export class PerAppService {
  #providers: ServiceProvider[] = [];

  constructor(private injector: InjectorPerApp) {}

  /**
   * Returns copy of the providersPerApp accumulated by extensions.
   */
  get providers(): ServiceProvider[] {
    return [...this.#providers];
  }

  /**
   * Merges new providersPerApp with existing providersPerApp accumulated by extensions.
   */
  set providers(providers: ServiceProvider[]) {
    this.#providers.push(...providers);
  }

  /**
   * Applies providers accumulated by extensions to create child from `InjectorPerApp`.
   */
  createInjector() {
    return this.injector.resolveAndCreateChild(this.providers);
  }
}
