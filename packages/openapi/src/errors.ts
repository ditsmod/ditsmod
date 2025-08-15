import { oasErrors } from '#services/openapi-error-mediator.js';
export { oasErrors };

export const {
  throwParamNotFoundInPath,
  oasRouteMetaNotFound,
  compilingOasRoutesFailed,
  arrayTypeDefinitionConflict,
  enumTypeDefinitionConflict,
  youCanNotSetThisAction,
} = oasErrors;
