import { controller } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

import { Permission, basicAuth, requirePermissions, BearerGuard, requirePermissionsSngl } from '#auth';

/**
 * Injector-scoped controller
 */
@controller()
export class InjController {
  @route('GET', 'controler1-of-module1')
  ok() {
    return 'ok';
  }

  @route('GET', 'basic-auth', [basicAuth('Access to the API endpoint')])
  basicAuth() {
    return 'You are now authorized with BasicGuard';
  }

  @route('GET', 'unauth', [BearerGuard])
  throw401Error() {
    return 'some secret';
  }

  @route('GET', 'forbidden', [requirePermissions(Permission.canActivateAdministration)])
  throw403Error() {
    return 'some secret';
  }
}

/**
 * Context-scoped controller
 */
@controller({ scope: 'ctx' })
export class CtxController {
  @route('GET', 'controler2-of-module1')
  ok() {
    return 'ok';
  }

  @route('GET', 'basic-auth2', [basicAuth('Access to the API endpoint')])
  basicAuth() {
    return 'You are now authorized with BasicGuard';
  }

  @route('GET', 'unauth2', [BearerGuard])
  throw401Error() {
    return 'some secret';
  }

  @route('GET', 'forbidden2', [requirePermissionsSngl(Permission.canActivateAdministration)])
  throw403Error() {
    return 'some secret';
  }
}
