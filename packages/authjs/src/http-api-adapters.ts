import { AnyObj, RawResponse, RequestContext } from '@ditsmod/core';

/**
 * Adapts Ditsmod Request to a Web Request, returning the Web Request.
 */
export function toWebRequest(ctx: RequestContext) {
  const url = `${ctx.protocol}://${process.env.HOST ?? 'localhost'}${ctx.rawReq.url}`;
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

/**
 * Adapts a Web Response to Ditsmod Response, invoking appropriate
 * Ditsmod response methods to handle the response.
 */
export async function toDitsmodResponse(response: Response, rawRes: RawResponse) {
  response.headers.forEach((value, key) => {
    if (value) {
      rawRes.appendHeader(key, value);
    }
  });

  // Explicitly write the headers for content-type
  // https://stackoverflow.com/a/59449326/13944042
  rawRes.writeHead(response.status, response.statusText, {
    'Content-Type': response.headers.get('content-type') || '',
  });

  // res.write(await response.text());
  rawRes.end(await response.text());
}
