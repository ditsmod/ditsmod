declare module 'jsonwebtoken' {
  export type SignPayload = string | Buffer | object;
  export type SecretOrPrivateKey = string | Buffer | { key: string | Buffer; passphrase: string };
  export type SecretOrPublicKey = string | Buffer;
  export type SignCallback = (err: Error | null, token: string) => void;
  export type VerifyCallback<T = VerifyPayload> = (err: VerifyErrors | null, decoded: T) => void;
  export type SigningKeyCallback = (err: Error | null, signingKey?: SecretOrPrivateKey) => void;
  export type GetKeyCallback = (header: JwtHeader, callback: SigningKeyCallback) => void;
  export interface Jwt {
    payload: VerifyPayload;
    header: JwtHeader;
    signature: string;
  }
  export interface DecodeOptions {
    complete?: boolean;
    json?: boolean;
  }
  /**
   * Returns the JsonWebToken as string.
   *
   * @param payload Could be an object literal, buffer or string representing valid JSON.
   *
   * Please note that `exp` or any other claim is only set if the payload is an object literal.
   * Buffer or string payloads are not checked for JSON validity.
   *
   * If `payload` is not a buffer or a string, it will be coerced into a string using
   * `JSON.stringify`.
   *
   * @param secretOrPrivateKey Is a string, buffer, or object containing either the secret for
   * HMAC algorithms or the PEM encoded private key for RSA and ECDSA. In case of a private key
   * with passphrase an object `{ key, passphrase }` can be used (based on [crypto documentation][1]),
   * in this case be sure you pass the `algorithm` option.
   *
   * [1]: https://nodejs.org/api/crypto.html#signsignprivatekey-outputencoding
   */
  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: SecretOrPrivateKey,
    options?: SignOptions,
  ): string;
  /**
   * If a callback is supplied, the callback is called with the err or the JWT.
   *
   * @param payload Could be an object literal, buffer or string representing valid JSON.
   *
   * Please note that `exp` or any other claim is only set if the payload is an object literal.
   * Buffer or string payloads are not checked for JSON validity.
   *
   * If `payload` is not a buffer or a string, it will be coerced into a string using
   * `JSON.stringify`.
   *
   * @param secretOrPrivateKey Is a string, buffer, or object containing either the secret for
   * HMAC algorithms or the PEM encoded private key for RSA and ECDSA. In case of a private key
   * with passphrase an object `{ key, passphrase }` can be used (based on [crypto documentation][1]),
   * in this case be sure you pass the `algorithm` option.
   *
   * [1]: https://nodejs.org/api/crypto.html#signsignprivatekey-outputencoding
   */
  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: SecretOrPrivateKey,
    options?: SignOptions,
    callback?: SignCallback,
  ): void;

  /**
   * (Synchronous) If a callback is not supplied, function acts synchronously. Returns the payload
   * decoded if the signature is valid and optional expiration, audience, or issuer are valid. If
   * not, it will throw the error.
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
   * @param options
   *
   * [1]: https://github.com/auth0/node-jsonwebtoken/issues/208#issuecomment-231861138
   */
  export function verify(
    token: string,
    secretOrPublicKey: SecretOrPublicKey,
    options: VerifyOptions,
  ): VerifyPayload | string;
  /**
   * (Synchronous) If a callback is not supplied, function acts synchronously. Returns the payload
   * decoded if the signature is valid and optional expiration, audience, or issuer are valid. If
   * not, it will throw the error.
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
   * @param options
   *
   * [1]: https://github.com/auth0/node-jsonwebtoken/issues/208#issuecomment-231861138
   */
  export function verify(
    token: string,
    secretOrPublicKey: SecretOrPublicKey,
    options: VerifyOptions & { complete: true },
  ): Jwt | string;
  /**
   * (Asynchronous) If a callback is supplied, function acts asynchronously. The callback is
   * called with the decoded payload if the signature is valid and optional expiration, audience,
   * or issuer are valid. If not, it will be called with the error.
   *
   * __Warning__: When the token comes from an untrusted source (e.g. user input or external
   * requests), the returned decoded payload should be treated like any other user input; please
   * make sure to sanitize and only work with properties that are expected.
   *
   * @param token Is the JsonWebToken string.
   * @param secretOrPublicKey Is a string or buffer containing either the secret for HMAC
   * algorithms, or the PEM encoded public key for RSA and ECDSA. If `jwt.verify` is called
   * asynchronous, `secretOrPublicKey` can be a function that should fetch the secret or public
   * key.
   *
   * As mentioned in [this comment][1], there are other libraries that expect base64 encoded secrets
   * (random bytes encoded using base64), if that is your case you can pass
   * `Buffer.from(secret, 'base64')`, by doing this the secret will be decoded using base64 and
   * the token verification will use the original random bytes.
   * @param options
   *
   * [1]: https://github.com/auth0/node-jsonwebtoken/issues/208#issuecomment-231861138
   */
  export function verify<T>(
    token: string,
    secretOrPublicKey: SecretOrPublicKey | GetKeyCallback,
    options: VerifyOptions,
    callback: VerifyCallback<T>,
  ): void;
  /**
   * (Asynchronous) If a callback is supplied, function acts asynchronously. The callback is
   * called with the decoded payload if the signature is valid and optional expiration, audience,
   * or issuer are valid. If not, it will be called with the error.
   *
   * __Warning__: When the token comes from an untrusted source (e.g. user input or external
   * requests), the returned decoded payload should be treated like any other user input; please
   * make sure to sanitize and only work with properties that are expected.
   *
   * @param token Is the JsonWebToken string.
   * @param secretOrPublicKey Is a string or buffer containing either the secret for HMAC
   * algorithms, or the PEM encoded public key for RSA and ECDSA. If `jwt.verify` is called
   * asynchronous, `secretOrPublicKey` can be a function that should fetch the secret or public
   * key.
   *
   * As mentioned in [this comment][1], there are other libraries that expect base64 encoded secrets
   * (random bytes encoded using base64), if that is your case you can pass
   * `Buffer.from(secret, 'base64')`, by doing this the secret will be decoded using base64 and
   * the token verification will use the original random bytes.
   * @param options
   *
   * [1]: https://github.com/auth0/node-jsonwebtoken/issues/208#issuecomment-231861138
   */
  export function verify(
    token: string,
    secretOrPublicKey: SecretOrPublicKey | GetKeyCallback,
    options: VerifyOptions & { complete: true },
    callback: VerifyCallback<Jwt>,
  ): void;

  /**
   * (Synchronous) Returns the decoded payload without verifying if the signature is valid.
   *
   * __Warning__: This will not verify whether the signature is valid. You should not use this
   * for untrusted messages. You most likely want to use jwt.verify instead.
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
  export function decode(token: string, options?: DecodeOptions): null | VerifyPayload | string;
  /**
   * (Synchronous) Returns the decoded payload without verifying if the signature is valid.
   *
   * __Warning__: This will not verify whether the signature is valid. You should not use this
   * for untrusted messages. You most likely want to use jwt.verify instead.
   *
   * __Warning__: When the token comes from an untrusted source (e.g. user input or external
   * request), the returned decoded payload should be treated like any other user input; please
   * make sure to sanitize and only work with properties that are expected.
   *
   * @param token JWT string to decode.
   * @param options `{ json: true }` force JSON.parse on the payload even if the header doesn't
   * contain `"typ":"JWT"`.
   */
  export function decode(token: string, options: { json: true }): null | VerifyPayload;
  /**
   * (Synchronous) Returns the decoded payload without verifying if the signature is valid.
   *
   * __Warning__: This will not verify whether the signature is valid. You should not use this
   * for untrusted messages. You most likely want to use jwt.verify instead.
   *
   * __Warning__: When the token comes from an untrusted source (e.g. user input or external
   * request), the returned decoded payload should be treated like any other user input; please
   * make sure to sanitize and only work with properties that are expected.
   *
   * @param token JWT string to decode.
   * @param options `{ complete: true }` return an object with the decoded payload and header.
   */
  export function decode(token: string, options: { complete: true }): null | Jwt;

  /**
   * There are no default values for:
   * - `expiresIn`
   * - `notBefore`
   * - `audience`
   * - `subject`
   * - `issuer`.
   *
   * These claims can also be provided in the payload directly with (respectively):
   * - `exp`
   * - `nbf`
   * - `aud`
   * - `sub`
   * - `iss`
   *
   * But you can't include in both places.
   */
  export interface SignOptions {
    /**
     * Name of the allowed algorithm. Default: `HS256`.
     *
     * Supported algorithms:
     * - __HS256__: HMAC using SHA-256 hash algorithm
     * - __HS384__: HMAC using SHA-384 hash algorithm
     * - __HS512__: HMAC using SHA-512 hash algorithm
     * - __RS256__: RSASSA-PKCS1-v1_5 using SHA-256 hash algorithm
     * - __RS384__: RSASSA-PKCS1-v1_5 using SHA-384 hash algorithm
     * - __RS512__: RSASSA-PKCS1-v1_5 using SHA-512 hash algorithm
     * - __PS256__: RSASSA-PSS using SHA-256 hash algorithm (only node ^6.12.0 OR >=8.0.0)
     * - __PS384__: RSASSA-PSS using SHA-384 hash algorithm (only node ^6.12.0 OR >=8.0.0)
     * - __PS512__: RSASSA-PSS using SHA-512 hash algorithm (only node ^6.12.0 OR >=8.0.0)
     * - __ES256__: ECDSA using P-256 curve and SHA-256 hash algorithm
     * - __ES384__: ECDSA using P-384 curve and SHA-384 hash algorithm
     * - __ES512__: ECDSA using P-521 curve and SHA-512 hash algorithm
     * - __none__: No digital signature or MAC value included
     */
    algorithm?: Algorithm;
    /**
     * Expressed in seconds or a string describing a time span [vercel/ms][1].
     *
     * Eg: `60`, `2 days`, `10h`, `7d`. A numeric value is interpreted as a seconds count.
     * If you use a string be sure you provide the time units (days, hours, etc), otherwise
     * milliseconds unit is used by default ("120" is equal to "120ms").
     *
     * [1]: https://github.com/vercel/ms
     */
    expiresIn?: number | string;
    /**
     * Expressed in seconds or a string describing a time span [vercel/ms][1].
     *
     * Eg: `60`, `2 days`, `10h`, `7d`. A numeric value is interpreted as a seconds count.
     * If you use a string be sure you provide the time units (days, hours, etc), otherwise
     * milliseconds unit is used by default ("120" is equal to "120ms").
     *
     * [1]: https://github.com/vercel/ms
     */
    notBefore?: number | string;
    audience?: string | string[];
    issuer?: string;
    jwtid?: string;
    subject?: string;
    noTimestamp?: boolean;
    header?: JwtHeader;
    keyid?: string;
    /**
     * If true, the sign function will modify the payload object directly. This is useful if you
     * need a raw reference to the payload after claims have been applied to it but before it has
     * been encoded into a token.
     */
    mutatePayload?: boolean;
  }

  export interface VerifyOptions {
    /**
     * List of strings with the names of the allowed algorithms. For instance, ["HS256", "HS384"].
     *
     * Supported algorithms:
     * - __HS256__: HMAC using SHA-256 hash algorithm
     * - __HS384__: HMAC using SHA-384 hash algorithm
     * - __HS512__: HMAC using SHA-512 hash algorithm
     * - __RS256__: RSASSA-PKCS1-v1_5 using SHA-256 hash algorithm
     * - __RS384__: RSASSA-PKCS1-v1_5 using SHA-384 hash algorithm
     * - __RS512__: RSASSA-PKCS1-v1_5 using SHA-512 hash algorithm
     * - __PS256__: RSASSA-PSS using SHA-256 hash algorithm (only node ^6.12.0 OR >=8.0.0)
     * - __PS384__: RSASSA-PSS using SHA-384 hash algorithm (only node ^6.12.0 OR >=8.0.0)
     * - __PS512__: RSASSA-PSS using SHA-512 hash algorithm (only node ^6.12.0 OR >=8.0.0)
     * - __ES256__: ECDSA using P-256 curve and SHA-256 hash algorithm
     * - __ES384__: ECDSA using P-384 curve and SHA-384 hash algorithm
     * - __ES512__: ECDSA using P-521 curve and SHA-512 hash algorithm
     * - __none__: No digital signature or MAC value included
     */
    algorithms?: Algorithm[];
    /**
     * If you want to check audience (`aud`), provide a value here. The audience can be checked
     * against a string, a regular expression or a list of strings and/or regular expressions.
     */
    audience?: string | RegExp | (string | RegExp)[];
    /**
     * Return an object with the decoded `{ payload, header, signature }` instead of only the usual content of the payload.
     */
    complete?: boolean;
    /**
     * String or array of strings of valid values for the iss field
     */
    issuer?: string | string[];
    /**
     * If you want to check JWT ID (`jti`), provide a string value here.
     */
    jwtid?: string;
    /**
     * If true do not validate the expiration of the token.
     */
    ignoreExpiration?: boolean;
    ignoreNotBefore?: boolean;
    /**
     * If you want to check subject (`sub`), provide a value here
     */
    subject?: string;
    /**
     * Number of seconds to tolerate when checking the nbf and exp claims,
     * to deal with small clock differences among different servers
     */
    clockTolerance?: number;
    /**
     * The maximum allowed age for tokens to still be valid. It is expressed in seconds or a string
     * describing a time span vercel/ms. Eg: 1000, "2 days", "10h", "7d". A numeric value is
     * interpreted as a seconds count. If you use a string be sure you provide the time units
     * (days, hours, etc), otherwise milliseconds unit is used by default
     * ("120" is equal to "120ms").
     */
    maxAge?: number | string;
    /**
     * The time in seconds that should be used as the current time for all necessary comparisons.
     */
    clockTimestamp?: number;
    /**
     * If you want to check nonce claim, provide a string value here. It is used on Open ID
     * for the ID Tokens (see [Open ID implementation notes][1]).
     *
     * [1]: https://openid.net/specs/openid-connect-core-1_0.html#NonceNotes
     */
    nonce?: string;
  }

  /**
   * Supported algorithm, see [docs][1].
   
   * [1]: https://github.com/auth0/node-jsonwebtoken#algorithms-supported
   */
  export type Algorithm =
    | 'HS256'
    | 'HS384'
    | 'HS512'
    | 'RS256'
    | 'RS384'
    | 'RS512'
    | 'ES256'
    | 'ES384'
    | 'ES512'
    | 'PS256'
    | 'PS384'
    | 'PS512'
    | 'none';

  /**
   * Thrown error if the token is expired.
   */
  declare class TokenExpiredError extends Error {
    name: 'TokenExpiredError';
    message: 'jwt expired';
    expiredAt: number;
  }
  declare class JsonWebTokenError extends Error {
    name: 'JsonWebTokenError';
    message:
      | 'invalid token' // the header or payload could not be parsed
      | 'jwt malformed' // the token does not have three components (delimited by a `.`)
      | 'jwt signature is required'
      | 'invalid signature'
      | 'jwt audience invalid. expected: [OPTIONS AUDIENCE]'
      | 'jwt issuer invalid. expected: [OPTIONS ISSUER]'
      | 'jwt id invalid. expected: [OPTIONS JWT ID]'
      | 'jwt subject invalid. expected: [OPTIONS SUBJECT]';
  }
  /**
   * Thrown if current time is before the nbf claim.
   */
  declare class NotBeforeError extends Error {
    name: 'NotBeforeError';
    message: 'jwt not active';
    date: Date;
  }
  export type VerifyErrors = TokenExpiredError | JsonWebTokenError | NotBeforeError;
  /**
   * [Registered Header Parameter Names][1].
   *
   * The following Header Parameter names for use in JWSs are registered in the IANA
   * "JSON Web Signature and Encryption Header Parameters" registry established by [Section 9.1][2],
   * with meanings as defined in the subsections below.
   *
   * As indicated by the common registry, JWSs and JWEs share a common Header Parameter space;
   * when a parameter is used by both specifications, its usage must be compatible between the
   * specifications.
   *
   * [1]: https://www.rfc-editor.org/rfc/rfc7515.html#section-4.1
   * [2]: https://www.rfc-editor.org/rfc/rfc7515.html#section-9.1
   */
  export interface JwtHeader {
    /**
     * (Algorithm) Header Parameter.
     *
     * The "alg" (algorithm) Header Parameter identifies the cryptographic algorithm used to
     * secure the JWS. The JWS Signature value is not valid if the "alg" value does not represent
     * a supported algorithm or if there is not a key for use with that algorithm associated with
     * the party that digitally signed or MACed the content. "alg" values should either be
     * registered in the IANA "JSON Web Signature and Encryption Algorithms" registry established
     * by [[JWA][1]] or be a value that contains a Collision-Resistant Name. The "alg" value is
     * a case-sensitive ASCII string containing a StringOrURI value.  This Header Parameter
     * MUST be present and MUST be understood and processed by implementations.
     *
     * A list of defined "alg" values for this use can be found in the IANA "JSON Web Signature and
     * Encryption Algorithms" registry established by [[JWA][1]]; the initial contents of this registry
     * are the values defined in Section 3.1 of [[JWA][1]].
     *
     * [1]: https://www.rfc-editor.org/rfc/rfc7515.html#ref-JWA
     */
    alg: Algorithm;
    /**
     * (JWK Set URL) Header Parameter.
     *
     * The "jku" (JWK Set URL) Header Parameter is a URI [[RFC3986][1]] that refers to a resource for
     * a set of JSON-encoded public keys, one of which corresponds to the key used to digitally
     * sign the JWS. The keys MUST be encoded as a JWK Set [[JWK][2]]. The protocol used to acquire
     * the resource MUST provide integrity protection; an HTTP GET request to retrieve the
     * JWK Set MUST use Transport Layer Security (TLS) [[RFC2818][3]] [[RFC5246][4]]; and the identity of
     * the server MUST be validated, as per [Section 6 of RFC 6125][5] [[RFC6125][6]]. Also, see
     * [Section 8][7] on TLS requirements. Use of this Header Parameter is OPTIONAL.
     *
     * [1]: https://www.rfc-editor.org/rfc/rfc3986
     * [2]: https://www.rfc-editor.org/rfc/rfc7515.html#ref-JWK
     * [3]: https://www.rfc-editor.org/rfc/rfc2818
     * [4]: https://www.rfc-editor.org/rfc/rfc5246
     * [5]: https://www.rfc-editor.org/rfc/rfc6125#section-6
     * [6]: https://www.rfc-editor.org/rfc/rfc6125
     * [7]: https://www.rfc-editor.org/rfc/rfc7515.html#section-8
     */
    jku?: string;
    /**
     * (JSON Web Key) Header Parameter.
     *
     * The "jwk" (JSON Web Key) Header Parameter is the public key that corresponds to the key
     * used to digitally sign the JWS.  This key is represented as a JSON Web Key [[JWK][1]].
     * Use of this Header Parameter is OPTIONAL.
     *
     * [1]: https://www.rfc-editor.org/rfc/rfc7515.html#ref-JWK
     */
    jwk?: string;
    /**
     * (Key ID) Header Parameter.
     *
     * The "kid" (key ID) Header Parameter is a hint indicating which key was used to secure the
     * JWS. This parameter allows originators to explicitly signal a change of key to recipients.
     * The structure of the "kid" value is unspecified. Its value MUST be a case-sensitive string.
     * Use of this Header Parameter is OPTIONAL.
     *
     * When used with a JWK, the "kid" value is used to match a JWK "kid" parameter value.
     */
    kid?: string;
    /**
     * (X.509 URL) Header Parameter.
     *
     * The "x5u" (X.509 URL) Header Parameter is a URI [[RFC3986][1]] that refers to a resource for
     * the X.509 public key certificate or certificate chain [[RFC5280][2]] corresponding to the key
     * used to digitally sign the JWS.  The identified resource MUST provide a representation of
     * the certificate or certificate chain that conforms to [[RFC5280][2]] in PEM-encoded
     * form, with each certificate delimited as specified in [Section 6.1 of RFC 4945][3].
     * The certificate containing the public key corresponding to the key used to digitally sign
     * the JWS MUST be the first certificate. This MAY be followed by additional certificates,
     * with each subsequent certificate being the one used to certify the previous one.
     * The protocol used to acquire the resource MUST provide integrity protection;
     * an HTTP GET request to retrieve the certificate MUST use TLS [[RFC2818][4]] [[RFC5246][5]];
     * and the identity of the server MUST be validated, as per Section 6 of RFC 6125 [RFC6125].
     * Also, see [Section 8][6] on TLS requirements. Use of this Header Parameter is OPTIONAL.
     *
     * [1]: https://www.rfc-editor.org/rfc/rfc3986
     * [2]: https://www.rfc-editor.org/rfc/rfc5280
     * [3]: https://www.rfc-editor.org/rfc/rfc4945#section-6.1
     * [4]: https://www.rfc-editor.org/rfc/rfc2818
     * [5]: https://www.rfc-editor.org/rfc/rfc5246
     * [6]: https://www.rfc-editor.org/rfc/rfc7515.html#section-8
     */
    x5u?: string;
    /**
     * (X.509 Certificate Chain) Header Parameter.
     *
     * The "x5c" (X.509 certificate chain) Header Parameter contains the X.509 public key
     * certificate or certificate chain [[RFC5280][1]] corresponding to the key used to digitally sign
     * the JWS. The certificate or certificate chain is represented as a JSON array of certificate
     * value strings. Each string in the array is a base64-encoded
     * ([Section 4 of [RFC4648]][2] -- not base64url-encoded) DER [[ITU.X690.2008][3]] PKIX certificate
     * value. The certificate containing the public key corresponding to the key used to digitally
     * sign the JWS MUST be the first certificate.  This MAY be followed by additional certificates,
     * with each subsequent certificate being the one used to certify the previous one. The
     * recipient MUST validate the certificate chain according to [[RFC5280][1]] and consider
     * the certificate or certificate chain to be invalid if any validation failure occurs.
     * Use of this Header Parameter is OPTIONAL.
     *
     * See [Appendix B][4] for an example "x5c" value.
     *
     * [1]: https://www.rfc-editor.org/rfc/rfc5280
     * [2]: https://www.rfc-editor.org/rfc/rfc4648#section-4
     * [3]: https://www.rfc-editor.org/rfc/rfc7515.html#ref-ITU.X690.2008
     * [4]: https://www.rfc-editor.org/rfc/rfc7515.html#appendix-B
     */
    x5c?: string | string[];
    /**
     * (X.509 Certificate SHA-1 Thumbprint) Header Parameter.
     *
     * The "x5t" (X.509 certificate SHA-1 thumbprint) Header Parameter is a base64url-encoded SHA-1
     * thumbprint (a.k.a. digest) of the DER encoding of the X.509 certificate [[RFC5280][1]]
     * corresponding to the key used to digitally sign the JWS.  Note that certificate thumbprints
     * are also sometimes known as certificate fingerprints.  Use of this Header Parameter
     * is OPTIONAL.
     *
     * [1]: https://www.rfc-editor.org/rfc/rfc5280
     */
    x5t?: string;
    /**
     * (X.509 Certificate SHA-256 Thumbprint) Header.
     *
     * The "x5t#S256" (X.509 certificate SHA-256 thumbprint) Header Parameter is
     * a base64url-encoded SHA-256 thumbprint (a.k.a. digest) of the DER encoding
     * of the X.509 certificate [[RFC5280][1]] corresponding to the key used to digitally
     * sign the JWS.  Note that certificate thumbprints are also sometimes known
     * as certificate fingerprints. Use of this Header Parameter is OPTIONAL.
     *
     * [1]: https://www.rfc-editor.org/rfc/rfc5280
     */
    'x5t#S256'?: string;
    /**
     * (Type) Header Parameter.
     *
     * The "typ" (type) Header Parameter is used by JWS applications to declare the media type
     * [[IANA.MediaTypes][1]] of this complete JWS.  This is intended for use by the application when
     * more than one kind of object could be present in an application data structure that can
     * contain a JWS; the application can use this value to disambiguate among the different kinds
     * of objects that might be present.  It will typically not be used by applications when the
     * kind of object is already known.  This parameter is ignored by JWS implementations; any
     * processing of this parameter is performed by the JWS application. Use of this Header
     * Parameter is OPTIONAL.
     *
     * Per RFC 2045 [[RFC2045][2]], all media type values, subtype values, and parameter names are case
     * insensitive. However, parameter values are case sensitive unless otherwise specified for
     * the specific parameter. To keep messages compact in common situations, it is RECOMMENDED
     * that producers omit an "application/" prefix of a media type value in a "typ" Header
     * Parameter when no other '/' appears in the media type value.  A recipient using the media
     * type value MUST treat it as if "application/" were prepended to any "typ" value
     * not containing a '/'.  For instance, a "typ" value of "example" SHOULD be used to represent
     * the "application/example" media type, whereas the media type "application/example;part="1/2""
     * cannot be shortened to "example;part="1/2"".
     *
     * The "typ" value "JOSE" can be used by applications to indicate that this object is a JWS or
     * JWE using the JWS Compact Serialization or the JWE Compact Serialization.  The "typ" value
     * "JOSE+JSON" can be used by applications to indicate that this object is a JWS or JWE using
     * the JWS JSON Serialization or the JWE JSON Serialization. Other type values can also be
     * used by applications.
     *
     * [1]: https://www.rfc-editor.org/rfc/rfc7515.html#ref-IANA.MediaTypes
     * [2]: https://www.rfc-editor.org/rfc/rfc2045
     */
    typ?: string;
    /**
     * (Content Type) Header Parameter.
     *
     * The "cty" (content type) Header Parameter is used by JWS applications to declare the media
     * type [[IANA.MediaTypes][1]] of the secured content (the payload). This is intended for use by the
     * application when more than one kind of object could be present in the JWS Payload; the
     * application can use this value to disambiguate among the different kinds of objects that
     * might be present. It will typically not be used by applications when the kind of object is
     * already known.  This parameter is ignored by JWS implementations; any processing of this
     * parameter is performed by the JWS application.  Use of this Header Parameter is OPTIONAL.
     *
     * Per [[RFC2045][2]], all media type values, subtype values, and parameter names are
     * case insensitive.  However, parameter values are case sensitive unless otherwise specified
     * for the specific parameter.
     *
     * To keep messages compact in common situations, it is RECOMMENDED that producers omit
     * an "application/" prefix of a media type value in a "cty" Header Parameter when
     * no other '/' appears in the media type value.  A recipient using the media type
     * value MUST treat it as if "application/" were prepended to any "cty" value
     * not containing a '/'.  For instance, a "cty" value of "example" SHOULD be used
     * to represent the "application/example" media type, whereas the media type
     * "application/example;part="1/2"" cannot be shortened to "example;part="1/2"".
     *
     * [1]: https://www.rfc-editor.org/rfc/rfc7515.html#ref-IANA.MediaTypes
     * [2]: https://www.rfc-editor.org/rfc/rfc2045
     */
    cty?: string;
    /**
       * (Critical) Header Parameter.
       * 
       * The "crit" (critical) Header Parameter indicates that extensions to this specification
       * and/or [JWA] are being used that MUST be understood and processed. Its value is an array
       * listing the Header Parameter names present in the JOSE Header that use those extensions.
       * If any of the listed extension Header Parameters are not understood and supported by the
       * recipient, then the JWS is invalid. Producers MUST NOT include Header Parameter names
       * defined by this specification or [JWA] for use with JWS, duplicate names, or names that
       * do not occur as Header Parameter names within the JOSE Header in the "crit" list. Producers
       * MUST NOT use the empty list "[]" as the "crit" value.  Recipients MAY consider the JWS
       * to be invalid if the critical list contains any Header Parameter names defined by this
       * specification or [JWA] for use with JWS or if any other constraints on its use are violated.
       * When used, this Header Parameter MUST be integrity protected; therefore, it MUST occur only
       * within the JWS Protected Header.  Use of this Header Parameter is OPTIONAL. This Header
       * Parameter MUST be understood and processed by implementations.
       * 
       * An example use, along with a hypothetical "exp" (expiration time) field is:
  ```json
  {
    "alg":"ES256",
    "crit":["exp"],
    "exp":1363284000
  }
  ```
       */
    crit?: Array<Exclude<keyof JwtHeader, 'crit'>>;
  }

  /**
   * Registered Claim Names.
   *
   * The following Claim Names are registered in the IANA "JSON Web Token Claims" registry
   * established by [Section 10.1][1]. None of the claims defined below are intended to be mandatory
   * to use or implement in all cases, but rather they provide a starting point for a set of
   * useful, interoperable claims. Applications using JWTs should define which specific claims
   * they use and when they are required or optional. All the names are short because a core goal
   * of JWTs is for the representation to be compact.
   *
   * [1]: https://datatracker.ietf.org/doc/html/rfc7519#section-10.1
   */
  export interface VerifyPayload {
    [key: string]: any;
    /**
     * (Issuer) Claim.
     *
     * The "iss" (issuer) claim identifies the principal that issued the JWT. The processing
     * of this claim is generally application specific. The "iss" value is a case-sensitive
     * string containing a StringOrURI value.  Use of this claim is OPTIONAL.
     */
    iss?: string;
    /**
     * (Subject) Claim.
     *
     * The "sub" (subject) claim identifies the principal that is the subject of the JWT. The
     * claims in a JWT are normally statements about the subject.  The subject value MUST
     * either be scoped to be locally unique in the context of the issuer or be globally unique.
     * The processing of this claim is generally application specific. The "sub" value is
     * a case-sensitive string containing a StringOrURI value.  Use of this claim is OPTIONAL.
     */
    sub?: string;
    /**
     * (Audience) Claim.
     *
     * The "aud" (audience) claim identifies the recipients that the JWT is intended for. Each
     * principal intended to process the JWT MUST identify itself with a value in the audience
     * claim. If the principal processing the claim does not identify itself with a value in the
     * "aud" claim when this claim is present, then the JWT MUST be rejected. In the general case,
     * the "aud" value is an array of case- sensitive strings, each containing a StringOrURI value.
     * In the special case when the JWT has one audience, the "aud" value MAY be a single
     * case-sensitive string containing a StringOrURI value.  The interpretation of audience values
     * is generally application specific. Use of this claim is OPTIONAL.
     */
    aud?: string[] | string;
    /**
     * (Expiration Time) Claim.
     *
     * The "exp" (expiration time) claim identifies the expiration time on or after which the JWT
     * MUST NOT be accepted for processing.  The processing of the "exp" claim requires that the
     * current date/time MUST be before the expiration date/time listed in the "exp" claim.
     * Implementers MAY provide for some small leeway, usually no more than a few minutes, to
     * account for clock skew.  Its value MUST be a number containing a NumericDate value.
     * Use of this claim is OPTIONAL.
     */
    exp?: string;
    /**
     * (Not Before) Claim.
     *
     * The "nbf" (not before) claim identifies the time before which the JWT MUST NOT be accepted
     * for processing. The processing of the "nbf" claim requires that the current date/time MUST
     * be after or equal to the not-before date/time listed in the "nbf" claim. Implementers MAY
     * provide for some small leeway, usually no more than a few minutes, to account for clock
     * skew. Its value MUST be a number containing a NumericDate value. Use of this claim is
     * OPTIONAL.
     */
    nbf?: string;
    /**
     * (Issued At) Claim.
     *
     * The "iat" (issued at) claim identifies the time at which the JWT was issued. This claim can
     * be used to determine the age of the JWT. Its value MUST be a number containing
     * a NumericDate value. Use of this claim is OPTIONAL.
     */
    iat?: string;
    /**
     * (JWT ID) Claim.
     *
     * The "jti" (JWT ID) claim provides a unique identifier for the JWT. The identifier value MUST
     * be assigned in a manner that ensures that there is a negligible probability that the same
     * value will be accidentally assigned to a different data object; if the application uses
     * multiple issuers, collisions MUST be prevented among values produced by different issuers as
     * well. The "jti" claim can be used to prevent the JWT from being replayed. The "jti" value
     * is a case- sensitive string. Use of this claim is OPTIONAL.
     */
    jti?: string;
  }

  export default {
    decode,
    verify,
    sign,
    JsonWebTokenError,
    NotBeforeError,
    TokenExpiredError,
  };
}
