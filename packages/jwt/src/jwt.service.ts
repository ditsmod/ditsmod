import { injectable } from '@ts-stack/di';
import {
  SignPayload,
  SecretOrPrivateKey,
  sign,
  verify,
  SignOptions,
  SecretOrPublicKey,
  VerifyOptions,
  VerifyPayload,
  DecodeOptions,
  decode,
} from 'jsonwebtoken';

import { JwtServiceOptions } from './models/jwt-service-options';
import {
  SignWithPrivateKeyOptions,
  SignWithSecretOptions,
  VerifyWithPublicKeyOptions,
  VerifyWithSecretOptions,
} from './types/mix';

@injectable()
export class JwtService {
  constructor(private options: JwtServiceOptions) {}
  /**
   * Asynchronous sign the given payload into a JSON Web Token and returns it in the Promise as string.
   *
   * @param payload - Payload to sign, could be an object literal, buffer or string representing
   * valid JSON.
   *
   * Please note that `exp` or any other claim is only set if the `payload` is an object literal.
   * Buffer or string payloads are not checked for JSON validity.
   *
   * If `payload` is not a buffer or a string, it will be coerced into a string using
   * `JSON.stringify`.
   *
   * @param options - Options with secret for the signature.
   */
  async signWithSecret(payload: SignPayload, options = {} as SignWithSecretOptions) {
    const secret = options.secret || this.options.secret!;
    delete (options as Partial<SignWithSecretOptions>).secret;
    const mergedOptions = { ...this.options.signOptions, ...options };
    return this.sign(payload, secret, mergedOptions);
  }

  /**
   * Asynchronous sign the given payload into a JSON Web Token and returns it in the Promise as string.
   *
   * @param payload - Payload to sign, could be an object literal, buffer or string representing
   * valid JSON.
   *
   * Please note that `exp` or any other claim is only set if the `payload` is an object literal.
   * Buffer or string payloads are not checked for JSON validity.
   *
   * If `payload` is not a buffer or a string, it will be coerced into a string using
   * `JSON.stringify`.
   *
   * @param options - Options with private key for the signature.
   */
  async signWithPrivateKey(payload: SignPayload, options = {} as SignWithPrivateKeyOptions) {
    const privateKey = options.privateKey || this.options.privateKey!;
    delete (options as Partial<SignWithPrivateKeyOptions>).privateKey;
    const mergedOptions = { ...this.options.signOptions, ...options };
    return this.sign(payload, privateKey, mergedOptions);
  }

  protected sign(payload: SignPayload, secretOrPrivateKey: SecretOrPrivateKey, options: SignOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      sign(payload, secretOrPrivateKey, options, (err, token) => {
        err ? reject(err) : resolve(token);
      });
    });
  }

  /**
   * Returns promise with decoded payload if the signature is valid and optional expiration, audience,
   * or issuer are valid.
   *
   * __Warning__: When the token comes from an untrusted source (e.g. user input or external
   * requests), the returned decoded payload should be treated like any other user input; please
   * make sure to sanitize and only work with properties that are expected.
   *
   * @param token Is the JsonWebToken string.
   * @param secretOrPublicKey Is a string or buffer containing either the secret for HMAC
   * algorithms, or the PEM encoded public key for RSA and ECDSA.
   *
   * As mentioned in [this comment][1], there are other libraries that expect base64 encoded secrets
   * (random bytes encoded using base64), if that is your case you can pass
   * `Buffer.from(secret, 'base64')`, by doing this the secret will be decoded using base64 and
   * the token verification will use the original random bytes.
   * @param options Options with a secret.
   *
   * [1]: https://github.com/auth0/node-jsonwebtoken/issues/208#issuecomment-231861138
   */
  async verifyWithSecret<T = VerifyPayload>(token: string, options = {} as VerifyWithSecretOptions) {
    const secret = options.secret || this.options.secret!;
    delete (options as Partial<VerifyWithSecretOptions>).secret;
    options = { ...this.options.signOptions, ...options };
    return this.virify<T>(token, secret, options);
  }

  /**
   * Returns promise with decoded payload if the signature is valid and optional expiration, audience,
   * or issuer are valid.
   *
   * __Warning__: When the token comes from an untrusted source (e.g. user input or external
   * requests), the returned decoded payload should be treated like any other user input; please
   * make sure to sanitize and only work with properties that are expected.
   *
   * @param token Is the JsonWebToken string.
   * @param secretOrPublicKey Is a string or buffer containing either the secret for HMAC
   * algorithms, or the PEM encoded public key for RSA and ECDSA.
   *
   * As mentioned in [this comment][1], there are other libraries that expect base64 encoded secrets
   * (random bytes encoded using base64), if that is your case you can pass
   * `Buffer.from(secret, 'base64')`, by doing this the secret will be decoded using base64 and
   * the token verification will use the original random bytes.
   * @param options Options with a public key.
   *
   * [1]: https://github.com/auth0/node-jsonwebtoken/issues/208#issuecomment-231861138
   */
  async verifyWithPublicKey<T = VerifyPayload>(token: string, options = {} as VerifyWithPublicKeyOptions) {
    const publicKey = options.publicKey || this.options.publicKey!;
    delete (options as Partial<VerifyWithPublicKeyOptions>).publicKey;
    options = { ...this.options.signOptions, ...options };
    return this.virify<T>(token, publicKey, options);
  }

  protected virify<T>(token: string, secretOrPublicKey: SecretOrPublicKey, options: VerifyOptions): Promise<T> {
    return new Promise((resolve, reject) => {
      verify<T>(token, secretOrPublicKey, options, (err, decoded) => {
        err ? reject(err) : resolve(decoded);
      });
    });
  }

  /**
   * (Synchronous) Returns the decoded payload without verifying if the signature is valid.
   *
   * __Warning__: This will not verify whether the signature is valid. You should not use this
   * for untrusted messages. You most likely want to use `verifyWithSecret` or
   * `verifyWithPublicKey` instead.
   *
   * __Warning__: When the token comes from an untrusted source (e.g. user input or external
   * request), the returned decoded payload should be treated like any other user input; please
   * make sure to sanitize and only work with properties that are expected.
   *
   * @param token JWT string to decode.
   * @param options Options:
   * - `{ json: true }` force JSON.parse on the payload even if the header doesn't
   * contain `"typ":"JWT"`.
   * - `{ complete: true }` return an object with the decoded payload and header.
   */
  decode(token: string, options?: DecodeOptions) {
    return decode(token, options);
  }
}
