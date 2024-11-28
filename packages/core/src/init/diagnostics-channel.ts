import {
  Channel,
  channel as originChannel,
  subscribe as originSubscribe,
  unsubscribe as originUnsubscribe,
  hasSubscribers as originHasSubscribers,
} from 'node:diagnostics_channel';

export { TracingChannelCollection, TracingChannelSubscribers, tracingChannel } from 'node:diagnostics_channel';

interface ChannelMap {
  'ditsmod.route': { moduleName: string; httpMethod: string; path: string; countOfGuards: number };
}

type Channels = keyof ChannelMap;

interface TypedChannel<T extends Channels> extends Channel {
  publish(message: ChannelMap[T]): void;
}

type TypedChannelListener<T extends Channels> = (message: ChannelMap[T], name: T) => void;

/**
 * This is the primary entry-point for anyone wanting to publish to a named
 * channel. It produces a channel object which is optimized to reduce overhead at
 * publish time as much as possible.
 *
 * ```js
 * import diagnostics_channel from 'node:diagnostics_channel';
 *
 * const channel = diagnostics_channel.channel('my-channel');
 * ```
 * @since v15.1.0, v14.17.0
 * @param name The channel name
 * @return The named channel object
 */
export function channel<T extends Channels>(name: T): TypedChannel<T> {
  return originChannel(name);
}

/**
 * Register a message handler to subscribe to this channel. This message handler
 * will be run synchronously whenever a message is published to the channel. Any
 * errors thrown in the message handler will trigger an `'uncaughtException'`.
 *
 * ```js
 * import diagnostics_channel from 'node:diagnostics_channel';
 *
 * diagnostics_channel.subscribe('my-channel', (message, name) => {
 *   // Received data
 * });
 * ```
 * @since v18.7.0, v16.17.0
 * @param name The channel name
 * @param onMessage The handler to receive channel messages
 */
export function subscribe<T extends Channels>(name: T, onMessage: TypedChannelListener<T>): void {
  return originSubscribe(name, onMessage as any);
}

/**
 * Remove a message handler previously registered to this channel with `diagnostics_channel.subscribe`.
 *
 * ```js
 * import diagnostics_channel from 'node:diagnostics_channel';
 *
 * function onMessage(message, name) {
 *   // Received data
 * }
 *
 * diagnostics_channel.subscribe('my-channel', onMessage);
 *
 * diagnostics_channel.unsubscribe('my-channel', onMessage);
 * ```
 * @since v18.7.0, v16.17.0
 * @param name The channel name
 * @param onMessage The previous subscribed handler to remove
 * @return `true` if the handler was found, `false` otherwise.
 */
export function unsubscribe<T extends Channels>(name: T, onMessage: TypedChannelListener<T>): boolean {
  return originUnsubscribe(name, onMessage as any);
}

/**
 * Check if there are active subscribers to the named channel. This is helpful if
 * the message you want to send might be expensive to prepare.
 *
 * This API is optional but helpful when trying to publish messages from very
 * performance-sensitive code.
 *
 * ```js
 * import diagnostics_channel from 'node:diagnostics_channel';
 *
 * if (diagnostics_channel.hasSubscribers('my-channel')) {
 *   // There are subscribers, prepare and publish message
 * }
 * ```
 * @since v15.1.0, v14.17.0
 * @param name The channel name
 * @return If there are active subscribers
 */
export function hasSubscribers(name: Channels): boolean {
  return originHasSubscribers(name);
}
