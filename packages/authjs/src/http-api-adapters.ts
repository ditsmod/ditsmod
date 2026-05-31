import type { AnyObj } from '@ditsmod/core';
import type { RequestContext } from '@ditsmod/rest';

/**
 * Adapts Ditsmod Request to a Web Request, returning the Web Request.
 */
export function toWebRequest(reqCtx: RequestContext, alternativeUrl?: string) {
  const url = `${reqCtx.protocol}://${process.env.HOST ?? 'localhost'}${alternativeUrl || reqCtx.rawReq.url}`;
  const headers = new Headers();

  Object.entries(reqCtx.rawReq.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => v && headers.append(key, v));
      return;
    }

    if (value) {
      headers.append(key, value);
    }
  });

  // GET and HEAD not allowed to receive body
  const body = /GET|HEAD/.test(reqCtx.rawReq.method || '') ? undefined : encodeRequestBody(reqCtx);

  const request = new Request(url, {
    method: reqCtx.rawReq.method,
    headers,
    body,
  } satisfies RequestInit);

  return request;
}

/**
 * Encodes Ditsmod Request body based on the content type header.
 */
function encodeRequestBody(reqCtx: RequestContext): BodyInit | null | undefined {
  const contentType = reqCtx.rawReq.headers['content-type'];

  if (contentType?.includes('application/x-www-form-urlencoded')) {
    return encodeUrlEncoded(reqCtx.body);
  }

  return encodeJson(reqCtx.body);
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
