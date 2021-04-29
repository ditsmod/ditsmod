import { XMediaTypeObject } from '@ts-stack/openapi-spec';

import { mediaTypeName } from '../types/media-types';

export class Content {
  protected content: {
    [mediaTypeName: string]: XMediaTypeObject;
  };

  /**
   * Sets media type.
   */
  mime<T extends mediaTypeName = mediaTypeName>(name: T, params?: string) {
    return this;
  }

  getContent() {
    return { ...this.content };
  }
}
