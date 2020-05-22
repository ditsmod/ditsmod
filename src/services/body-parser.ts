import { IncomingMessage } from 'http';
import { Injectable, Inject } from '@ts-stack/di';
import fs = require('fs');
import zlib = require('zlib');
import { IncomingForm, Fields, Files } from 'formidable';

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
        headers['content-type'] == 'multipart/form-data' ||
        headers['content-type'] == 'application/octet-stream'
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
        if (this.nodeReq.headers['content-type'] != 'application/json') {
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

  getFiles() {
    return new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
      const opts = this.config.multipartOpts;
      const headers = this.nodeReq.headers;
      const isEmpty =
        (!headers['content-length'] || headers['content-length'] == '0') && headers['transfer-encoding'] != 'chunked';

      if (isEmpty || !headers['content-type'].includes('multipart/form-data')) {
        return resolve(null);
      }

      this.nodeReq.once('error', reject);

      // this.rawBody = undefined;
      const form = new IncomingForm();

      form.onPart = (part) => {
        if (part.filename && opts.multipartFileHandler) {
          opts.multipartFileHandler(part, this.nodeReq);
        } else if (!part.filename && opts.multipartHandler) {
          opts.multipartHandler(part, this.nodeReq);
        } else {
          form.handlePart(part);
        }
      };

      return form.parse(this.nodeReq as IncomingMessage, (err: Error, fields: Fields, files: Files) => {
        if (err) {
          reject(err);
          return;
        }

        if (opts.mapParams === false || !opts.mapFiles) {
          return resolve({ fields, files });
        }

        const keys = Object.keys(files);
        let i = 0;

        if (!keys.length) {
          resolve({ fields, files });
          this.log.warn(`Files not exists.`);
          return;
        }

        keys.forEach((f) => {
          fs.readFile(files[f].path, (err, data) => {
            ++i;

            /*
             * We want to stop the request here, if there's an
             * error trying to read the file from disk.
             * Ideally we'd like to stop the other oustanding
             * file reads too, but there's no way to cancel in
             * flight fs reads.  So we just return an error, and
             * be grudgingly let the other file reads finish.
             */
            if (err) {
              this.log.error(err);
              return reject(new Error(`${err.message}: Unable to read file ${f}`));
            }

            // req.params[f] = data;

            if (i == keys.length) resolve({ fields, files });
          });
        });
      });
    });
  }
}
