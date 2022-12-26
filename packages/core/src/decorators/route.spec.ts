import 'reflect-metadata';
import { reflector } from '@ts-stack/di';

import { route } from './route';
import { controller } from './controller';
import { CanActivate } from '../types/mix';

describe('Route decorator', () => {
  it('controller without methods', () => {
    @controller()
    class Controller1 {}

    expect(reflector.getPropMetadata(Controller1)).toEqual({});
  });

  it('one method, one decorator', () => {
    @controller()
    class Controller1 {
      @route('GET')
      method() {}
    }

    const metadata = reflector.getPropMetadata(Controller1);
    expect(metadata).toEqual({ method: [Function, { httpMethod: 'GET', path: '', guards: [] }] });
  });

  it('one method, two decorators', () => {
    @controller()
    class Controller1 {
      @route('GET')
      @route('POST')
      method() {}
    }

    const metadata = reflector.getPropMetadata(Controller1);
    expect(metadata).toEqual({
      method: [
        Function,
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
    @controller()
    class Controller1 {
      @route('GET', 'posts/:postId', [Guard])
      method() {}
    }

    const metadata = reflector.getPropMetadata(Controller1);
    expect(metadata).toEqual({ method: [Function, { httpMethod: 'GET', path: 'posts/:postId', guards: [Guard] }] });
  });

  it('two guards without params', () => {
    class Guard implements CanActivate {
      canActivate() {
        return true;
      }
    }
    @controller()
    class Controller1 {
      @route('GET', 'posts/:postId', [Guard, Guard])
      method() {}
    }

    const metadata = reflector.getPropMetadata(Controller1);
    expect(metadata).toEqual({
      method: [Function, { httpMethod: 'GET', path: 'posts/:postId', guards: [Guard, Guard] }],
    });
  });

  it('two guard with params', () => {
    class Guard implements CanActivate {
      canActivate() {
        return true;
      }
    }
    @controller()
    class Controller1 {
      @route('GET', 'posts/:postId', [
        [Guard, 'one', 123],
        [Guard, []],
      ])
      method() {}
    }

    const metadata = reflector.getPropMetadata(Controller1);
    expect(metadata).toEqual({
      method: [
        Function,
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
