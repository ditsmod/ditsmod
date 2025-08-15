/// <reference path="../src/types/jsonwebtoken.d.ts" />
import jwt from 'jsonwebtoken';
export const TokenExpiredError = jwt.TokenExpiredError;
export const JsonWebTokenError = jwt.JsonWebTokenError;
export const NotBeforeError = jwt.NotBeforeError;
export {
  SignPayload,
  VerifyPayload,
  VerifyErrors,
  SecretOrPublicKey,
  SecretOrPrivateKey,
} from 'jsonwebtoken';
export { JwtModule } from './jwt.module.js';
export { JwtService } from './jwt.service.js';
export {
  SignWithSecretOptions,
  SignWithPrivateKeyOptions,
  VerifyWithSecretOptions,
  VerifyWithPublicKeyOptions,
} from './types/mix.js';
export { JwtServiceOptions } from './models/jwt-service-options.js';
export { JWT_PAYLOAD } from './tokens.js';
