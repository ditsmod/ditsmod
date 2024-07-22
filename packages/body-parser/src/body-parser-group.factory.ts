import { injectable, methodFactory, optional } from '@ditsmod/core';
import { BodyParserGroup } from '@ts-stack/body-parser';

import { BodyParserConfig } from './body-parser-config.js';

@injectable()
export class BodyParserGroupFactory {
  @methodFactory()
  getBodyParserGroup(@optional() config?: BodyParserConfig) {
    config = Object.assign({}, new BodyParserConfig(), config); // Merge with default.

    const bodyParserGroup = new BodyParserGroup({
      jsonOptions: config.jsonOptions,
      textOptions: config.textOptions,
      urlencodedOptions: config.urlencodedOptions,
      rawOptions: config.rawOptions,
    });

    return bodyParserGroup;
  }
}
