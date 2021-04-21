import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { edk } from '@ditsmod/core';
import { Injectable, ReflectiveInjector } from '@ts-stack/di';
import { XOasObject, XOperationObject, XParameterObject, XPathsObject } from '@ts-stack/openapi-spec';
import { stringify } from 'yaml';

import { OAS_OBJECT } from '../di-tokens';
import { OasRouteMeta } from '../types/oas-route-meta';
import { DEFAULT_OAS_OBJECT } from '../constants';

@Injectable()
export class OpenapiCompilerExtension implements edk.Extension<XOasObject> {
  private oasObject: XOasObject;
  private swaggerUiDist = join(__dirname, '../../dist/swagger-ui');

  constructor(private extensionManager: edk.ExtensionsManager, private injectorPerApp: ReflectiveInjector) {}

  async init() {
    if (this.oasObject) {
      return this.oasObject;
    }

    await this.compileOasObject();
    await mkdir(this.swaggerUiDist, { recursive: true });
    await writeFile(`${this.swaggerUiDist}/openapi.json`, JSON.stringify(this.oasObject));
    await writeFile(`${this.swaggerUiDist}/openapi.yaml`, stringify(this.oasObject));

    return this.oasObject;
  }

  protected async compileOasObject() {
    const paths: XPathsObject = {};

    const rawRouteMeta = await this.extensionManager.init(edk.ROUTES_EXTENSIONS);
    rawRouteMeta.forEach((rawMeta) => {
      const { prefixPerApp, prefixPerMod } = rawMeta;
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(rawMeta.providersPerMod);
      const injectorPerRou = injectorPerMod.resolveAndCreateChild(rawMeta.providersPerRou);
      const oasRouteMeta = injectorPerRou.get(OasRouteMeta) as OasRouteMeta;
      if (oasRouteMeta.pathItem) {
        const path = [prefixPerApp, prefixPerMod, oasRouteMeta.oasPath].filter((p) => p).join('/');
        paths[`/${path}`] = oasRouteMeta.pathItem;
      } else {
        if (!oasRouteMeta.httpMethod) {
          throw new Error('OpenapiCompilerExtension: OasRouteMeta not found.');
        }
        this.applyNonOasRoute(prefixPerApp, prefixPerMod, paths, oasRouteMeta);
      }
    });

    this.oasObject = Object.assign({}, DEFAULT_OAS_OBJECT, this.injectorPerApp.get(OAS_OBJECT));
    this.oasObject.paths = paths;

    return this.oasObject;
  }

  protected applyNonOasRoute(
    prefixPerApp: string,
    prefixPerMod: string,
    paths: XPathsObject,
    routeMeta: edk.RouteMeta
  ) {
    const httpMethod = routeMeta.httpMethod.toLowerCase();
    let path = [prefixPerApp, prefixPerMod, routeMeta.path].filter((p) => p).join('/');
    const parameters: XParameterObject[] = [];
    path = `/${path}`.replace(/:([^\/]+)/g, (_, name) => {
      parameters.push({ in: 'path', name, required: true });
      return `{${name}}`;
    });
    const operationObject: XOperationObject = { tags: ['NonOasRoutes'], parameters, responses: {} };
    if (routeMeta.parseBody) {
      operationObject.requestBody = {
        description: 'It is default content field for non-OasRoute',
        content: { ['application/json']: {} },
      };
    }
    if (paths[path]) {
      paths[path][httpMethod] = operationObject;
    } else {
      paths[path] = { [httpMethod]: operationObject };
    }
  }
}
