import { Injectable } from '@ts-stack/di';
import { BodyParser } from '@ts-stack/ditsmod';

/**
 * Here you can implements your own parsers.
 * You can use parent's protected properties:
 * - `this.nodeReq` (native node request)
 * - `this.config` (instance of BodyParserConfig)
 * - `this.log` (instance of Logger)
 */
@Injectable()
export class BodyParserService extends BodyParser {
  getRawBody(): Promise<Buffer> {
    this.log.info('work my body parser');
    return super.getRawBody();
  }

  getJsonBody(): Promise<any> {
    return super.getJsonBody();
  }
}
