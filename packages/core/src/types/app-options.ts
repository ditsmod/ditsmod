import { HttpModule } from '#types/http-module.js';
import { ServerOptions } from '#types/server-options.js';

export class AppOptions {
  httpModule?: HttpModule | null = null;
  serverOptions?: ServerOptions = {};
  path?: string = '';
  /**
   * If `{ bufferLogs: true }`, all messages are buffered during application initialization
   * and flushed afterwards. This can be useful if you want all messages to be logged by
   * the final logger, which is configured after the application is fully initialized.
   * 
   * Default - `true`.
   */
  bufferLogs?: boolean = true;
}
