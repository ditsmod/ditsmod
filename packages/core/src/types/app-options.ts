import { HttpModule } from '#types/http-module.js';
import { ServerOptions } from '#types/server-options.js';

export class AppOptions {
  httpModule?: HttpModule | null = null;
  serverOptions?: ServerOptions = {};
  /**
   * This is the root prefix that will be added to all routes.
   */
  path?: string = '';
  /**
   * If `{ bufferLogs: true }`, all messages are buffered during application initialization
   * and flushed afterwards. This can be useful if you want all messages to be logged by
   * the final logger, which is configured after the application is fully initialized.
   * 
   * Set this option to `false` if you are debugging and want logs to be written without delays.
   * 
   * Default - `true`.
   */
  bufferLogs?: boolean = true;
}
