import { SecretOrPrivateKey, SecretOrPublicKey, SignOptions, VerifyOptions } from 'jsonwebtoken';

export interface SignWithSecretOptions extends SignOptions {
  secret: string | Buffer;
}

export interface SignWithPrivateKeyOptions extends SignOptions {
  privateKey: SecretOrPrivateKey;
}

export interface VerifyWithSecretOptions extends VerifyOptions {
  secret: string | Buffer;
}

export interface VerifyWithPublicKeyOptions extends VerifyOptions {
  publicKey: SecretOrPublicKey;
}
