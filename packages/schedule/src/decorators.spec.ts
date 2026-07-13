import 'reflect-metadata/lite';
import { Reflector } from '@ditsmod/core/di';

import { cron } from './cron.decorator.js';
import { interval } from './interval.decorator.js';
import { timeout } from './timeout.decorator.js';

describe('Decorators', () => {
  class TestService {
    @cron('*/5 * * * * *', { name: 'my-cron', disabled: true })
    runCron() {}

    @interval(1000)
    runInterval1() {}

    @interval('my-interval', 2000)
    runInterval2() {}

    @timeout(3000)
    runTimeout1() {}

    @timeout('my-timeout', 4000)
    runTimeout2() {}
  }

  it('should record cron metadata correctly', () => {
    const classMeta = Reflector.collectMeta(TestService);
    expect(classMeta).toBeDefined();

    const cronMeta = classMeta!.runCron;
    expect(cronMeta).toBeDefined();
    expect(cronMeta.decorators).toHaveLength(1);

    const decor = cronMeta.decorators[0];
    expect(decor.decorator).toBe(cron);
    expect(decor.value).toEqual({
      cronTime: '*/5 * * * * *',
      name: 'my-cron',
      disabled: true,
    });
  });

  it('should record interval metadata correctly', () => {
    const classMeta = Reflector.collectMeta(TestService);
    expect(classMeta).toBeDefined();

    // With timeout only
    const interval1Meta = classMeta!.runInterval1;
    expect(interval1Meta).toBeDefined();
    expect(interval1Meta.decorators).toHaveLength(1);
    expect(interval1Meta.decorators[0].decorator).toBe(interval);
    expect(interval1Meta.decorators[0].value).toEqual({
      name: undefined,
      timeout: 1000,
    });

    // With name and timeout
    const interval2Meta = classMeta!.runInterval2;
    expect(interval2Meta).toBeDefined();
    expect(interval2Meta.decorators).toHaveLength(1);
    expect(interval2Meta.decorators[0].decorator).toBe(interval);
    expect(interval2Meta.decorators[0].value).toEqual({
      name: 'my-interval',
      timeout: 2000,
    });
  });

  it('should record timeout metadata correctly', () => {
    const classMeta = Reflector.collectMeta(TestService);
    expect(classMeta).toBeDefined();

    // With timeout only
    const timeout1Meta = classMeta!.runTimeout1;
    expect(timeout1Meta).toBeDefined();
    expect(timeout1Meta.decorators).toHaveLength(1);
    expect(timeout1Meta.decorators[0].decorator).toBe(timeout);
    expect(timeout1Meta.decorators[0].value).toEqual({
      name: undefined,
      timeout: 3000,
    });

    // With name and timeout
    const timeout2Meta = classMeta!.runTimeout2;
    expect(timeout2Meta).toBeDefined();
    expect(timeout2Meta.decorators).toHaveLength(1);
    expect(timeout2Meta.decorators[0].decorator).toBe(timeout);
    expect(timeout2Meta.decorators[0].value).toEqual({
      name: 'my-timeout',
      timeout: 4000,
    });
  });
});
