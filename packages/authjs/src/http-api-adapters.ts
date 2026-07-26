import type { AnyObj } from '@ditsmod/core';
import type { RequestContext } from '@ditsmod/rest';

function getHeaderValue(val: string | string[] | undefined): string | undefined {
  if (!val) {
    return undefined;
  }
  const str = Array.isArray(val) ? val[0] : val;
  return str.split(',')[0].trim() || undefined;
}

/**
 * Adapts Ditsmod Request to a Web Request, returning the Web Request.
 */
export function toWebRequest(ctx: RequestContext, alternativeUrl?: string) {
  const host =
    getHeaderValue(ctx.rawReq.headers['x-forwarded-host']) ??
    getHeaderValue(ctx.rawReq.headers.host) ??
    process.env.HOST ??
    'localhost';
  const protocol = getHeaderValue(ctx.rawReq.headers['x-forwarded-proto']) ?? ctx.protocol;
  const url = `${protocol}://${host}${alternativeUrl || ctx.rawReq.url}`;
  const headers = new Headers();

  Object.entries(ctx.rawReq.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => v && headers.append(key, v));
      return;
    }

    if (value) {
      headers.append(key, value);
    }
  });

  // GET and HEAD not allowed to receive body
  const body = /GET|HEAD/.test(ctx.rawReq.method || '') ? undefined : encodeRequestBody(ctx);

  const request = new Request(url, {
    method: ctx.rawReq.method,
    headers,
    body,
  } satisfies RequestInit);

  return request;
}

/**
 * Encodes Ditsmod Request body based on the content type header.
 */
function encodeRequestBody(ctx: RequestContext): BodyInit | null | undefined {
  const contentType = ctx.rawReq.headers['content-type'];

  if (contentType?.includes('application/x-www-form-urlencoded')) {
    return encodeUrlEncoded(ctx.body);
  }

  return encodeJson(ctx.body);
}

/**
 * Encodes an object as url-encoded string.
 */
export function encodeUrlEncoded(body: AnyObj = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(body)) {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.append(key, value);
    }
  }

  return params.toString();
}

/**
 * Encodes an object as JSON
 */
function encodeJson(obj?: AnyObj) {
  return JSON.stringify(obj);
}
