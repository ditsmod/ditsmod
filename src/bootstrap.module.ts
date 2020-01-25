import {
  reflector,
  TypeProvider,
  Provider,
  Type,
  resolveForwardRef,
  Injectable,
  ResolvedReflectiveProvider,
  ReflectiveInjector
} from 'ts-di';

import { ModuleDecorator, ControllersDecorator, RouteDecoratorMetadata } from './decorators';
import { Logger, ModuleType, ModuleWithProviders, Router } from './types';
import { flatten } from './utils/ng-utils';
import { isModuleWithProviders } from './utils/type-guards';
import { Request } from './request';
import { Response } from './response';

@Injectable()
export class BootstrapModule {
  protected imports: Type<any>[];
  protected exports: Type<any>[];
  protected providersPerMod: Provider[];
  protected providersPerReq: Provider[];
  protected controllers: TypeProvider[];
  protected resolvedProvidersPerReq: ResolvedReflectiveProvider[];
  protected injectorPerMod: ReflectiveInjector;

  constructor(private router: Router, private parentInjectorPerMod: ReflectiveInjector, private log: Logger) {}

  bootstrap(mod: ModuleType) {
    this.setModuleDefaultOptions();
    this.extractModuleMetadata(mod);
    this.injectorPerMod = this.parentInjectorPerMod.resolveAndCreateChild(this.providersPerMod);
    this.initProvidersPerReq();
    this.setRoutes();
    this.importModules();
  }

  protected setModuleDefaultOptions() {
    this.imports = [];
    this.exports = [];
    this.providersPerMod = [];
    this.providersPerReq = [];
    this.controllers = [];
  }

  protected extractModuleMetadata(mod: ModuleType) {
    const annotations = reflector.annotations(mod) as ModuleDecorator[];
    const moduleMetadata = annotations[0];
    if (!moduleMetadata) {
      throw new Error(`Module build failed: module "${mod.name}" does not have the "@Module()" decorator`);
    }
    this.imports = flatten((moduleMetadata.imports || this.imports).slice())
      .map(resolveForwardRef)
      .map(getModule);
    this.exports = flatten((moduleMetadata.exports || this.exports).slice())
      .map(resolveForwardRef)
      .map(getModule);
    this.providersPerMod = (moduleMetadata.providersPerMod || this.providersPerMod).slice();
    this.providersPerReq = (moduleMetadata.providersPerReq || this.providersPerReq).slice();
    this.controllers = (moduleMetadata.controllers || this.controllers).slice();

    return moduleMetadata;

    function getModule(value: Type<any> | ModuleWithProviders<{}>): Type<any> {
      if (isModuleWithProviders(value)) {
        return value.module;
      }
      return value;
    }
  }

  /**
   * Init providers per the request.
   */
  protected initProvidersPerReq() {
    this.providersPerReq.unshift(Request, Response);
    this.resolvedProvidersPerReq = ReflectiveInjector.resolve(this.providersPerReq);
  }

  /**
   * Inserts new `Provider` at the start of `providersPerReq` array.
   */
  protected unshiftProvidersPerReq(...providers: Provider[]) {
    this.providersPerReq.unshift(...providers);
    this.resolvedProvidersPerReq = ReflectiveInjector.resolve(this.providersPerReq);
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

          this.unshiftProvidersPerReq(Controller);

          this.router.on(metadata.httpMethod, path, () => ({
            injector: this.injectorPerMod,
            providers: this.resolvedProvidersPerReq,
            controller: Controller,
            method: prop
          }));

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

  protected importModules() {
    for (const imp of this.imports) {
      const bsMod = this.injectorPerMod.resolveAndInstantiate(BootstrapModule) as BootstrapModule;
      bsMod.bootstrap(imp);
    }
  }
}
