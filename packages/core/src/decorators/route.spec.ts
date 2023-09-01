import { PropMeta, reflector } from '#di';
import { CanActivate } from '#types/mix.js';
import { controller } from './controller.js';
import { route } from './route.js';

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
    expect(metadata).toEqual<PropMeta<Controller1>>({
      method: [
        Function,
        {
          decorator: route,
          value: {
            httpMethod: 'GET',
            path: '',
            guards: [],
          },
        },
      ],
    });
  });

  it('one method, two decorators', () => {
    @controller()
    class Controller1 {
      @route('GET')
      @route('POST')
      method() {}
    }

    const metadata = reflector.getPropMetadata(Controller1);
    expect(metadata).toEqual<PropMeta<Controller1>>({
      method: [
        Function,
        {
          decorator: route,
          value: {
            httpMethod: 'GET',
            path: '',
            guards: [],
          },
        },
        {
          decorator: route,
          value: {
            httpMethod: 'POST',
            path: '',
            guards: [],
          },
        },
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
    expect(metadata).toEqual<PropMeta<Controller1>>({
      method: [
        Function,
        {
          decorator: route,
          value: {
            httpMethod: 'GET',
            path: 'posts/:postId',
            guards: [Guard],
          },
        },
      ],
    });
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
    expect(metadata).toEqual<PropMeta<Controller1>>({
      method: [
        Function,
        {
          decorator: route,
          value: {
            httpMethod: 'GET',
            path: 'posts/:postId',
            guards: [Guard, Guard],
          },
        },
      ],
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
    expect(metadata).toEqual<PropMeta<Controller1>>({
      method: [
        Function,
        {
          decorator: route,
          value: {
            httpMethod: 'GET',
            path: 'posts/:postId',
            guards: [
              [Guard, 'one', 123],
              [Guard, []],
            ],
          },
        },
      ],
    });
  });
});
