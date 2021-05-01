import { ModuleWithParams } from '@ditsmod/core';
import { XParameterObject, ReferenceObject } from '@ts-stack/openapi-spec';

export interface OasModuleWithParams extends ModuleWithParams {
  /**
   * OasOptions to be used for this module, as well as for its child modules.
   * 
   * Example useage:
   * 
   * ```ts
import { OasModuleWithParams } from '@ditsmod/openapi';

@Module({
  imports: [
    {
      prefix: 'posts/:postId',
      oasOptions: { parameters: [{ in: 'path', name: 'postId', required: true }] },
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

/**
 * Applies to importing `OasModuleWithParams`.
 */
export interface OasOptions {
  paratemers?: (XParameterObject | ReferenceObject)[];
  tags?: string[];
}
