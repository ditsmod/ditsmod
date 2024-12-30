import { RawResponse } from '@ditsmod/core';

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
