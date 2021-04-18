import { EventEmitter } from 'events';
import { LogFields } from './types';

/**
 * RingBuffer is a Writable Stream that just stores the last N records in memory.
 */
export class RingBuffer extends EventEmitter {
  limit = 100;
  writable = true;
  records: LogFields[] = [];

  /**
   * @param options Object of options with the following fields:
   * - limit: number of records to keep in memory.
   */
  constructor(options?: { limit: number }) {
    super();
    if (options && options.limit) {
      this.limit = options.limit;
    }
  }

  write(record: LogFields) {
    if (!this.writable) {
      throw new Error('RingBuffer has been ended already');
    }

    this.records.push(record);

    if (this.records.length > this.limit) {
      this.records.shift();
    }

    return true;
  }

  end(...args: any[]) {
    if (args.length) {
      this.write.apply(this, args.slice());
    }
    this.writable = false;
  }

  destroy() {
    this.writable = false;
    this.emit('close');
  }
}
