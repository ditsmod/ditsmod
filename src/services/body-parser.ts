import { Injectable, Inject } from '@ts-stack/di';
import zlib = require('zlib');

import { ObjectAny } from '../types/types';
import { BodyParserConfig } from '../types/types';
import { NodeReqToken } from '../types/injection-tokens';
import { NodeRequest } from '../types/server-options';
import { Logger } from '../types/logger';

@Injectable()
export class BodyParser {
  protected rawBody: Buffer;
  protected body: ObjectAny;

  constructor(
    @Inject(NodeReqToken) protected readonly nodeReq: NodeRequest,
    protected config: BodyParserConfig,
    protected log: Logger
  ) {}

  getRawBody() {
    if (this.rawBody !== undefined) {
      return Promise.resolve(this.rawBody);
    }

    return new Promise<Buffer>((resolve, reject) => {
      const nodeReq = this.nodeReq;
      const headers = nodeReq.headers;

      if (
        ((!headers['content-length'] || headers['content-length'] == '0') &&
          headers['transfer-encoding'] != 'chunked') ||
        headers['content-type'].includes('multipart/form-data') ||
        headers['content-type'].includes('application/octet-stream')
      ) {
        resolve(null);
        return;
      }

      nodeReq.once('error', reject);

      let bytesReceived = 0;
      let gz: zlib.Gunzip;
      const buffers: Uint8Array[] = [];
      const done = () => {
        this.rawBody = Buffer.concat(buffers);
        resolve(this.rawBody);
      };

      if (headers['content-encoding'] == 'gzip') {
        gz = zlib.createGunzip();
        gz.once('end', done);
        nodeReq.once('end', gz.end.bind(gz));
      } else {
        nodeReq.once('end', done);
      }

      const maxBodySize = this.config.maxBodySize || 0;

      nodeReq.on('data', (chunk: Uint8Array) => {
        if (maxBodySize) {
          bytesReceived += chunk.length;

          if (bytesReceived > maxBodySize) {
            return reject(new Error('Request body size exceeds ' + maxBodySize));
          }
        }

        if (gz) {
          gz.write(chunk);
        } else {
          buffers.push(chunk);
        }
      });

      nodeReq.resume();
    });
  }

  getJsonBody(): Promise<ObjectAny> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.nodeReq.headers['content-type'].includes('application/json')) {
          resolve(null);
          return;
        }
        const rawBody = (await this.getRawBody()).toString();
        if (!rawBody) {
          resolve(null);
          return;
        }
        const body = JSON.parse(rawBody);
        resolve(body);
      } catch (e) {
        reject(e);
      }
    });
  }
}
