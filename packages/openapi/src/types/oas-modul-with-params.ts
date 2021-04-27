import { ModuleWithParams } from '@ditsmod/core';
import { XParameterObject, ReferenceObject } from '@ts-stack/openapi-spec';

export interface OasModuleWithParams extends ModuleWithParams {
  prefixParams?: (XParameterObject | ReferenceObject)[];
}
