import { LogMediator, MsgLogFilter } from '@ditsmod/core';
import webpack from 'webpack';

export class OpenapiLogMediator extends LogMediator {
  skippingOverrideFilePath(self: object, filePath: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['openapi'];
    this.setLog('trace', msgLogFilter, `${className}: skipping override ${filePath}`);
  }

  overrideFilePath(self: object, filePath: string, currentFileContent: string, futureFileContent: string, startOrFinish: 'Start' | 'Finish' | 'Rollback during') {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['openapi'];
    this.setLog('trace', msgLogFilter, `${className}: ${startOrFinish} override ${filePath} from "${currentFileContent}" to "${futureFileContent}"`);
  }

  showStatTrace(self: object, stats: webpack.Stats) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    msgLogFilter.tags = ['openapi'];
    const msg = stats.toString({
      chunks: false, // Makes the build much quieter
      colors: false, // Shows colors
    });
    this.setLog('trace', msgLogFilter, `${className}: ${msg}`);
  }
}
