import {
  FactoryProvider,
  injectable,
  ControllerMetadata2,
  Extension,
  HttpMethod,
  isController,
  MetadataPerMod1,
  MetadataPerMod2,
  RouteMeta,
  Provider,
  AppOptions,
  ControllerRawMetadata1,
  reflector,
} from '@ditsmod/core';
import { RoutesExtension } from '@ditsmod/routing';
import { ReferenceObject, XOperationObject, XParameterObject } from '@ts-stack/openapi-spec';

import { isOasRoute, isOasRoute1, isReferenceObject } from '#utils/type-guards.js';
import { BOUND_TO_HTTP_METHOD, BOUND_TO_PATH_PARAM } from '#utils/parameters.js';
import { OasRouteMeta } from '#types/oas-route-meta.js';
import { getLastParameterObjects, getLastReferenceObjects } from '#utils/get-last-params.js';
import { OasOptions } from '#types/oas-options.js';
import { OpenapiErrorMediator } from '../services/openapi-error-mediator.js';

@injectable()
export class OpenapiRoutesExtension extends RoutesExtension implements Extension<MetadataPerMod2> {
  constructor(
    protected override appOptions: AppOptions,
    protected override metadataPerMod1: MetadataPerMod1,
    protected errMediator: OpenapiErrorMediator,
  ) {
    super(appOptions, metadataPerMod1);
  }
  protected override getControllersMetadata2(prefixPerApp: string, metadataPerMod1: MetadataPerMod1) {
    const { applyControllers, prefixPerMod, meta } = metadataPerMod1;

    const oasOptions = meta.extensionsMeta.oasOptions as OasOptions;
    const prefixParams = oasOptions?.paratemers;
    const prefixTags = oasOptions?.tags;

    const aControllersMetadata2: ControllerMetadata2[] = [];
    if (applyControllers)
    for (const controller of meta.controllers) {
      const classMeta = reflector.getMetadata(controller);
      for (const methodName in classMeta) {
        for (const decoratorMetadata of classMeta[methodName].decorators) {
          if (!isOasRoute(decoratorMetadata)) {
            continue;
          }
          const oasRoute = decoratorMetadata.value;
          const providersPerRou: Provider[] = [];
          const providersPerReq: Provider[] = [];
          const ctrlDecorator = classMeta.constructor.decorators.find(isController);
          const isSingleton = ctrlDecorator?.value.isSingleton;
          const guards = metadataPerMod1.guardsPerMod.slice();
          if (isOasRoute1(decoratorMetadata)) {
            guards.push(...this.normalizeGuards(decoratorMetadata.value.guards));
          }
          const controllerFactory: FactoryProvider = { useFactory: [controller, controller.prototype[methodName]] };
          providersPerReq.push(
            ...((ctrlDecorator?.value as ControllerRawMetadata1).providersPerReq || []),
            controllerFactory,
          );
          const { httpMethod, path: controllerPath, operationObject } = oasRoute;
          const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');
          const path = this.getPath(prefix, controllerPath);
          const clonedOperationObject = { ...(operationObject || {}) } as XOperationObject;
          const { parameters } = clonedOperationObject;
          const { paramsRefs, paramsInPath, paramsNonPath } = this.mergeParams(
            httpMethod,
            path,
            controller.name,
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
            decoratorMetadata,
            controller,
            methodName,
          };

          providersPerRou.push({ token: RouteMeta, useValue: routeMeta });

          aControllersMetadata2.push({
            providersPerRou,
            providersPerReq,
            path,
            httpMethod,
            routeMeta,
            isSingleton,
            guards,
          });
        }
      }
    }

    return aControllersMetadata2;
  }

  protected mergeParams(
    httpMethod: HttpMethod,
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
          this.bindParams(httpMethod, path, paramsNonPath, p);
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
