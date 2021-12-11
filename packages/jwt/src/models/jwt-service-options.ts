import { SecretOrPrivateKey, SecretOrPublicKey, SignOptions, VerifyOptions } from 'jsonwebtoken';

/**
 * Used as an interface and DI token.
 */
export class JwtServiceOptions {
  secret?: string | Buffer;
  publicKey?: SecretOrPublicKey;
  privateKey?: SecretOrPrivateKey;
  signOptions?: SignOptions = {};
  verifyOptions?: VerifyOptions = {};
}
