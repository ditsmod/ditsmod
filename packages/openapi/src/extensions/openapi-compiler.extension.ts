import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { edk } from '@ditsmod/core';
import { Injectable, ReflectiveInjector, reflector } from '@ts-stack/di';
import {
  PathItemObject,
  XOasObject,
  XOperationObject,
  XParameterObject,
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

  constructor(private injector: ReflectiveInjector, private extensionsManagerPerApp: edk.ExtensionsManager) {}

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
    const aMetadataPerMod2 = await this.extensionsManagerPerApp.init(edk.ROUTES_EXTENSIONS);
    const paths: XPathsObject = {};
    this.initOasObject();
    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aMetaForExtensionsPerRou, providersPerMod } = metadataPerMod2;
      aMetaForExtensionsPerRou.forEach(({ providersPerRou }) => {
        const injectorPerMod = this.injector.resolveAndCreateChild(providersPerMod);
        const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou);
        const oasRouteMeta = injectorPerRou.get(OasRouteMeta) as OasRouteMeta;
        const { httpMethod, oasPath, path, guards, operationObject } = oasRouteMeta;
        if (operationObject) {
          const clonedOperationObject = { ...operationObject };
          this.setSecurityInfo(clonedOperationObject, guards);
          const pathItemObject: PathItemObject = { [httpMethod.toLowerCase()]: clonedOperationObject };
          paths[`/${oasPath}`] = { ...(paths[`/${oasPath}`] || {}), ...pathItemObject };
        } else {
          if (!oasRouteMeta.httpMethod) {
            throw new Error('OpenapiCompilerExtension: OasRouteMeta not found.');
          }
          this.applyNonOasRoute(path, paths, oasRouteMeta, guards);
        }
      });
    });

    this.oasObject.paths = paths;

    return this.oasObject;
  }

  protected initOasObject() {
    this.oasObject = Object.assign({}, DEFAULT_OAS_OBJECT, this.injector.get(OAS_OBJECT));
    this.oasObject.components = { ...(this.oasObject.components || {}) };
  }

  protected setSecurityInfo(operationObject: XOperationObject, guards: edk.NormalizedGuard[]) {
    const security: XSecurityRequirementObject[] = [];
    const tags: string[] = [];
    const responses: XResponsesObject = {};
    guards.forEach((normalizedGuard) => {
      const decoratorsValues = reflector.annotations(normalizedGuard.guard);
      const aOasGuardMetadata = decoratorsValues.filter(isOasGuard);
      const guardName = normalizedGuard.guard.name;

      aOasGuardMetadata.forEach((oasGuardMetadata, index) => {
        let securityName = aOasGuardMetadata.length > 1 ? `${guardName}_${index}` : guardName;
        securityName = securityName.charAt(0).toLowerCase() + securityName.slice(1);
        this.oasObject.components!.securitySchemes = { ...(this.oasObject.components!.securitySchemes || {}) };
        this.oasObject.components!.securitySchemes[securityName] = oasGuardMetadata.securitySchemeObject;
        let scopes = normalizedGuard.params || [];
        if (!scopes.some((scope) => typeof scope == 'string')) {
          scopes = [];
        }
        security.push({ [securityName]: scopes });
        tags.push(...(oasGuardMetadata.tags || []));
        Object.assign(responses, oasGuardMetadata.responses);
      });
    });
    this.mergeOperationObjects(operationObject, security, tags, responses);
  }

  protected mergeOperationObjects(
    operationObject: XOperationObject,
    newSecurities: XSecurityRequirementObject[],
    newTags: string[],
    responses: XResponsesObject
  ) {
    operationObject.tags = [...(operationObject.tags || [])];
    newTags.forEach((newTag) => {
      if (!operationObject.tags?.includes(newTag)) {
        operationObject.tags?.push(newTag);
      }
    });
    operationObject.security = [...(operationObject.security || [])];
    newSecurities.forEach((newSecurities) => {
      const newSecurityName = Object.keys(newSecurities)[0];
      if (!operationObject.security?.find((securities) => Object.keys(securities)[0] == newSecurityName)) {
        operationObject.security?.push(newSecurities);
      }
    });
    operationObject.responses = { ...(operationObject.responses || {}), ...responses };
  }

  protected applyNonOasRoute(
    path: string,
    paths: XPathsObject,
    routeMeta: edk.RouteMeta,
    guards: edk.NormalizedGuard[]
  ) {
    const httpMethod = routeMeta.httpMethod.toLowerCase();
    const parameters: XParameterObject[] = [];
    path = `/${path}`.replace(/:([^\/]+)/g, (_, name) => {
      parameters.push({ in: 'path', name, required: true });
      return `{${name}}`;
    });
    const operationObject: XOperationObject = { tags: ['NonOasRoutes'], parameters, responses: {} };
    this.setSecurityInfo(operationObject, guards);
    if (['POST', 'PATCH', 'PUT'].includes(httpMethod)) {
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
