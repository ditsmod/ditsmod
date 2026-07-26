import { jest } from '@jest/globals';

import { AuthjsLogMediator } from './authjs-log-mediator.js';

describe('AuthjsLogMediator', () => {
  it('message calls setLog with level and msg', () => {
    const mediator = new AuthjsLogMediator({} as any);
    const spy = jest.spyOn(mediator as any, 'setLog').mockImplementation(() => {});

    mediator.message('info', 'test message');

    expect(spy).toHaveBeenCalledWith('info', 'test message');
  });
});
