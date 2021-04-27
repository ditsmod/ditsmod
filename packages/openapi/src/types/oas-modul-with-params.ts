import { ModuleWithParams } from '@ditsmod/core';
import { XParameterObject, ReferenceObject } from '@ts-stack/openapi-spec';

export interface OasModuleWithParams extends ModuleWithParams {
  /**
   * Here you can pass an OAS params applicable for prefix that contains parameters,
   * for example:
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
  prefixParams?: (XParameterObject | ReferenceObject)[];
}
