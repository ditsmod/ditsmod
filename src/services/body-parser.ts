import { Injectable, Inject } from '@ts-stack/di';
import { ObjectAny } from '../types/types';
import { BodyParserConfig } from '../types/types';
import { NodeReqToken } from '../types/injection-tokens';
import { NodeRequest } from '../types/server-options';

@Injectable()
export class BodyParser {
  protected rawBody: string;
  protected body: ObjectAny;

  constructor(@Inject(NodeReqToken) private readonly nodeReq: NodeRequest, private config: BodyParserConfig) {}

  getRawBody(): Promise<string> {
    if (this.rawBody !== undefined) {
      return Promise.resolve(this.rawBody);
    }

    return new Promise((resolve, reject) => {
      const bodyArr: Uint8Array[] = [];
      this.nodeReq
        .on('error', err => {
          reject(err);
        })
        .on('data', chunk => {
          bodyArr.push(chunk);
        })
        .on('end', () => {
          try {
            this.rawBody = Buffer.concat(bodyArr).toString();
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
        const rawBody = await this.getRawBody();
        const body = JSON.parse(rawBody);
        resolve(body);
      } catch (e) {
        reject(e);
      }
    });
  }
}
