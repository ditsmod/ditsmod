import 'reflect-metadata';
import { reflector } from '@ts-stack/di';

import { Route } from './route';
import { Controller } from './controller';
import { CanActivate } from '../types/mix';

describe('Route decorator', () => {
  it('controller without methods', () => {
    @Controller()
    class Controller1 {}

    expect(reflector.propMetadata(Controller1)).toEqual({});
  });

  it('one method, one decorator', () => {
    @Controller()
    class Controller1 {
      @Route('GET')
      method() {}
    }

    const metadata = reflector.propMetadata(Controller1);
    expect(metadata).toEqual({ method: [{ httpMethod: 'GET', path: '', guards: [] }] });
  });

  it('one method, two decorators', () => {
    @Controller()
    class Controller1 {
      @Route('GET')
      @Route('POST')
      method() {}
    }

    const metadata = reflector.propMetadata(Controller1);
    expect(metadata).toEqual({
      method: [
        { httpMethod: 'GET', path: '', guards: [] },
        { httpMethod: 'POST', path: '', guards: [] },
      ],
    });
  });

  it('one guard without params', () => {
    class Guard implements CanActivate {
      canActivate() {
        return true;
      }
    }
    @Controller()
    class Controller1 {
      @Route('GET', 'posts/:postId', [Guard])
      method() {}
    }

    const metadata = reflector.propMetadata(Controller1);
    expect(metadata).toEqual({ method: [{ httpMethod: 'GET', path: 'posts/:postId', guards: [Guard] }] });
  });

  it('two guards without params', () => {
    class Guard implements CanActivate {
      canActivate() {
        return true;
      }
    }
    @Controller()
    class Controller1 {
      @Route('GET', 'posts/:postId', [Guard, Guard])
      method() {}
    }

    const metadata = reflector.propMetadata(Controller1);
    expect(metadata).toEqual({ method: [{ httpMethod: 'GET', path: 'posts/:postId', guards: [Guard, Guard] }] });
  });

  it('two guard with params', () => {
    class Guard implements CanActivate {
      canActivate() {
        return true;
      }
    }
    @Controller()
    class Controller1 {
      @Route('GET', 'posts/:postId', [
        [Guard, 'one', 123],
        [Guard, []],
      ])
      method() {}
    }

    const metadata = reflector.propMetadata(Controller1);
    expect(metadata).toEqual({
      method: [
        {
          httpMethod: 'GET',
          path: 'posts/:postId',
          guards: [
            [Guard, 'one', 123],
            [Guard, []],
          ],
        },
      ],
    });
  });
});
