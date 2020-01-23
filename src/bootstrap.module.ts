import { reflector, TypeProvider, ReflectiveInjector, Provider, Type, resolveForwardRef } from 'ts-di';

import { ModuleDecorator, ControllersDecorator, RouteDecoratorMetadata } from './decorators';
import { Logger, ModuleType, ApplicationOptions, ModuleWithProviders } from './types';
import { Application } from './application';
import { pickProperties } from './utils/pick-properties';
import { flatten } from './utils/ng-utils';
import { isModuleWithProviders } from './utils/type-guards';

export class BootstrapModule {
  app: Application;
  log: Logger;
  imports: Type<any>[];
  exports: Type<any>[];
  controllers: TypeProvider[];
  providersPerMod: Provider[];
  injectorPerMod: ReflectiveInjector;

  bootstrap(app: Application, mod: ModuleType) {
    this.app = app;
    this.log = app.injector.get(Logger);
    return new Promise((resolve, reject) => {
      try {
        this.setDefaultOptions();
        const moduleMetadata = this.extractModuleMetadata(mod);
        const appOptions = pickProperties(new ApplicationOptions(), moduleMetadata);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  protected extractModuleMetadata(mod: ModuleType) {
    const annotations = reflector.annotations(mod) as ModuleDecorator[];
    const moduleMetadata = annotations[0];
    if (!moduleMetadata) {
      throw new Error(`Module build failed: module "${mod.name}" does not have the "@Module()" decorator`);
    }
    this.imports = flatten(moduleMetadata.imports || this.imports)
      .map(resolveForwardRef)
      .map(getModule);
    this.exports = flatten(moduleMetadata.exports || this.exports)
      .map(resolveForwardRef)
      .map(getModule);
    this.providersPerMod = moduleMetadata.providersPerMod || this.providersPerMod;
    this.controllers = moduleMetadata.controllers || this.controllers;

    return moduleMetadata;

    function getModule(value: Type<any> | ModuleWithProviders<{}>): Type<any> {
      if (isModuleWithProviders(value)) {
        return value.module;
      }
      return value;
    }
  }

  protected setDefaultOptions() {
    this.imports = [];
    this.exports = [];
    this.providersPerMod = [];
    this.controllers = [];
  }

  protected setRoutes() {
    this.controllers.forEach(Controller => {
      const controllerMetadata: ControllersDecorator = reflector.annotations(Controller)[0];
      if (!controllerMetadata) {
        throw new Error(
          `Setting routes failed: controller "${Controller.name}" does not have the "@Controller()" decorator`
        );
      }
      const pathFromRoot = controllerMetadata.path;
      this.checkRoutePath(Controller.name, pathFromRoot);
      const propMetadata = reflector.propMetadata(Controller) as RouteDecoratorMetadata;
      for (const prop in propMetadata) {
        for (const metadata of propMetadata[prop]) {
          if (!metadata.httpMethod) {
            // Here we have another decorator, not a @Route().
            continue;
          }
          this.checkRoutePath(Controller.name, metadata.path);
          let path = '/';
          if (!pathFromRoot) {
            path += metadata.path;
          } else if (!metadata.path) {
            path += pathFromRoot;
          } else {
            path += `${pathFromRoot}/${metadata.path}`;
          }
          this.app.setRoute(metadata.httpMethod, path, Controller, prop);

          if (this.log.trace()) {
            const msg = {
              httpMethod: metadata.httpMethod,
              path,
              handler: `${Controller.name} -> ${prop}()`
            };
            this.log.trace(msg);
          }
        }
      }
    });
  }

  protected checkRoutePath(controllerName: string, path: string) {
    if (path.charAt(0) == '/') {
      throw new Error(
        `Invalid configuration of route '${path}' (in '${controllerName}'): path cannot start with a slash`
      );
    }
  }
}
