import { newCustomError } from '@ditsmod/core/errors';

export const oasErrors = {
  /**
   * `You can not set this action to non-exists parameter`
   */
  youCanNotSetThisAction() {
    return newCustomError(oasErrors.youCanNotSetThisAction, {
      msg1: 'You can not set this action to non-exists parameter',
      level: 'fatal',
    });
  },
  /**
   * `Wrong definition for ${modelName}: property '${property}' is an array or not array?`
   */
  arrayTypeDefinitionConflict(modelName: string, property: string) {
    return newCustomError(oasErrors.arrayTypeDefinitionConflict, {
      msg1: `Wrong definition for ${modelName}: property '${property}' is an array or not array?`,
      level: 'fatal',
    });
  },
  /**
   * `Wrong definition for ${modelName}: property '${property}' is an enum or an array?`
   */
  enumTypeDefinitionConflict(modelName: string, property: string) {
    return newCustomError(oasErrors.enumTypeDefinitionConflict, {
      msg1: `Wrong definition for ${modelName}: property '${property}' is an enum or an array?`,
      level: 'fatal',
    });
  },
  /**
   * `Compiling OAS routes failed: ${moduleName} have a route with
   * param: "{${paramName}}", you must convert this to ":${paramName}"`
   */
  compilingOasRoutesFailed(moduleName: string, paramName: string) {
    return newCustomError(oasErrors.compilingOasRoutesFailed, {
      msg1:
        `Compiling OAS routes failed: ${moduleName} have a route ` +
        `with param: "{${paramName}}", you must convert this to ":${paramName}"`,
      level: 'fatal',
    });
  },
  /**
   * `[${moduleName}]: OpenapiCompilerExtension: OasRouteMeta not found.`
   */
  oasRouteMetaNotFound(moduleName: string) {
    return newCustomError(oasErrors.oasRouteMetaNotFound, {
      msg1: `[${moduleName}]: OpenapiCompilerExtension: OasRouteMeta not found.`,
      level: 'fatal',
    });
  },
  /**
   * `Settings OpenAPI parameters in ${controllerName} failed: parameter "${paramName}" not found in "${path}".`
   */
  throwParamNotFoundInPath(controllerName: string, paramName: string, path: string) {
    return newCustomError(oasErrors.throwParamNotFoundInPath, {
      msg1: `Settings OpenAPI parameters in ${controllerName} failed: parameter "${paramName}" not found in "${path}".`,
      level: 'fatal',
    });
  },
};
