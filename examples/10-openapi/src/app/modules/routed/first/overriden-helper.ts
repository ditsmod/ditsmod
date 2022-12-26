import { Content, mediaTypeName, ContentOptions, property } from '@ditsmod/openapi';

/**
 * This class uses template to putting type model to `content`.
 *
 * For example, `SomeModel` transform to `{ data: SomeModel[], meta: any, error: any }`.
 */
export class MetaContent extends Content {
  override set<T extends mediaTypeName = mediaTypeName>(contentOptions: ContentOptions<T>) {
    contentOptions = { ...contentOptions };
    class ApiResponse {
      @property({ type: 'array' }, { array: contentOptions.model! })
      data: any[];
      @property()
      meta: any;
      @property()
      error: any;
    }
    contentOptions.model = ApiResponse;
    return super.set(contentOptions);
  }
}

export function getMetaContent<T extends mediaTypeName = mediaTypeName>(contentOptions?: ContentOptions<T>) {
  return new MetaContent().get(contentOptions);
}
