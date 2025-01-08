import { AsyncLocalStorage } from 'node:async_hooks';
import { Channel, channel, subscribe, unsubscribe, hasSubscribers, tracingChannel } from 'node:diagnostics_channel';
export { TracingChannelCollection, TracingChannelSubscribers } from 'node:diagnostics_channel';

interface ChannelMap {
  'ditsmod.route': { moduleName: string; httpMethod: string; fullPath: string; countOfGuards: number };
}

interface TracingChannelMap {
  // 'ditsmod.request.handler': { tmp: any };
}

type Channels = keyof ChannelMap;
type TracingChannels = keyof TracingChannelMap;

export interface TypedChannel<T extends Channels> extends Channel {
  publish(message: ChannelMap[T]): void;
  name: T;
  bindStore<StoreType = unknown, ContextType = StoreType>(
    store: AsyncLocalStorage<StoreType>,
    transform?: (context: ContextType) => StoreType,
  ): void;
}

export interface TypedChannel2<T extends TracingChannels> extends Channel {
  publish(message: TracingChannelMap[T]): void;
  name: T;
  bindStore<StoreType = unknown, ContextType = StoreType>(
    store: AsyncLocalStorage<StoreType>,
    transform?: (context: ContextType) => StoreType,
  ): void;
}

export type TypedChannelListener<T extends Channels> = (message: ChannelMap[T], name: T) => void;

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
export function routeChannel<T extends Channels>(name: T): TypedChannel<T> {
  return channel(name) as any;
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
export function routeSubscribe<T extends Channels>(name: T, onMessage: TypedChannelListener<T>): void {
  return subscribe(name, onMessage as any);
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
export function routeUnsubscribe<T extends Channels>(name: T, onMessage: TypedChannelListener<T>): boolean {
  return unsubscribe(name, onMessage as any);
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
export function routeHasSubscribers(name: Channels): boolean {
  return hasSubscribers(name);
}

/**
 * Creates a `TracingChannel` wrapper for the given `TracingChannel Channels`. If a name is given, the corresponding tracing
 * channels will be created in the form of `tracing:${name}:${eventType}` where `eventType` corresponds to the types of `TracingChannel Channels`.
 *
 * ```js
 * import diagnostics_channel from 'node:diagnostics_channel';
 *
 * const channelsByName = diagnostics_channel.tracingChannel('my-channel');
 *
 * // or...
 *
 * const channelsByCollection = diagnostics_channel.tracingChannel({
 *   start: diagnostics_channel.channel('tracing:my-channel:start'),
 *   end: diagnostics_channel.channel('tracing:my-channel:end'),
 *   asyncStart: diagnostics_channel.channel('tracing:my-channel:asyncStart'),
 *   asyncEnd: diagnostics_channel.channel('tracing:my-channel:asyncEnd'),
 *   error: diagnostics_channel.channel('tracing:my-channel:error'),
 * });
 * ```
 * @since v19.9.0
 * @experimental
 * @param nameOrChannels Channel name or object containing all the `TracingChannel Channels`
 * @return Collection of channels to trace with
 */
export function routeTracingChannel<T extends TracingChannels>(
  nameOrChannels: T | TracingChannelCollection<T>,
): TypedTracingChannel<T> {
  return tracingChannel(nameOrChannels as any) as any;
}

interface TracingChannelCollection<T extends TracingChannels> {
  start: TypedChannel2<T>;
  end: TypedChannel2<T>;
  asyncStart: TypedChannel2<T>;
  asyncEnd: TypedChannel2<T>;
  error: TypedChannel2<T>;
}

interface TracingChannelSubscribers<T extends TracingChannels> {
  start: (message: TracingChannelMap[T]) => void;
  end: (
    message: TracingChannelMap[T] & {
      error?: unknown;
      result?: unknown;
    },
  ) => void;
  asyncStart: (
    message: TracingChannelMap[T] & {
      error?: unknown;
      result?: unknown;
    },
  ) => void;
  asyncEnd: (
    message: TracingChannelMap[T] & {
      error?: unknown;
      result?: unknown;
    },
  ) => void;
  error: (
    message: TracingChannelMap[T] & {
      error: unknown;
    },
  ) => void;
}

/**
 * The class `TracingChannel` is a collection of `TracingChannel Channels` which
 * together express a single traceable action. It is used to formalize and
 * simplify the process of producing events for tracing application flow. `tracingChannel` is used to construct a `TracingChannel`. As with `Channel` it is recommended to create and reuse a
 * single `TracingChannel` at the top-level of the file rather than creating them
 * dynamically.
 * @since v19.9.0
 * @experimental
 */
interface TypedTracingChannel<T extends TracingChannels>
  extends TracingChannelCollection<T> {
  start: TypedChannel2<T>;
  end: TypedChannel2<T>;
  asyncStart: TypedChannel2<T>;
  asyncEnd: TypedChannel2<T>;
  error: TypedChannel2<T>;
  /**
   * Helper to subscribe a collection of functions to the corresponding channels.
   * This is the same as calling `channel.subscribe(onMessage)` on each channel
   * individually.
   *
   * ```js
   * import diagnostics_channel from 'node:diagnostics_channel';
   *
   * const channels = diagnostics_channel.tracingChannel('my-channel');
   *
   * channels.subscribe({
   *   start(message) {
   *     // Handle start message
   *   },
   *   end(message) {
   *     // Handle end message
   *   },
   *   asyncStart(message) {
   *     // Handle asyncStart message
   *   },
   *   asyncEnd(message) {
   *     // Handle asyncEnd message
   *   },
   *   error(message) {
   *     // Handle error message
   *   },
   * });
   * ```
   * @since v19.9.0
   * @experimental
   * @param subscribers Set of `TracingChannel Channels` subscribers
   */
  subscribe(subscribers: TracingChannelSubscribers<T>): void;
  /**
   * Helper to unsubscribe a collection of functions from the corresponding channels.
   * This is the same as calling `channel.unsubscribe(onMessage)` on each channel
   * individually.
   *
   * ```js
   * import diagnostics_channel from 'node:diagnostics_channel';
   *
   * const channels = diagnostics_channel.tracingChannel('my-channel');
   *
   * channels.unsubscribe({
   *   start(message) {
   *     // Handle start message
   *   },
   *   end(message) {
   *     // Handle end message
   *   },
   *   asyncStart(message) {
   *     // Handle asyncStart message
   *   },
   *   asyncEnd(message) {
   *     // Handle asyncEnd message
   *   },
   *   error(message) {
   *     // Handle error message
   *   },
   * });
   * ```
   * @since v19.9.0
   * @experimental
   * @param subscribers Set of `TracingChannel Channels` subscribers
   * @return `true` if all handlers were successfully unsubscribed, and `false` otherwise.
   */
  unsubscribe(subscribers: TracingChannelSubscribers<T>): void;
  /**
   * Trace a synchronous function call. This will always produce a `start event` and `end event` around the execution and may produce an `error event` if the given function throws an error.
   * This will run the given function using `channel.runStores(context, ...)` on the `start` channel which ensures all
   * events should have any bound stores set to match this trace context.
   *
   * To ensure only correct trace graphs are formed, events will only be published if subscribers are present prior to starting the trace. Subscriptions
   * which are added after the trace begins will not receive future events from that trace, only future traces will be seen.
   *
   * ```js
   * import diagnostics_channel from 'node:diagnostics_channel';
   *
   * const channels = diagnostics_channel.tracingChannel('my-channel');
   *
   * channels.traceSync(() => {
   *   // Do something
   * }, {
   *   some: 'thing',
   * });
   * ```
   * @since v19.9.0
   * @experimental
   * @param fn Function to wrap a trace around
   * @param context Shared object to correlate events through
   * @param thisArg The receiver to be used for the function call
   * @param args Optional arguments to pass to the function
   * @return The return value of the given function
   */
  traceSync<ThisArg = any, Args extends any[] = any[]>(
    fn: (this: ThisArg, ...args: Args) => any,
    context?: TracingChannelMap[T],
    thisArg?: ThisArg,
    ...args: Args
  ): void;
  /**
   * Trace a promise-returning function call. This will always produce a `start event` and `end event` around the synchronous portion of the
   * function execution, and will produce an `asyncStart event` and `asyncEnd event` when a promise continuation is reached. It may also
   * produce an `error event` if the given function throws an error or the
   * returned promise rejects. This will run the given function using `channel.runStores(context, ...)` on the `start` channel which ensures all
   * events should have any bound stores set to match this trace context.
   *
   * To ensure only correct trace graphs are formed, events will only be published if subscribers are present prior to starting the trace. Subscriptions
   * which are added after the trace begins will not receive future events from that trace, only future traces will be seen.
   *
   * ```js
   * import diagnostics_channel from 'node:diagnostics_channel';
   *
   * const channels = diagnostics_channel.tracingChannel('my-channel');
   *
   * channels.tracePromise(async () => {
   *   // Do something
   * }, {
   *   some: 'thing',
   * });
   * ```
   * @since v19.9.0
   * @experimental
   * @param fn Promise-returning function to wrap a trace around
   * @param context Shared object to correlate trace events through
   * @param thisArg The receiver to be used for the function call
   * @param args Optional arguments to pass to the function
   * @return Chained from promise returned by the given function
   */
  tracePromise<ThisArg = any, Args extends any[] = any[]>(
    fn: (this: ThisArg, ...args: Args) => Promise<any>,
    context?: TracingChannelMap[T],
    thisArg?: ThisArg,
    ...args: Args
  ): void;
  /**
   * Trace a callback-receiving function call. This will always produce a `start event` and `end event` around the synchronous portion of the
   * function execution, and will produce a `asyncStart event` and `asyncEnd event` around the callback execution. It may also produce an `error event` if the given function throws an error or
   * the returned
   * promise rejects. This will run the given function using `channel.runStores(context, ...)` on the `start` channel which ensures all
   * events should have any bound stores set to match this trace context.
   *
   * The `position` will be -1 by default to indicate the final argument should
   * be used as the callback.
   *
   * ```js
   * import diagnostics_channel from 'node:diagnostics_channel';
   *
   * const channels = diagnostics_channel.tracingChannel('my-channel');
   *
   * channels.traceCallback((arg1, callback) => {
   *   // Do something
   *   callback(null, 'result');
   * }, 1, {
   *   some: 'thing',
   * }, thisArg, arg1, callback);
   * ```
   *
   * The callback will also be run with `channel.runStores(context, ...)` which
   * enables context loss recovery in some cases.
   *
   * To ensure only correct trace graphs are formed, events will only be published if subscribers are present prior to starting the trace. Subscriptions
   * which are added after the trace begins will not receive future events from that trace, only future traces will be seen.
   *
   * ```js
   * import diagnostics_channel from 'node:diagnostics_channel';
   * import { AsyncLocalStorage } from 'node:async_hooks';
   *
   * const channels = diagnostics_channel.tracingChannel('my-channel');
   * const myStore = new AsyncLocalStorage();
   *
   * // The start channel sets the initial store data to something
   * // and stores that store data value on the trace context object
   * channels.start.bindStore(myStore, (data) => {
   *   const span = new Span(data);
   *   data.span = span;
   *   return span;
   * });
   *
   * // Then asyncStart can restore from that data it stored previously
   * channels.asyncStart.bindStore(myStore, (data) => {
   *   return data.span;
   * });
   * ```
   * @since v19.9.0
   * @experimental
   * @param fn callback using function to wrap a trace around
   * @param position Zero-indexed argument position of expected callback
   * @param context Shared object to correlate trace events through
   * @param thisArg The receiver to be used for the function call
   * @param args Optional arguments to pass to the function
   * @return The return value of the given function
   */
  traceCallback<Fn extends (this: any, ...args: any[]) => any>(
    fn: Fn,
    position?: number,
    context?: TracingChannelMap[T],
    thisArg?: any,
    ...args: Parameters<Fn>
  ): void;
}
