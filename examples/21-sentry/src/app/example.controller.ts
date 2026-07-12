import { CustomError } from '@ditsmod/core/errors';
import { controller, route, RequestContext } from '@ditsmod/rest';
import { sentryCron, sentryTraced, sentryExceptionCaptured } from '@ditsmod/sentry';

@controller()
export class ExampleController {
  @route('GET', 'hello')
  @sentryTraced('hello-operation')
  async sayHello(ctx: RequestContext) {
    ctx.send('Hello from Sentry-traced endpoint!');
  }

  @route('GET', 'error')
  async throwUnexpectedError() {
    throw new Error('This is an unexpected database or server error');
  }

  @route('GET', 'expected-error')
  async throwExpectedError() {
    throw new CustomError({
      msg1: 'Invalid client parameters',
      status: 400,
      level: 'warn',
    });
  }

  @route('GET', 'cron')
  async runCronJob(ctx: RequestContext) {
    await this.dummyCronTask();
    ctx.send('Cron job check-in sent to Sentry!');
  }

  @route('GET', 'capture-exception')
  async captureCustomException(ctx: RequestContext) {
    try {
      await this.methodThatThrows();
    } catch {
      // Exception is already captured by @sentryExceptionCaptured
    }
    ctx.send('Exception captured manually!');
  }

  @sentryCron('my-sentry-cron', {
    schedule: { type: 'crontab', value: '*/5 * * * *' },
  })
  protected async dummyCronTask() {
    // Cron logic here
  }

  @sentryExceptionCaptured()
  protected async methodThatThrows() {
    throw new Error('An error occurred inside decorated service method');
  }
}
