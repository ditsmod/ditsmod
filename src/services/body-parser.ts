import { Injectable, Inject } from '@ts-stack/di';

import { ObjectAny } from '../types/types';
import { BodyParserConfig } from '../types/types';
import { NodeReqToken } from '../types/injection-tokens';
import { NodeRequest } from '../types/server-options';

@Injectable()
export class BodyParser {
  protected rawBody: Buffer;
  protected body: ObjectAny;

  constructor(@Inject(NodeReqToken) protected readonly nodeReq: NodeRequest, protected config: BodyParserConfig) {}

  getRawBody(): Promise<Buffer> {
    if (this.rawBody !== undefined) {
      return Promise.resolve(this.rawBody);
    }

    return new Promise((resolve, reject) => {
      const bodyArr: Uint8Array[] = [];
      this.nodeReq
        .on('error', (err) => {
          reject(err);
        })
        .on('data', (chunk) => {
          bodyArr.push(chunk);
        })
        .on('end', () => {
          try {
            this.rawBody = Buffer.concat(bodyArr);
            resolve(this.rawBody);
          } catch (e) {
            reject(e);
          }
        });
    });
  }

  getJsonBody(): Promise<ObjectAny> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.nodeReq.headers['content-type'] != 'application/json') {
          resolve(null);
          return;
        }
        const rawBody = await (await this.getRawBody()).toString();
        const body = JSON.parse(rawBody);
        resolve(body);
      } catch (e) {
        reject(e);
      }
    });
  }
}
