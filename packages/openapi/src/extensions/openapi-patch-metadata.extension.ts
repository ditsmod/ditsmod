import { Inject, Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';
import { ReferenceObject, XParameterObject } from '@ts-stack/openapi-spec';

import { OasModuleWithParams } from '../types/oas-modul-with-params';
import { isReferenceObject } from '../utils/type-guards';
import { getLastParameterObjects, getLastReferenceObjects } from '../utils/get-last-params';

@Injectable()
export class OpenapiPatchMetadataExtension implements edk.Extension<void> {
  protected inited: boolean;

  constructor(@Inject(edk.APP_METADATA_MAP) protected appMetadataMap: edk.AppMetadataMap) {}

  async init() {
    if (this.inited) {
      return;
    }

    this.appMetadataMap.forEach((metadataPerMod) => {
      const { moduleMetadata } = metadataPerMod;
      this.setPrefixParams(moduleMetadata);
    });

    this.inited = true;
  }

  protected setPrefixParams(moduleMetadata: edk.NormalizedModuleMetadata) {
    if (edk.isModuleWithParams(moduleMetadata.module)) {
      const { prefixParams } = moduleMetadata.module as OasModuleWithParams;
      if (prefixParams?.length) {
        let imp: OasModuleWithParams;
        for (imp of moduleMetadata.importsWithParams) {
          imp.prefixParams = this.getUniqParams([...prefixParams, ...(imp.prefixParams || [])]);
        }
      }
    }
  }

  protected getUniqParams(prefixParams: (XParameterObject<any> | ReferenceObject)[]) {
    const referenceObjects: ReferenceObject[] = [];
    const parametersObjets: XParameterObject[] = [];
    for (const param of prefixParams) {
      if (isReferenceObject(param)) {
        referenceObjects.push(param);
      } else {
        parametersObjets.push(param);
      }
    }

    return [...getLastReferenceObjects(referenceObjects), ...getLastParameterObjects(parametersObjets)];
  }
}
