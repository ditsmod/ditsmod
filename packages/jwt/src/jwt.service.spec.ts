import jwt from 'jsonwebtoken';
import { SignOptions, SignPayload } from 'jsonwebtoken';

import { JwtService } from './jwt.service.js';
import { JwtServiceOptions } from './models/jwt-service-options.js';

describe('JwtService', () => {
  describe('when signing a token', function () {
    const secret = 'shhhhhh';
    let jwtService: JwtService;

    beforeEach(() => {
      jwtService = new JwtService(new JwtServiceOptions());
    });

    it('should work with empty options', async () => {
      const payload: SignPayload = { abc: 1 };
      await expect(jwtService.signWithSecret(payload, { secret })).resolves.not.toThrow();
    });

    it('should return the same result as singing synchronously', async () => {
      const payload = { foo: 'bar' };
      const options: SignOptions = { algorithm: 'HS256' };
      const syncToken = jwt.sign(payload, secret, options);
      await expect(jwtService.signWithSecret(payload, { secret, ...options })).resolves.toBe(syncToken);
      await expect(jwtService.verifyWithSecret(syncToken, { secret, ...options })).resolves.toMatchObject(payload);
    });

    it('should work with none algorithm where secret is set', async () => {
      const payload = { foo: 'bar' };
      const options: SignOptions = { algorithm: 'none' };
      const syncToken = jwt.sign(payload, secret, options);
      expect(jwtService.decode(syncToken)).toMatchObject(payload);
      await expect(jwtService.signWithSecret(payload, { secret, ...options })).resolves.toBe(syncToken);
    });

    it('should return error when secret is not a cert for RS256', async () => {
      const payload: SignPayload = { foo: 'bar' };
      const options: SignOptions = { algorithm: 'RS256' };
      //this throw an error because the secret is not a cert and RS256 requires a cert.
      // const msg = 'error:0909006C:PEM routines:get_name:no start line';
      const msg = 'secretOrPrivateKey must be an asymmetric key when using RS256';
      await expect(jwtService.signWithSecret(payload, { secret, ...options })).rejects.toThrow(msg);
    });

    it('should return error when secret is not a cert for PS256', async () => {
      const payload: SignPayload = { foo: 'bar' };
      const options: SignOptions = { algorithm: 'PS256' };
      // this throw an error because the secret is not a cert and PS256 requires a cert.
      // const msg = 'error:0909006C:PEM routines:get_name:no start line';
      const msg = 'secretOrPrivateKey must be an asymmetric key when using PS256';
      await expect(jwtService.signWithSecret(payload, { secret, ...options })).rejects.toThrow(msg);
    });

    it('should return error on wrong arguments', async () => {
      const payload: SignPayload = { foo: 'bar' };
      const options: SignOptions = { notBefore: {} as any };
      //this throw an error because the secret is not a cert and RS256 requires a cert.
      const msg = '"notBefore" should be a number of seconds or string representing a timespan';
      await expect(jwtService.signWithSecret(payload, { secret, ...options })).rejects.toThrow(msg);
    });

    it('should return error on wrong arguments (2)', async () => {
      const payload: SignPayload = 'string';
      const options: SignOptions = { noTimestamp: true };
      const msg = 'invalid noTimestamp option for string payload';
      await expect(jwtService.signWithSecret(payload, { secret, ...options })).rejects.toThrow(msg);
    });

    it('should not stringify the payload', async () => {
      const payload: SignPayload = 'string';
      await expect(jwtService.signWithSecret(payload, { secret })).resolves.not.toThrow();
      const token = await jwtService.signWithSecret(payload, { secret });
      expect(jwt.decode(token)).toBe('string');
    });

    describe('when mutatePayload is not set', function () {
      it('should not apply claims to the original payload object (mutatePayload defaults to false)', async () => {
        const payload: SignPayload = { foo: 'bar' };
        const options: SignOptions = { notBefore: 60, expiresIn: 600 };
        await expect(jwtService.signWithSecret(payload, { secret, ...options })).resolves.not.toThrow();
        expect(payload).not.toHaveProperty('nbf');
        expect(payload).not.toHaveProperty('exp');
      });
    });

    describe('when mutatePayload is set to true', function () {
      it('should apply claims directly to the original payload object', async () => {
        const payload: SignPayload = { foo: 'bar' };
        const options: SignOptions = { notBefore: 60, expiresIn: 600, mutatePayload: true };
        await expect(jwtService.signWithSecret(payload, { secret, ...options })).resolves.not.toThrow();
        expect(payload).toHaveProperty('nbf');
        expect(payload).toHaveProperty('exp');
      });
    });

    describe('secret must have a value', function () {
      [undefined, '', 0].forEach(function (secret) {
        it(
          'should return an error if the secret is falsy and algorithm is not set to none: ' +
            (typeof secret === 'string' ? '(empty string)' : secret),
          async () => {
            const payload: SignPayload = 'string';
            const options: SignOptions = { algorithm: 'PS256' };
            // This is needed since jws will not answer for falsy secrets
            await expect(jwtService.signWithSecret(payload, { secret: secret as any, ...options })).rejects.toThrow(
              'secretOrPrivateKey must have a value',
            );
          },
        );
      });
    });
  });
});
