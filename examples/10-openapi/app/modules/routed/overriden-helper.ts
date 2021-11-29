import { Content, mediaTypeName, ContentOptions, Column } from '@ditsmod/openapi';

/**
 * This class uses template to putting type model to `content`.
 *
 * For example, `SomeModel` transform to `{ data: SomeModel[], meta: any, error: any }`.
 */
export class MetaContent extends Content {
  set<T extends mediaTypeName = mediaTypeName>(contentOptions: ContentOptions<T>) {
    contentOptions = { ...contentOptions };
    class ApiResponse {
      @Column({ type: 'array' }, contentOptions.model)
      data: any[];
      @Column()
      meta: any;
      @Column()
      error: any;
    }
    contentOptions.model = ApiResponse;
    return super.set(contentOptions);
  }
}

export function getMetaContent<T extends mediaTypeName = mediaTypeName>(contentOptions?: ContentOptions<T>) {
  return new MetaContent().get(contentOptions);
}
