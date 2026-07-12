import type { Integration } from '@sentry/core';
import { applySdkMetadata } from '@sentry/core';
import type { NodeClient, NodeOptions } from '@sentry/node';
import { getDefaultIntegrations as getDefaultNodeIntegrations, init as nodeInit } from '@sentry/node';

/**
 * Initializes the Ditsmod Sentry SDK
 */
export function init(options: NodeOptions | undefined = {}): NodeClient | undefined {
  const opts: NodeOptions = {
    defaultIntegrations: getDefaultIntegrations(options),
    ...options,
  };

  applySdkMetadata(opts, 'ditsmod', ['ditsmod', 'node']);

  return nodeInit(opts);
}

/** Get the default integrations for the Ditsmod Sentry SDK. */
export function getDefaultIntegrations(options: NodeOptions): Integration[] | undefined {
  return getDefaultNodeIntegrations(options);
}
