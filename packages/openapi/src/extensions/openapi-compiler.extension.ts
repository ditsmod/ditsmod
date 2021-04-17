import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { edk } from '@ditsmod/core';
import { Injectable, ReflectiveInjector } from '@ts-stack/di';
import { XOasObject, XOperationObject, XParameterObject, XPathsObject } from '@ts-stack/openapi-spec';
import { stringify } from 'yaml';

import { OAS_OBJECT } from '../di-tokens';
import { OasRouteMeta } from '../types/oas-route-meta';
import { DEFAULT_OAS_OBJECT } from '../constants';

@Injectable()
export class OpenapiCompilerExtension implements edk.Extension<XOasObject> {
  #oasObject: XOasObject;

  constructor(private extensionManager: edk.ExtensionsManager, private injectorPerApp: ReflectiveInjector) {}

  async init() {
    if (this.#oasObject) {
      return this.#oasObject;
    }

    await this.compileOasObject();
    writeFileSync(resolve(__dirname, '../../dist/swagger-ui/openapi.json'), JSON.stringify(this.#oasObject));
    writeFileSync(resolve(__dirname, '../../dist/swagger-ui/openapi.yaml'), stringify(this.#oasObject));

    return this.#oasObject;
  }

  protected async compileOasObject() {
    const paths: XPathsObject = {};

    const rawRouteMeta = await this.extensionManager.init(edk.ROUTES_EXTENSIONS);
    rawRouteMeta.forEach((rawMeta) => {
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(rawMeta.providersPerMod);
      const injectorPerRou = injectorPerMod.resolveAndCreateChild(rawMeta.providersPerRou);
      const oasRouteMeta = injectorPerRou.get(OasRouteMeta) as OasRouteMeta;
      if (oasRouteMeta.pathItem) {
        paths[`/${oasRouteMeta.oasPath}`] = oasRouteMeta.pathItem;
      } else {
        if (!oasRouteMeta.httpMethod) {
          throw new Error('OpenapiCompilerExtension: OasRouteMeta not found.');
        }
        this.applyNonOasRoute(paths, oasRouteMeta);
      }
    });

    this.#oasObject = Object.assign({}, DEFAULT_OAS_OBJECT, this.injectorPerApp.get(OAS_OBJECT));
    this.#oasObject.paths = paths;

    return this.#oasObject;
  }

  protected applyNonOasRoute(paths: XPathsObject, routeMeta: edk.RouteMeta) {
    const httpMethod = routeMeta.httpMethod.toLowerCase();
    const parameters: XParameterObject[] = [];
    let path = routeMeta.path;
    path = `/${path}`.replace(/:([^\/]+)/g, (_, name) => {
      parameters.push({ in: 'path', name, required: true });
      return `{${name}}`;
    });
    const operationObject: XOperationObject = { parameters, responses: {} };
    if (paths[path]) {
      paths[path][httpMethod] = operationObject;
    } else {
      paths[path] = { [httpMethod]: operationObject };
    }
  }
}
