import * as util from 'util';
import * as http from 'http';
import { Injectable, Inject } from 'ts-di';
import Negotiator = require('negotiator');

import {
  NodeRequest,
  NodeResponse,
  NodeReqToken,
  NodeResToken,
  RedirectStatusCodes,
  FormattersMap
} from './types/types';
import { Request } from './request';
import { Status, getStatusText, isSuccess } from './http-status-codes';
import { Format } from './services/format';

@Injectable()
export class Response {
  protected acceptable: string[];
  protected formatters: FormattersMap;
  protected charset: string;

  constructor(
    @Inject(NodeReqToken) protected readonly nodeReq: NodeRequest,
    @Inject(NodeResToken) public readonly nodeRes: NodeResponse,
    protected req: Request,
    protected format: Format,
    protected negotiator: Negotiator
  ) {
    this.acceptable = format.getAcceptable();
    this.formatters = format.getFormatters();
  }

  /**
   * Setting value to the response header `Content-Type`.
   *
   * @example
   *
   * res.setContentType('application/xml').send({ one: 1, two: 1 });
   */
  setContentType(contentType: string) {
    this.nodeRes.setHeader('Content-Type', contentType);
    return this;
  }

  /**
   * Appends the provided character set to the response's `Content-Type` header,
   * e.g., `res.setCharset('utf-8');`
   */
  setCharset(charset: string): this {
    this.charset = charset;
    return this;
  }

  send(statusCode: Status, data?: any): void;
  send(data: any): void;
  send(dataOrStatusCode: any, data?: any): void {
    let statusCode = Status.OK;

    if (typeof dataOrStatusCode == 'number' && dataOrStatusCode > 99 && dataOrStatusCode < 501) {
      this.nodeRes.statusCode = statusCode = dataOrStatusCode;
    } else {
      data = dataOrStatusCode;
    }

    if (!isSuccess(statusCode)) {
      data = data || getStatusText(statusCode);
    }

    /**
     * Response `Content-Type`.
     */
    const resContentType = this.nodeRes.getHeader('Content-Type');
    let contentType = '';

    if (!resContentType) {
      if (this.negotiator.mediaType(this.acceptable)) {
        contentType = this.negotiator.mediaType(this.acceptable);
      }

      if (!contentType) {
        this.sendError(Status.NOT_ACCEPTABLE, 'could not find suitable formatter');
        return;
      }
    } else if (typeof resContentType == 'string' && resContentType.includes(';')) {
      contentType = contentType.split(';')[0];
    } else if (Array.isArray(resContentType)) {
      contentType = resContentType[0];
    } else {
      contentType = resContentType.toString();
    }

    let formatter = this.formatters.get(contentType);

    if (!formatter) {
      if (this.acceptable.indexOf(contentType) === -1) {
        contentType = 'application/octet-stream';
      }

      formatter = formatter || this.formatters.get('*/*');

      if (!formatter) {
        this.sendError(Status.INTERNAL_SERVER_ERROR, 'could not find formatter for application/octet-stream');
        return;
      }
    }

    contentType = contentType + '; charset=' + (this.charset || 'utf-8');
    this.nodeRes.setHeader('Content-Type', contentType);
    const formattedData = formatter(data);
    this.nodeRes.setHeader('Content-Length', Buffer.byteLength(formattedData).toString());
    this.nodeRes.end(formattedData);
  }

  redirect(statusCode: RedirectStatusCodes, path: string) {
    this.nodeRes.writeHead(statusCode, { Location: path });
    this.nodeRes.end();
  }

  protected sendError(statusCode: Status, message?: string): void {
    this.nodeRes.statusCode = statusCode;
    this.nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8');
    const str = JSON.stringify({ error: message });
    this.nodeRes.setHeader('Content-Length', Buffer.byteLength(str).toString());
    this.nodeRes.end(str);
  }

  toString() {
    const headers = this.nodeReq.headers;
    let headerString = '';
    let str: string;

    Object.keys(headers).forEach(k => (headerString += k + ': ' + headers[k] + '\n'));

    str = util.format(
      'HTTP/%s %s %s\n%s',
      this.nodeReq.httpVersion,
      this.nodeRes.statusCode,
      http.STATUS_CODES[this.nodeRes.statusCode],
      headerString
    );

    return str;
  }
}
