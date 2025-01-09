import {
  Extension,
  ExtensionsManager,
  ExtensionsMetaPerApp,
  HttpMethod,
  PerAppService,
  injectable,
  Injector,
  optional,
  reflector,
  Stage1GroupMetaPerApp,
  NormalizedGuard,
  Stage1GroupMeta2,
} from '@ditsmod/core';
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
import { MetadataPerMod3, ROUTES_EXTENSIONS } from '@ditsmod/routing';

import { OasRouteMeta } from '#types/oas-route-meta.js';
import { DEFAULT_OAS_OBJECT, defaultForNonOasGuard } from '#constants';
import { OasConfigFiles, OasExtensionConfig } from '#types/oas-extension-options.js';
import { OasOptions } from '#types/oas-options.js';
import { OpenapiLogMediator } from '#services/openapi-log-mediator.js';

@injectable()
export class OpenapiCompilerExtension implements Extension<XOasObject | false> {
  protected oasObject: XOasObject;
  protected stage1GroupMeta: Stage1GroupMeta2<MetadataPerMod3>;

  constructor(
    private perAppService: PerAppService,
    private injectorPerMod: Injector,
    private extensionsManager: ExtensionsManager,
    private log: OpenapiLogMediator,
    @optional() private extensionsMetaPerApp?: ExtensionsMetaPerApp,
  ) {}

  async stage1() {
    const stage1GroupMeta = await this.extensionsManager.stage1(ROUTES_EXTENSIONS, this);
    if (stage1GroupMeta.delay) {
      this.log.dataAccumulation(this);
      return false;
    }
    this.stage1GroupMeta = stage1GroupMeta;
    return this.oasObject;
  }

  async stage2() {
    this.log.applyingAccumulatedData(this);
    await this.compileOasObject(this.stage1GroupMeta.groupDataPerApp);
    const json = JSON.stringify(this.oasObject);
    const oasOptions = this.extensionsMetaPerApp?.oasOptions as OasOptions | undefined;
    const yaml = stringify(this.oasObject, oasOptions?.yamlSchemaOptions);
    this.perAppService.reinitInjector([{ token: OasConfigFiles, useValue: { json, yaml } }]);
  }

  protected async compileOasObject(groupDataPerApp: Stage1GroupMetaPerApp<MetadataPerMod3>[]) {
    const paths: XPathsObject = {};
    this.initOasObject();
    for (const stage1GroupMetaPerApp of groupDataPerApp) {
      for (const metadataPerMod3 of stage1GroupMetaPerApp.groupData) {
        metadataPerMod3.aControllerMetadata.forEach(({ httpMethods, fullPath, routeMeta, guards }) => {
          httpMethods.forEach((method) => {
            const { oasPath, resolvedGuards, operationObject } = routeMeta as OasRouteMeta;
            if (operationObject) {
              const clonedOperationObject = { ...operationObject };
              this.setSecurityInfo(clonedOperationObject, guards);
              const pathItemObject: PathItemObject = { [method.toLowerCase()]: clonedOperationObject };
              paths[`/${oasPath}`] = { ...(paths[`/${oasPath}`] || {}), ...pathItemObject };
            } else {
              if (!method) {
                const moduleName = metadataPerMod3.meta.name;
                const msg = `[${moduleName}]: OpenapiCompilerExtension: OasRouteMeta not found.`;
                throw new Error(msg);
              }
              this.applyNonOasRoute(fullPath, paths, method, guards);
            }
          });
        });
      }
    }

    this.oasObject.paths = paths;

    return this.oasObject;
  }

  protected initOasObject() {
    let oasExtensionConfig = this.injectorPerMod.get(OasExtensionConfig, undefined, null);
    if (!oasExtensionConfig) {
      oasExtensionConfig = {};
      this.log.oasObjectNotFound(this);
    } else {
      this.log.foundOasObject(this);
    }
    this.oasObject = Object.assign({}, DEFAULT_OAS_OBJECT, oasExtensionConfig.oasObject);
    this.oasObject.components = { ...(this.oasObject.components || {}) };
  }

  protected setSecurityInfo(operationObject: XOperationObject, normalizedGuards: NormalizedGuard[]) {
    const security: XSecurityRequirementObject[] = [];
    const tags: string[] = [];
    const responses: XResponsesObject = {};
    normalizedGuards.forEach((normalizedGuard) => {
      const guardName = normalizedGuard.guard.name;
      const numberOfDecorators = reflector.getDecorators(normalizedGuard.guard)?.length || 0;
      reflector.getDecorators(normalizedGuard.guard)?.forEach((decor, index) => {
        let securityName = numberOfDecorators > 1 ? `${guardName}_${index}` : guardName;
        securityName = securityName.charAt(0).toLowerCase() + securityName.slice(1);

        this.oasObject.components!.securitySchemes = { ...(this.oasObject.components!.securitySchemes || {}) };
        this.oasObject.components!.securitySchemes[securityName] =
          decor.value?.securitySchemeObject || defaultForNonOasGuard.securitySchemeObject;
        let scopes = normalizedGuard.params || [];
        if (!scopes.some((scope) => typeof scope == 'string')) {
          scopes = [];
        }

        security.push({ [securityName]: scopes });
        tags.push(...(decor.value?.tags || defaultForNonOasGuard.tags || []));
        Object.assign(responses, decor.value?.responses || defaultForNonOasGuard.responses);
      });
    });
    this.mergeOperationObjects(operationObject, security, tags, responses);
  }

  protected mergeOperationObjects(
    operationObject: XOperationObject,
    newSecurities: XSecurityRequirementObject[],
    newTags: string[],
    responses: XResponsesObject,
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
    normalizedGuards: NormalizedGuard[],
  ) {
    httpMethod = httpMethod.toLowerCase() as HttpMethod;
    const parameters: XParameterObject[] = [];
    path = `/${path}`.replace(/:([^/]+)/g, (_, name) => {
      parameters.push({ in: 'path', name, required: true });
      return `{${name}}`;
    });
    const operationObject: XOperationObject = { tags: ['NonOasRoutes'], parameters, responses: {} };
    this.setSecurityInfo(operationObject, normalizedGuards);
    if (['POST', 'PATCH', 'PUT'].includes(httpMethod)) {
      operationObject.requestBody = {
        description: 'It is default content field for non-oasRoute',
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
