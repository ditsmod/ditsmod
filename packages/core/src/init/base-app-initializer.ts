import type { Injector } from '#di/injector.js';

export abstract class BaseAppInitializer {
  abstract bootstrapProvidersPerApp(): void;
  abstract bootstrapModulesAndExtensions(): Promise<Injector>;
}
