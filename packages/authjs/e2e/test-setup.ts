globalThis.crypto ??= (await import('node:crypto')).webcrypto as any;
