import {
  FactoryProvider,
  injectable,
  Extension,
  HttpMethod,
  isCtrlDecor,
  Provider,
  AppOptions,
  ControllerRawMetadata1,
  reflector,
  Class,
  MetadataPerMod2,
} from '@ditsmod/core';
import { ControllerMetadata, MetadataPerMod3, RouteMeta, RoutesExtension } from '@ditsmod/routing';
import { ReferenceObject, XOperationObject, XParameterObject } from '@ts-stack/openapi-spec';

import { isOasRoute, isOasRoute1, isReferenceObject } from '#utils/type-guards.js';
import { BOUND_TO_HTTP_METHOD, BOUND_TO_PATH_PARAM } from '#utils/parameters.js';
import { OasRouteMeta } from '#types/oas-route-meta.js';
import { getLastParameterObjects, getLastReferenceObjects } from '#utils/get-last-params.js';
import { OasOptions } from '#types/oas-options.js';
import { OpenapiErrorMediator } from '../services/openapi-error-mediator.js';

@injectable()
export class OpenapiRoutesExtension extends RoutesExtension implements Extension<MetadataPerMod3> {
  constructor(
    protected override appOptions: AppOptions,
    protected override metadataPerMod2: MetadataPerMod2,
    protected errMediator: OpenapiErrorMediator,
  ) {
    super(appOptions, metadataPerMod2);
  }

  protected override getControllersMetadata(prefixPerApp: string, metadataPerMod2: MetadataPerMod2) {
    const { applyControllers, prefixPerMod, meta } = metadataPerMod2;

    const oasOptions = meta.extensionsMeta.oasOptions as OasOptions;
    const prefixParams = oasOptions?.paratemers;
    const prefixTags = oasOptions?.tags;

    const aControllerMetadata: ControllerMetadata[] = [];
    if (applyControllers)
      for (const Controller of meta.controllers as Class<Record<string | symbol, any>>[]) {
        const classMeta = reflector.getMetadata(Controller)!;
        for (const methodName of classMeta) {
          for (const decoratorAndValue of classMeta[methodName].decorators) {
            if (!isOasRoute(decoratorAndValue)) {
              continue;
            }
            const oasRoute = decoratorAndValue.value;
            const providersPerRou: Provider[] = [];
            const providersPerReq: Provider[] = [];
            const ctrlDecorator = classMeta.constructor.decorators.find(isCtrlDecor);
            const scope = ctrlDecorator?.value.scope;
            if (scope == 'ctx') {
              meta.providersPerMod.unshift(Controller);
            }
            const guards = [];
            if (isOasRoute1(decoratorAndValue)) {
              guards.push(...this.normalizeGuards(decoratorAndValue.value.guards));
            }
            const controllerFactory: FactoryProvider = { useFactory: [Controller, Controller.prototype[methodName]] };
            providersPerReq.push(
              ...((ctrlDecorator?.value as ControllerRawMetadata1).providersPerReq || []),
              controllerFactory,
            );
            const { httpMethod, path: controllerPath, operationObject } = oasRoute;
            const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');
            const path = this.getPath(prefix, controllerPath);
            const clonedOperationObject = { ...(operationObject || {}) } as XOperationObject;
            const { parameters } = clonedOperationObject;
            const httpMethods = Array.isArray(httpMethod) ? httpMethod : [httpMethod];

            const { paramsRefs, paramsInPath, paramsNonPath } = this.mergeParams(
              httpMethods,
              path,
              Controller.name,
              prefixParams,
              parameters,
            );
            clonedOperationObject.parameters = [...paramsRefs, ...paramsInPath, ...paramsNonPath];
            clonedOperationObject.tags = [...(clonedOperationObject.tags || []), ...(prefixTags || [])];
            // For now, here ReferenceObjects is ignored, if it is intended for a path.
            const oasPath = this.transformToOasPath(meta.name, path, paramsInPath);
            providersPerRou.push(...(ctrlDecorator?.value.providersPerRou || []));
            const routeMeta: OasRouteMeta = {
              oasPath,
              operationObject: clonedOperationObject,
              decoratorAndValue,
              Controller,
              methodName,
            };

            providersPerRou.push({ token: RouteMeta, useValue: routeMeta });

            aControllerMetadata.push({
              providersPerRou,
              providersPerReq,
              path,
              httpMethods,
              routeMeta,
              scope,
              guards,
            });
          }
        }
      }

    return aControllerMetadata;
  }

  protected mergeParams(
    httpMethods: HttpMethod[],
    path: string,
    controllerName: string,
    prefixParams?: (XParameterObject<any> | ReferenceObject)[],
    params?: (XParameterObject<any> | ReferenceObject)[],
  ) {
    params = [...(prefixParams || []), ...(params || [])];
    const referenceObjects: ReferenceObject[] = [];
    const paramsInPath: XParameterObject[] = [];
    const paramsNonPath: XParameterObject[] = [];
    params.forEach((p) => {
      if (isReferenceObject(p)) {
        referenceObjects.push(p);
      } else {
        if (p.in == 'path') {
          const paramName = `:${p.name}`;
          if (path.includes(paramName)) {
            paramsInPath.push(p);
          } else {
            this.errMediator.throwParamNotFoundInPath(controllerName, paramName, path);
          }
        } else {
          httpMethods.forEach(httpMethod => this.bindParams(httpMethod, path, paramsNonPath, p));
        }
      }
    });
    return {
      paramsRefs: getLastReferenceObjects(referenceObjects),
      paramsInPath: getLastParameterObjects(paramsInPath),
      paramsNonPath: getLastParameterObjects(paramsNonPath),
    };
  }

  protected bindParams(
    httpMethod: HttpMethod,
    path: string,
    paramsNonPath: XParameterObject[],
    param: XParameterObject,
  ) {
    const boundToLastParam: boolean = param[BOUND_TO_PATH_PARAM];
    const boundToMethod = param[BOUND_TO_HTTP_METHOD];
    if (boundToLastParam !== undefined && boundToMethod) {
      if (httpMethod == boundToMethod && this.boundToPathOk(path, boundToLastParam)) {
        paramsNonPath.push(param);
      }
    } else if (boundToLastParam !== undefined) {
      if (this.boundToPathOk(path, boundToLastParam)) {
        paramsNonPath.push(param);
      }
    } else if (boundToMethod) {
      if (httpMethod == boundToMethod) {
        paramsNonPath.push(param);
      }
    } else {
      paramsNonPath.push(param);
    }
  }

  protected boundToPathOk(path: string, boundToLastParam: boolean) {
    const prefixLastPart = path?.split('/').slice(-1)[0];
    return (
      (prefixLastPart?.charAt(0) == ':' && boundToLastParam) || (prefixLastPart?.charAt(0) != ':' && !boundToLastParam)
    );
  }

  /**
   * Transform from `path/:param` to `path/{param}`.
   */
  protected transformToOasPath(moduleName: string, path: string, paramsInPath: XParameterObject[]) {
    const paramsNames = (paramsInPath || []).map((p: XParameterObject) => p.name);

    paramsNames.forEach((name) => {
      if (path.includes(`{${name}}`)) {
        let msg = `Compiling OAS routes failed: ${moduleName} have a route with param: "{${name}}"`;
        msg += `, you must convert this to ":${name}"`;
        throw new Error(msg);
      }
      path = path.replace(`:${name}`, `{${name}}`);
    });

    return path;
  }
}
