import { RouteMeta } from '@ditsmod/routing';
import { XOperationObject } from '@ts-stack/openapi-spec';

/**
 * This metadata is generated by `RoutesExtension`, and available via DI per
 * a route.
 */
export class OasRouteMeta extends RouteMeta {
  operationObject?: XOperationObject;
  /**
   * Path in format of OpenAPI Specefication, (e.g. `posts/{postId}/comments/{commentId}`).
   */
  oasPath?: string;
}
