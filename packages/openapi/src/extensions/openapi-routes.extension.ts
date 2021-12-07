import { Injectable } from '@ts-stack/di';
import { edk, HttpMethod, ServiceProvider } from '@ditsmod/core';
import { ReferenceObject, XOperationObject, XParameterObject } from '@ts-stack/openapi-spec';

import { isOasRoute, isOasRoute1, isReferenceObject } from '../utils/type-guards';
import { BOUND_TO_HTTP_METHOD, BOUND_TO_PATH_PARAM } from '../utils/parameters';
import { OasRouteMeta } from '../types/oas-route-meta';
import { getLastParameterObjects, getLastReferenceObjects } from '../utils/get-last-params';
import { OasOptions } from '../types/oas-options';

@Injectable()
export class OpenapiRoutesExtension extends edk.RoutesExtension implements edk.Extension<edk.MetadataPerMod2> {
  protected override getControllersMetadata2(prefixPerApp: string, metadataPerMod1: edk.MetadataPerMod1) {
    const { controllersMetadata1, prefixPerMod, guardsPerMod, meta } = metadataPerMod1;

    const oasOptions = meta.extensionsMeta.oasOptions as OasOptions;
    const prefixParams = oasOptions?.paratemers;
    const prefixTags = oasOptions?.tags;

    const controllersMetadata2: edk.ControllersMetadata2[] = [];
    for (const { controller, ctrlDecorValues, methods } of controllersMetadata1) {
      for (const methodName in methods) {
        const methodWithDecorators = methods[methodName];
        for (const decoratorMetadata of methodWithDecorators) {
          const oasRoute = decoratorMetadata.value;
          if (!isOasRoute(oasRoute)) {
            continue;
          }
          const providersPerRou: ServiceProvider[] = [];
          const providersPerReq: ServiceProvider[] = [];
          const ctrlDecorator = ctrlDecorValues.find(edk.isController);
          const guards: edk.NormalizedGuard[] = [...guardsPerMod];
          if (isOasRoute1(oasRoute)) {
            guards.push(...this.normalizeGuards(oasRoute.guards));
          }
          providersPerReq.push(...(ctrlDecorator?.providersPerReq || []), controller);
          const { httpMethod, path: controllerPath, operationObject } = oasRoute;
          const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');
          const path = this.getPath(prefix, controllerPath);
          const clonedOperationObject = { ...(operationObject || {}) } as XOperationObject;
          const { parameters } = clonedOperationObject;
          const { paramsRefs, paramsInPath, paramsNonPath } = this.mergeParams(
            httpMethod,
            path,
            prefixParams,
            parameters
          );
          clonedOperationObject.parameters = [...paramsRefs, ...paramsInPath, ...paramsNonPath];
          clonedOperationObject.tags = [...(clonedOperationObject.tags || []), ...(prefixTags || [])];
          // For now, here ReferenceObjects is ignored, if it is intended for a path.
          const oasPath = this.transformToOasPath(meta.name, path, paramsInPath);
          providersPerRou.push(...(ctrlDecorator?.providersPerRou || []));
          const routeMeta: OasRouteMeta = {
            httpMethod,
            oasPath,
            path,
            operationObject: clonedOperationObject,
            decoratorMetadata,
            controller,
            methodName,
            guards,
          };
          providersPerRou.push({ provide: edk.RouteMeta, useValue: routeMeta });
          controllersMetadata2.push({
            providersPerRou,
            providersPerReq,
            path,
            httpMethod,
          });
        }
      }
    }

    return controllersMetadata2;
  }

  protected mergeParams(
    httpMethod: HttpMethod,
    path: string,
    prefixParams?: (XParameterObject<any> | ReferenceObject)[],
    params?: (XParameterObject<any> | ReferenceObject)[]
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
          if (path.includes(`:${p.name}`)) {
            paramsInPath.push(p);
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
    param: XParameterObject
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
