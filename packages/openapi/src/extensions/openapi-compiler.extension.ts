import { mkdir } from 'fs/promises';
import { join } from 'path';
import {
  Extension,
  ExtensionsManager,
  ExtensionsMetaPerApp,
  HttpMethod,
  isModuleWithParams,
  MetadataPerMod2,
  PerAppService,
  Providers,
  ResolvedGuard,
  ROUTES_EXTENSIONS,
} from '@ditsmod/core';
import { injectable, Injector, optional, reflector } from '@ditsmod/core';
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

import { OasRouteMeta } from '../types/oas-route-meta';
import { DEFAULT_OAS_OBJECT } from '../constants';
import { isOasGuard } from '../utils/type-guards';
import { OpenapiModule } from '../openapi.module';
import { OasConfigFiles, OasExtensionOptions } from '../types/oas-extension-options';
import { OpenapiLogMediator } from '../services/openapi-log-mediator';
import { OasOptions } from '../types/oas-options';

@injectable()
export class OpenapiCompilerExtension implements Extension<XOasObject | false> {
  protected oasObject: XOasObject;
  private swaggerUiDist = join(__dirname, '../../dist/swagger-ui');

  constructor(
    private perAppService: PerAppService,
    private injectorPerMod: Injector,
    private extensionsManager: ExtensionsManager,
    private log: OpenapiLogMediator,
    @optional() private extensionsMetaPerApp?: ExtensionsMetaPerApp
  ) {}

  async init() {
    if (this.oasObject) {
      return this.oasObject;
    }

    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS, true, OpenapiCompilerExtension);
    if (!aMetadataPerMod2) {
      this.log.dataAccumulation(this);
      return false;
    }
    this.log.applyingAccumulatedData(this);

    await this.compileOasObject(aMetadataPerMod2);
    await mkdir(this.swaggerUiDist, { recursive: true });
    const json = JSON.stringify(this.oasObject);
    const oasOptions = this.extensionsMetaPerApp?.oasOptions as OasOptions | undefined;
    const yaml = stringify(this.oasObject, oasOptions?.yamlSchemaOptions);
    this.perAppService.providers = [...new Providers().useValue(OasConfigFiles, { json, yaml })];

    return this.oasObject;
  }

  protected async compileOasObject(aMetadataPerMod2: MetadataPerMod2[]) {
    const paths: XPathsObject = {};
    this.initOasObject();
    for (const metadataPerMod2 of aMetadataPerMod2) {
      const { aControllersMetadata2, module: modOrObj } = metadataPerMod2;

      // Hide internal APIs for OpenAPI
      if (isModuleWithParams(modOrObj) && modOrObj.module === OpenapiModule) {
        continue;
      } else if (modOrObj === OpenapiModule) {
        continue;
      }

      aControllersMetadata2.forEach(({ httpMethod, path, routeMeta }) => {
        const { oasPath, resolvedGuards, operationObject } = routeMeta as OasRouteMeta;
        if (operationObject) {
          const clonedOperationObject = { ...operationObject };
          this.setSecurityInfo(clonedOperationObject, resolvedGuards);
          const pathItemObject: PathItemObject = { [httpMethod.toLowerCase()]: clonedOperationObject };
          paths[`/${oasPath}`] = { ...(paths[`/${oasPath}`] || {}), ...pathItemObject };
        } else {
          if (!httpMethod) {
            throw new Error('OpenapiCompilerExtension: OasRouteMeta not found.');
          }
          this.applyNonOasRoute(path, paths, httpMethod, resolvedGuards);
        }
      });
    }

    this.oasObject.paths = paths;

    return this.oasObject;
  }

  protected initOasObject() {
    let oasExtensionOptions = this.injectorPerMod.get(OasExtensionOptions, undefined, null);
    if (!oasExtensionOptions) {
      oasExtensionOptions = {};
      this.log.oasObjectNotFound(this);
    } else {
      this.log.foundOasObject(this);
    }
    this.oasObject = Object.assign({}, DEFAULT_OAS_OBJECT, oasExtensionOptions.oasObject);
    this.oasObject.components = { ...(this.oasObject.components || {}) };
  }

  protected setSecurityInfo(operationObject: XOperationObject, resolvedGuards: ResolvedGuard[]) {
    const security: XSecurityRequirementObject[] = [];
    const tags: string[] = [];
    const responses: XResponsesObject = {};
    resolvedGuards.forEach((resolvedGuard) => {
      const decoratorsValues = reflector.getClassMetadata(resolvedGuard.guard.dualKey.token);
      const aOasGuardMetadata = decoratorsValues.filter(isOasGuard);
      const guardName = resolvedGuard.guard.dualKey.token.name;

      aOasGuardMetadata.forEach((oasGuardMetadata, index) => {
        let securityName = aOasGuardMetadata.length > 1 ? `${guardName}_${index}` : guardName;
        securityName = securityName.charAt(0).toLowerCase() + securityName.slice(1);
        this.oasObject.components!.securitySchemes = { ...(this.oasObject.components!.securitySchemes || {}) };
        this.oasObject.components!.securitySchemes[securityName] = oasGuardMetadata.value.securitySchemeObject;
        let scopes = resolvedGuard.params || [];
        if (!scopes.some((scope) => typeof scope == 'string')) {
          scopes = [];
        }
        security.push({ [securityName]: scopes });
        tags.push(...(oasGuardMetadata.value.tags || []));
        Object.assign(responses, oasGuardMetadata.value.responses);
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
    httpMethod: HttpMethod,
    resolvedGuards: ResolvedGuard[]
  ) {
    httpMethod = httpMethod.toLowerCase() as HttpMethod;
    const parameters: XParameterObject[] = [];
    path = `/${path}`.replace(/:([^/]+)/g, (_, name) => {
      parameters.push({ in: 'path', name, required: true });
      return `{${name}}`;
    });
    const operationObject: XOperationObject = { tags: ['NonOasRoutes'], parameters, responses: {} };
    this.setSecurityInfo(operationObject, resolvedGuards);
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
