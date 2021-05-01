import { Injectable } from '@ts-stack/di';
import { edk, HttpMethod } from '@ditsmod/core';
import { ReferenceObject, XOperationObject, XParameterObject } from '@ts-stack/openapi-spec';

import { isOasRoute, isReferenceObject } from '../utils/type-guards';
import { BOUND_TO_HTTP_METHOD, BOUND_TO_PATH_PARAM } from '../utils/parameters';
import { OasRouteMeta } from '../types/oas-route-meta';
import { OasModuleWithParams } from '../types/oas-modul-with-params';
import { getLastParameterObjects, getLastReferenceObjects } from '../utils/get-last-params';
import { OAS_PATCH_METADATA_EXTENSIONS } from '../di-tokens';

@Injectable()
export class OpenapiRoutesExtension extends edk.RoutesExtension implements edk.Extension<edk.RawRouteMeta[]> {
  async init() {
    const extensionsManager = this.injectorPerApp.get(edk.ExtensionsManager) as edk.ExtensionsManager;
    await extensionsManager.init(OAS_PATCH_METADATA_EXTENSIONS);
    return super.init();
  }

  protected getRawRoutesMeta(
    moduleName: string,
    prefixPerApp: string,
    prefixPerMod: string,
    metadataPerMod: edk.MetadataPerMod
  ) {
    const { controllersMetadata, guardsPerMod, moduleMetadata } = metadataPerMod;

    const providersPerMod = moduleMetadata.providersPerMod.slice();
    let prefixParams: (XParameterObject<any> | ReferenceObject)[];
    if (edk.isModuleWithParams(moduleMetadata.module)) {
      const moduleWithParams = moduleMetadata.module as OasModuleWithParams;
      prefixParams = moduleWithParams.oasOptions?.paratemers;
    }

    const rawRoutesMeta: edk.RawRouteMeta[] = [];
    for (const { controller, ctrlDecorValues, methods } of controllersMetadata) {
      for (const methodName in methods) {
        const methodWithDecorators = methods[methodName];
        for (const decoratorMetadata of methodWithDecorators) {
          const oasRoute = decoratorMetadata.value;
          if (!isOasRoute(oasRoute)) {
            continue;
          }
          const providersPerRou = moduleMetadata.providersPerRou.slice();
          const providersPerReq = moduleMetadata.providersPerReq.slice();
          const ctrlDecorator = ctrlDecorValues.find(edk.isController);
          const guards = [...guardsPerMod, ...this.normalizeGuards(oasRoute.guards)];
          const allProvidersPerReq = this.addProvidersPerReq(
            moduleName,
            controller,
            ctrlDecorator.providersPerReq,
            methodName,
            guards,
            providersPerReq.slice()
          );
          const { httpMethod, path: controllerPath, operationObject } = oasRoute;
          const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');
          const path = this.getPath(prefix, controllerPath);
          const clonedOperationObject = { ...operationObject } as XOperationObject;
          const { parameters } = clonedOperationObject;
          const { paramsRefs, paramsInPath, paramsNonPath } = this.mergeParams(
            httpMethod,
            path,
            prefixParams,
            parameters
          );
          clonedOperationObject.parameters = [...paramsRefs, ...paramsInPath, ...paramsNonPath];
          // For now, here ReferenceObjects is ignored, if it is intended for a path.
          const oasPath = this.transformToOasPath(moduleMetadata.name, path, paramsInPath);
          providersPerRou.push(...(ctrlDecorator.providersPerRou || []));
          const parseBody = this.needBodyParse(providersPerMod, providersPerRou, allProvidersPerReq, httpMethod);
          const routeMeta: OasRouteMeta = {
            httpMethod,
            oasPath,
            path,
            operationObject: clonedOperationObject,
            decoratorMetadata,
            controller,
            methodName,
            parseBody,
            guards,
          };
          providersPerRou.push({ provide: edk.RouteMeta, useValue: routeMeta });
          rawRoutesMeta.push({
            moduleName,
            providersPerMod,
            providersPerRou,
            providersPerReq: allProvidersPerReq,
            path,
            httpMethod,
          });
        }
      }
    }

    return rawRoutesMeta;
  }

  protected mergeParams(
    httpMethod: HttpMethod,
    path: string,
    prefixParams: (XParameterObject<any> | ReferenceObject)[],
    params: (XParameterObject<any> | ReferenceObject)[]
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

  protected bindParams(httpMethod: HttpMethod, path: string, paramsNonPath: XParameterObject[], p: XParameterObject) {
    const boundToLastParam: boolean = p[BOUND_TO_PATH_PARAM];
    const boundToMethod = p[BOUND_TO_HTTP_METHOD];
    if (boundToLastParam !== undefined && boundToMethod) {
      if (httpMethod == boundToMethod && this.boundToPathOk(path, boundToLastParam)) {
        paramsNonPath.push(p);
      }
    } else if (boundToLastParam !== undefined) {
      if (this.boundToPathOk(path, boundToLastParam)) {
        paramsNonPath.push(p);
      }
    } else if (boundToMethod) {
      if (httpMethod == boundToMethod) {
        paramsNonPath.push(p);
      }
    } else {
      paramsNonPath.push(p);
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
