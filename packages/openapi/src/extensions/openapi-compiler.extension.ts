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
  GroupStage1MetaPerApp,
  NormalizedGuard,
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
import { DEFAULT_OAS_OBJECT } from '#constants';
import { isOasGuard } from '#utils/type-guards.js';
import { OasConfigFiles, OasExtensionOptions } from '#types/oas-extension-options.js';
import { OasOptions } from '#types/oas-options.js';
import { OpenapiLogMediator } from '../services/openapi-log-mediator.js';

@injectable()
export class OpenapiCompilerExtension implements Extension<XOasObject | false> {
  protected oasObject: XOasObject;

  constructor(
    private perAppService: PerAppService,
    private injectorPerMod: Injector,
    private extensionsManager: ExtensionsManager,
    private log: OpenapiLogMediator,
    @optional() private extensionsMetaPerApp?: ExtensionsMetaPerApp,
  ) {}

  async stage1() {
    if (this.oasObject) {
      return this.oasObject;
    }

    const groupStage1Meta = await this.extensionsManager.stage1(ROUTES_EXTENSIONS, true);
    if (groupStage1Meta.delay) {
      this.log.dataAccumulation(this);
      return false;
    }
    this.log.applyingAccumulatedData(this);

    await this.compileOasObject(groupStage1Meta.groupStage1MetaPerApp);
    const json = JSON.stringify(this.oasObject);
    const oasOptions = this.extensionsMetaPerApp?.oasOptions as OasOptions | undefined;
    const yaml = stringify(this.oasObject, oasOptions?.yamlSchemaOptions);
    this.perAppService.reinitInjector([{ token: OasConfigFiles, useValue: { json, yaml } }]);

    return this.oasObject;
  }

  protected async compileOasObject(groupStage1MetaPerApp: GroupStage1MetaPerApp<MetadataPerMod3>[]) {
    const paths: XPathsObject = {};
    this.initOasObject();
    for (const groupStage1Meta of groupStage1MetaPerApp) {
      for (const stage1Meta of groupStage1Meta.aExtStage1Meta) {
        const { aControllerMetadata } = stage1Meta.payload;

        aControllerMetadata.forEach(({ httpMethod, path, routeMeta, guards }) => {
          const { oasPath, resolvedGuards, operationObject } = routeMeta as OasRouteMeta;
          if (operationObject) {
            const clonedOperationObject = { ...operationObject };
            this.setSecurityInfo(clonedOperationObject, guards);
            const pathItemObject: PathItemObject = { [httpMethod.toLowerCase()]: clonedOperationObject };
            paths[`/${oasPath}`] = { ...(paths[`/${oasPath}`] || {}), ...pathItemObject };
          } else {
            if (!httpMethod) {
              throw new Error('OpenapiCompilerExtension: OasRouteMeta not found.');
            }
            this.applyNonOasRoute(path, paths, httpMethod, guards);
          }
        });
      }
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

  protected setSecurityInfo(operationObject: XOperationObject, normalizedGuards: NormalizedGuard[]) {
    const security: XSecurityRequirementObject[] = [];
    const tags: string[] = [];
    const responses: XResponsesObject = {};
    normalizedGuards.forEach((normalizedGuard) => {
      const decoratorsValues = reflector.getMetadata(normalizedGuard.guard)?.constructor.decorators || [];
      const aOasGuardMetadata = decoratorsValues.filter(isOasGuard);
      const guardName = normalizedGuard.guard.name;

      aOasGuardMetadata.forEach((oasGuardMetadata, index) => {
        let securityName = aOasGuardMetadata.length > 1 ? `${guardName}_${index}` : guardName;
        securityName = securityName.charAt(0).toLowerCase() + securityName.slice(1);
        this.oasObject.components!.securitySchemes = { ...(this.oasObject.components!.securitySchemes || {}) };
        this.oasObject.components!.securitySchemes[securityName] = oasGuardMetadata.value.securitySchemeObject;
        let scopes = normalizedGuard.params || [];
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
