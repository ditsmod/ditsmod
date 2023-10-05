import { makeClassDecorator } from '@ditsmod/core';

export interface GuardMetadata {
  /**
   * Default - `false`.
   */
  isSingleton?: boolean;
}

export const guard = makeClassDecorator((data?: GuardMetadata) => data);
