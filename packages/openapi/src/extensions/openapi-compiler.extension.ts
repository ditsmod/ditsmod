import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { edk, HttpMethod } from '@ditsmod/core';
import { Injectable, ReflectiveInjector, reflector } from '@ts-stack/di';
import {
  XOasObject,
  XOperationObject,
  XParameterObject,
  XPathItemObject,
  XPathsObject,
  XResponsesObject,
  XSecurityRequirementObject,
} from '@ts-stack/openapi-spec';
import { stringify } from 'yaml';

import { OAS_OBJECT } from '../di-tokens';
import { OasRouteMeta } from '../types/oas-route-meta';
import { DEFAULT_OAS_OBJECT } from '../constants';
import { isOasGuard } from '../utils/type-guards';

@Injectable()
export class OpenapiCompilerExtension implements edk.Extension<XOasObject> {
  protected oasObject: XOasObject;
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
    const rawRouteMeta = await this.extensionManager.init(edk.ROUTES_EXTENSIONS);
    const paths: XPathsObject = {};
    this.initOasObject();
    rawRouteMeta.forEach((rawMeta) => {
      const { prefixPerApp, prefixPerMod } = rawMeta;
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(rawMeta.providersPerMod);
      const injectorPerRou = injectorPerMod.resolveAndCreateChild(rawMeta.providersPerRou);
      const oasRouteMeta = injectorPerRou.get(OasRouteMeta) as OasRouteMeta;
      const { httpMethod, oasPath, pathItem, guards } = oasRouteMeta;
      if (pathItem) {
        const clonedPathItem = { ...pathItem };
        const path = [prefixPerApp, prefixPerMod, oasPath].filter((p) => p).join('/');
        paths[`/${path}`] = clonedPathItem;
        this.setSecurityInfo(httpMethod, clonedPathItem, guards);
      } else {
        if (!oasRouteMeta.httpMethod) {
          throw new Error('OpenapiCompilerExtension: OasRouteMeta not found.');
        }
        this.applyNonOasRoute(prefixPerApp, prefixPerMod, paths, oasRouteMeta);
      }
    });

    this.oasObject.paths = paths;

    return this.oasObject;
  }

  protected initOasObject() {
    this.oasObject = Object.assign({}, DEFAULT_OAS_OBJECT, this.injectorPerApp.get(OAS_OBJECT));
    this.oasObject.components = { ...(this.oasObject.components || {}) };
    this.oasObject.components.securitySchemes = { ...(this.oasObject.components.securitySchemes || {}) };
  }

  protected setSecurityInfo(httpMethod: HttpMethod, pathItem: XPathItemObject, guards: edk.NormalizedGuard[]) {
    const security: XSecurityRequirementObject[] = [];
    const tags: string[] = [];
    const responses: XResponsesObject = {};
    guards.forEach((normalizedGuard) => {
      const decoratorsValues = reflector.annotations(normalizedGuard.guard);
      const oasGuardMetadataArr = decoratorsValues.filter(isOasGuard);
      const guardName = normalizedGuard.guard.name;

      oasGuardMetadataArr.forEach((oasGuardMetadata, index) => {
        let securityName = oasGuardMetadataArr.length > 1 ? `${guardName}_${index}` : guardName;
        securityName = securityName.charAt(0).toLowerCase() + securityName.slice(1);
        this.oasObject.components.securitySchemes[securityName] = oasGuardMetadata.securitySchemeObject;
        security.push({ [securityName]: [] });
        tags.push(...(oasGuardMetadata.tags || []));
        Object.assign(responses, oasGuardMetadata.responses);
      });
    });
    this.mergeOperationObjects(httpMethod, pathItem, security, tags, responses);
  }

  protected mergeOperationObjects(
    httpMethod: HttpMethod,
    pathItem: XPathItemObject,
    newSecurities: XSecurityRequirementObject[],
    newTags: string[],
    responses: XResponsesObject
  ) {
    const method = httpMethod.toLowerCase();
    const operationObject = { ...pathItem[method] } as XOperationObject;
    pathItem[method] = operationObject;
    operationObject.tags = [...(operationObject.tags || [])];
    newTags.forEach((newTag) => {
      if (!operationObject.tags.includes(newTag)) {
        operationObject.tags.push(newTag);
      }
    });
    operationObject.security = [...(operationObject.security || [])];
    newSecurities.forEach((newSecurities) => {
      const newSecurityName = Object.keys(newSecurities)[0];
      if (!operationObject.security.find((securities) => Object.keys(securities)[0] == newSecurityName)) {
        operationObject.security.push(newSecurities);
      }
    });
    operationObject.responses = { ...(operationObject.responses || {}), ...responses };
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
