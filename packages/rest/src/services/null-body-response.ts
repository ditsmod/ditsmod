import { ServerResponse, type IncomingMessage } from 'node:http';

/**
 * A drop-in ServerResponse replacement for HEAD requests.
 * Forwards all header operations to the real response but discards the body.
 */
export class NullBodyResponse extends ServerResponse<IncomingMessage> {
  #real: ServerResponse;
  #bodyByteLength = 0;
  #isChunked = false;

  constructor(real: ServerResponse) {
    // ServerResponse requires an IncomingMessage; borrow from real.
    // No socket assignment needed: this wrapper never writes directly to the
    // socket — all I/O is delegated to this.#real via end().
    super(real.req);
    this.#real = real;
  }

  override write(
    chunk: any,
    encodingOrCb?: BufferEncoding | ((err: Error | null | undefined) => void),
    cb?: (err: Error | null | undefined) => void,
  ): boolean {
    // Track chunked mode; discard body
    this.#isChunked = true;
    const callback = typeof encodingOrCb == 'function' ? encodingOrCb : cb;
    callback?.(null);
    return true;
  }

  override end(chunkOrCb?: any, encodingOrCb?: BufferEncoding | (() => void), cb?: () => void): this {
    if (!this.#real.headersSent) {
      if (this.#isChunked) {
        this.#real.setHeader('Transfer-Encoding', 'chunked');
      } else {
        if (chunkOrCb && typeof chunkOrCb != 'function') {
          const enc: BufferEncoding = !encodingOrCb || typeof encodingOrCb == 'function' ? 'utf8' : encodingOrCb;
          this.#bodyByteLength = Buffer.byteLength(chunkOrCb, enc);
        }
        this.#real.setHeader('Content-Length', this.#bodyByteLength);
      }
      // Forward all headers that were set on *this* wrapper
      for (const [key, val] of Object.entries(this.getHeaders())) {
        if (val !== undefined) this.#real.setHeader(key, val as any);
      }
      this.#real.statusCode = this.statusCode;
    }
    this.#real.end(); // sends headers + empty body
    return this;
  }

  // Proxy header methods to the real response so headers are not lost
  override setHeader(name: string, value: string | number | string[]): this {
    super.setHeader(name, value); // track locally for forwarding
    this.#real.setHeader(name, value); // set immediately on real res
    return this;
  }

  override removeHeader(name: string): void {
    super.removeHeader(name);
    this.#real.removeHeader(name);
  }
}
