import { controller, route } from '@ditsmod/rest';
import { Permission, basicAuth, requirePermissions, RequestScopedBearerGuard, requirePermissionsSngl } from '#auth';

/**
 * Request-scoped controller
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

  @route('GET', 'unauth', [RequestScopedBearerGuard])
  throw401Error() {
    return 'some secret';
  }

  @route('GET', 'forbidden', [requirePermissions(Permission.canActivateAdministration)])
  throw403Error() {
    return 'some secret';
  }
}

/**
 * Route-scoped controller
 */
@controller({ scope: 'route' })
export class RouteScopedController {
  @route('GET', 'controler2-of-module1')
  ok() {
    return 'ok';
  }

  @route('GET', 'basic-auth2', [basicAuth('Access to the API endpoint')])
  basicAuth() {
    return 'You are now authorized with BasicGuard';
  }

  @route('GET', 'unauth2', [RequestScopedBearerGuard])
  throw401Error() {
    return 'some secret';
  }

  @route('GET', 'forbidden2', [requirePermissionsSngl(Permission.canActivateAdministration)])
  throw403Error() {
    return 'some secret';
  }
}
