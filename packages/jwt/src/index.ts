/// <reference path="../src/types/jsonwebtoken.d.ts" />
export {
  SignPayload,
  VerifyPayload,
  VerifyErrors,
  TokenExpiredError,
  JsonWebTokenError,
  NotBeforeError,
  SecretOrPublicKey,
  SecretOrPrivateKey,
} from 'jsonwebtoken';
export { JwtModule } from './jwt.module';
export { JwtService } from './jwt.service';
export {
  SignWithSecretOptions,
  SignWithPrivateKeyOptions,
  VerifyWithSecretOptions,
  VerifyWithPublicKeyOptions,
} from './types/mix';
export { JwtServiceOptions } from './models/jwt-service-options';
