import { CustomError } from '@ditsmod/core';

/**
 * `You can not set this action to non-exists parameter`
 */
export class YouCanNotSetThisAction extends CustomError {
  constructor() {
    super({
      msg1: 'You can not set this action to non-exists parameter',
      level: 'fatal',
    });
  }
}
/**
 * `Wrong definition for ${modelName}: property '${property}' is an array or not array?`
 */
export class ArrayTypeDefinitionConflict extends CustomError {
  constructor(modelName: string, property: string) {
    super({
      msg1: `Wrong definition for ${modelName}: property '${property}' is an array or not array?`,
      level: 'fatal',
    });
  }
}
/**
 * `Wrong definition for ${modelName}: property '${property}' is an enum or an array?`
 */
export class EnumTypeDefinitionConflict extends CustomError {
  constructor(modelName: string, property: string) {
    super({
      msg1: `Wrong definition for ${modelName}: property '${property}' is an enum or an array?`,
      level: 'fatal',
    });
  }
}
/**
 * `Compiling OAS routes failed: ${moduleName} have a route with
 * param: "{${paramName}}", you must convert this to ":${paramName}"`
 */
export class CompilingOasRoutesFailed extends CustomError {
  constructor(moduleName: string, paramName: string) {
    super({
      msg1:
        `Compiling OAS routes failed: ${moduleName} have a route ` +
        `with param: "{${paramName}}", you must convert this to ":${paramName}"`,
      level: 'fatal',
    });
  }
}
/**
 * `[${moduleName}]: OpenapiCompilerExtension: OasRouteMeta not found.`
 */
export class OasRouteMetaNotFound extends CustomError {
  constructor(moduleName: string) {
    super({
      msg1: `[${moduleName}]: OpenapiCompilerExtension: OasRouteMeta not found.`,
      level: 'fatal',
    });
  }
}
// export class X extends CustomError {
//   constructor() {
//     super();
//   }
// }
/**
 * `Settings OpenAPI parameters in ${controllerName} failed: parameter "${paramName}" not found in "${path}".`
 */
export class ThrowParamNotFoundInPath extends CustomError {
  constructor(controllerName: string, paramName: string, path: string) {
    super({
      msg1: `Settings OpenAPI parameters in ${controllerName} failed: parameter "${paramName}" not found in "${path}".`,
      level: 'fatal',
    });
  }
}
