import { Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';
import { ReferenceObject, XParameterObject } from '@ts-stack/openapi-spec';

import { isOasRoute, isReferenceObject } from '../utils/type-guards';
import { OasRouteMeta } from '../types/oas-route-meta';

@Injectable()
export class OpenapiRoutesExtension extends edk.RoutesExtension implements edk.Extension<edk.RawRouteMeta[]> {
  protected getRawRoutesMeta(
    moduleName: string,
    prefixPerApp: string,
    prefixPerMod: string,
    metadataPerMod: edk.MetadataPerMod
  ) {
    const { controllersMetadata, guardsPerMod, moduleMetadata } = metadataPerMod;

    const providersPerMod = moduleMetadata.providersPerMod.slice();

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
          const oasPath = this.getPath(prefix, controllerPath);
          const path = this.transformPath(oasPath, operationObject.parameters);
          providersPerRou.push(...(ctrlDecorator.providersPerRou || []));
          const parseBody = this.needBodyParse(providersPerMod, providersPerRou, allProvidersPerReq, httpMethod);
          const routeMeta: OasRouteMeta = {
            httpMethod,
            oasPath,
            path,
            operationObject,
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

  /**
   * Compiles the path for the controller given the prefix.
   *
   * - If prefix `/api/posts/:postId` and route path `:postId`, this method returns path `/api/posts/:postId`.
   * - If prefix `/api/posts` and route path `:postId`, this method returns `/api/posts/:postId`
   */
  protected getPath(prefix: string, path: string) {
    const prefixLastPart = prefix?.split('/').slice(-1)[0];
    if (prefixLastPart?.charAt(0) == ':') {
      const reducedPrefix = prefix?.split('/').slice(0, -1).join('/');
      return [reducedPrefix, path].filter((s) => s).join('/');
    } else {
      return [prefix, path].filter((s) => s).join('/');
    }
  }

  /**
   * Transform from `path/{param}` to `path/:param`.
   */
  protected transformPath(path: string, params: (XParameterObject | ReferenceObject)[]) {
    const paramsInPath = params
      .filter((p) => !isReferenceObject(p))
      .filter((p: XParameterObject) => p.in == 'path')
      .map((p: XParameterObject) => p.name);

    paramsInPath.forEach((name) => {
      path = path.replace(`{${name}}`, `:${name}`);
    });

    return path;
  }
}
