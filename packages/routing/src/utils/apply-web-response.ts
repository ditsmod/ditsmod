import { RawResponse } from '#mod/request.js';

/**
 * Apply a Web Response to Ditsmod Response.
 */
export async function applyResponse(response: Response, rawRes: RawResponse) {
  applyHeaders(response, rawRes);

  // Explicitly write the headers for content-type
  // https://stackoverflow.com/a/59449326/13944042
  rawRes.writeHead(response.status, response.statusText, {
    'Content-Type': response.headers.get('content-type') || '',
  });

  rawRes.end(await response.text());
}

/**
 * Apply a Web Response headers to Ditsmod Response headers.
 */
export function applyHeaders(response: Response, rawRes: RawResponse) {
  response.headers.forEach((value, key) => rawRes.appendHeader(key, value));
}
