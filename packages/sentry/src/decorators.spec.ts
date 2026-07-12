import { jest } from '@jest/globals';

jest.unstable_mockModule('@sentry/node', () => {
  return {
    withMonitor: jest.fn((slug: string, callback: any, config?: any) => callback()),
    startSpan: jest.fn((options: any, callback: any) => callback()),
    captureException: jest.fn(),
  };
});

// Import dynamically after mock
const Sentry = await import('@sentry/node');
const { CustomError } = await import('@ditsmod/core/errors');
const { HttpStatus } = await import('@ditsmod/core');
const { sentryCron, sentryTraced, sentryExceptionCaptured, isExpectedError } = await import('./decorators.js');

describe('isExpectedError', () => {
  it('should return false for regular Error', () => {
    expect(isExpectedError(new Error('test'))).toBe(false);
  });

  it('should return true for CustomError with status < 500 and level warn/debug/info', () => {
    const err = new CustomError({
      msg1: 'bad request',
      status: HttpStatus.BAD_REQUEST,
      level: 'warn',
    });
    expect(isExpectedError(err)).toBe(true);
  });

  it('should return false for CustomError with status >= 500', () => {
    const err = new CustomError({
      msg1: 'server error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      level: 'error',
    });
    expect(isExpectedError(err)).toBe(false);
  });
});

describe('Sentry decorators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sentryCron', () => {
    it('should wrap method in Sentry.withMonitor', async () => {
      class TestCronClass {
        @sentryCron('my-cron-job', { schedule: { type: 'crontab', value: '* * * * *' } })
        async runJob() {
          return 'done';
        }
      }

      const instance = new TestCronClass();
      const result = await instance.runJob();

      expect(result).toBe('done');
      expect(Sentry.withMonitor).toHaveBeenCalledWith('my-cron-job', expect.any(Function), {
        schedule: { type: 'crontab', value: '* * * * *' },
      });
    });
  });

  describe('sentryTraced', () => {
    it('should wrap method in Sentry.startSpan', async () => {
      class TestTracedClass {
        @sentryTraced('custom-op')
        async doSomething(val: string) {
          return val;
        }
      }

      const instance = new TestTracedClass();
      const result = await instance.doSomething('hello');

      expect(result).toBe('hello');
      expect(Sentry.startSpan).toHaveBeenCalledWith(
        {
          op: 'custom-op',
          name: 'doSomething',
          attributes: {
            'sentry.origin': 'auto.function.ditsmod.sentry_traced',
            'sentry.op': 'custom-op',
          },
        },
        expect.any(Function),
      );
    });
  });

  describe('sentryExceptionCaptured', () => {
    it('should capture sync error and rethrow it', () => {
      class TestExceptionCapturedClass {
        @sentryExceptionCaptured()
        syncMethod() {
          throw new Error('sync fail');
        }
      }

      const instance = new TestExceptionCapturedClass();

      expect(() => instance.syncMethod()).toThrow('sync fail');
      expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
        mechanism: { handled: false, type: 'auto.function.ditsmod.exception_captured' },
      });
    });

    it('should NOT capture expected custom sync error', () => {
      class TestExceptionCapturedClass {
        @sentryExceptionCaptured()
        syncMethod() {
          throw new CustomError({
            msg1: 'bad request',
            status: HttpStatus.BAD_REQUEST,
            level: 'warn',
          });
        }
      }

      const instance = new TestExceptionCapturedClass();

      expect(() => instance.syncMethod()).toThrow();
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('should capture async error and propagate rejection', async () => {
      class TestExceptionCapturedClass {
        @sentryExceptionCaptured()
        async asyncMethod() {
          throw new Error('async fail');
        }
      }

      const instance = new TestExceptionCapturedClass();

      await expect(instance.asyncMethod()).rejects.toThrow('async fail');
      expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
        mechanism: { handled: false, type: 'auto.function.ditsmod.exception_captured' },
      });
    });

    it('should NOT capture expected custom async error', async () => {
      class TestExceptionCapturedClass {
        @sentryExceptionCaptured()
        async asyncMethod() {
          throw new CustomError({
            msg1: 'bad request',
            status: HttpStatus.BAD_REQUEST,
            level: 'warn',
          });
        }
      }

      const instance = new TestExceptionCapturedClass();

      await expect(instance.asyncMethod()).rejects.toThrow();
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });
});
