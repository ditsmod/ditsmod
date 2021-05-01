import { ModuleWithParams } from '@ditsmod/core';
import { XParameterObject, ReferenceObject } from '@ts-stack/openapi-spec';

export interface OasModuleWithParams extends ModuleWithParams {
  /**
   * OAS Parameters to be used for this module, as well as for all its child modules.
   * 
   * Example useage:
   * 
   * ```ts
import { OasModuleWithParams } from '@ditsmod/openapi';

@Module({
  imports: [
    {
      prefix: 'posts/:postId',
      prefixParams: [{ in: 'path', name: 'postId', required: true }],
      module: PostsModule,
    } as OasModuleWithParams
  ],
  // ...
})
export class AppModule {}
   * ```
   */
  oasOptions?: OasOptions;
}

export interface OasOptions {
  paratemers?: (XParameterObject | ReferenceObject)[];
  tags?: string[];
}
