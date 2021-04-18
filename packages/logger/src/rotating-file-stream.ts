import { EventEmitter } from 'events';
import { fail } from 'assert';
import { format } from 'util';
import * as assert from 'assert-plus';
import { WriteStream, statSync, createWriteStream, unlink, exists } from 'fs';
import * as mv from 'mv';

import { LogFields, RotatingFileStreamOptions } from './types';

export class RotatingFileStream extends EventEmitter {
  path: string;
  count: number;
  periodNum: number;
  periodScope: string;
  stream: WriteStream;
  rotQueue: any[];
  rotating: boolean;
  rotAt: any;
  timeout: NodeJS.Timer;
  constructor(options: RotatingFileStreamOptions) {
    super();
    this.path = options.path;

    this.count = options.count == null ? 10 : options.count;
    assert.equal(
      typeof this.count,
      'number',
      format('rotating-file stream "count" is not a number: %j (%s) in %j', this.count, typeof this.count, this)
    );
    assert.ok(this.count >= 0, format('rotating-file stream "count" is not >= 0: %j in %j', this.count, this));

    // Parse `options.period`.
    if (options.period) {
      // <number><scope> where scope is:
      //    h   hours (at the start of the hour)
      //    d   days (at the start of the day, i.e. just after midnight)
      //    w   weeks (at the start of Sunday)
      //    m   months (on the first of the month)
      //    y   years (at the start of Jan 1st)
      // with special values 'hourly' (1h), 'daily' (1d), "weekly" (1w),
      // 'monthly' (1m) and 'yearly' (1y)
      const period: string =
        ({
          hourly: '1h',
          daily: '1d',
          weekly: '1w',
          monthly: '1m',
          yearly: '1y'
        } as any)[options.period] || options.period;
      const m = /^([1-9][0-9]*)([hdwmy]|ms)$/.exec(period);
      if (!m) {
        throw new Error(format('invalid period: "%s"', options.period));
      }
      this.periodNum = Number(m[1]);
      this.periodScope = m[2];
    } else {
      this.periodNum = 1;
      this.periodScope = 'd';
    }

    let lastModified = null;
    try {
      const fileInfo = statSync(this.path);
      lastModified = fileInfo.mtime.getTime();
    } catch (err) {
      // file doesn't exist
    }
    let rotateAfterOpen = false;
    if (lastModified) {
      const lastRotTime = this._calcRotTime(0);
      if (lastModified < lastRotTime) {
        rotateAfterOpen = true;
      }
    }

    // TODO: template support for backup files
    // template: <path to which to rotate>
    //      default is %P.%n
    //      '/var/log/archive/foo.log'  -> foo.log.%n
    //      '/var/log/archive/foo.log.%n'
    //      codes:
    //          XXX support strftime codes (per node version of those)
    //              or whatever module. Pick non-colliding for extra
    //              codes
    //          %P      `path` base value
    //          %n      integer number of rotated log (1,2,3,...)
    //          %d      datetime in YYYY-MM-DD_HH-MM-SS
    //                      XXX what should default date format be?
    //                          prior art? Want to avoid ':' in
    //                          filenames (illegal on Windows for one).

    this.stream = createWriteStream(this.path, { flags: 'a', encoding: 'utf8' });

    this.rotQueue = [];
    this.rotating = false;
    if (rotateAfterOpen) {
      this._debug('rotateAfterOpen -> call rotate()');
      this.rotate();
    } else {
      this._setupNextRot();
    }
  }

  _debug(...args: any[]) {
    // Set this to `true` to add debug logging.
    if (false) {
      if (args.length === 0) {
        return true;
      }

      args[0] = '[' + new Date().toISOString() + ', ' + this.path + '] ' + args[0];
      console.log.apply(this, args);
    } else {
      return false;
    }
  }

  _setupNextRot() {
    this.rotAt = this._calcRotTime(1);
    this._setRotationTimer();
  }

  _setRotationTimer() {
    const self = this;
    let delay = this.rotAt - Date.now();
    // Cap timeout to Node's max setTimeout, see
    // <https://github.com/joyent/node/issues/8656>.
    const TIMEOUT_MAX = 2147483647; // 2^31-1
    if (delay > TIMEOUT_MAX) {
      delay = TIMEOUT_MAX;
    }
    this.timeout = setTimeout(() => {
      self._debug('_setRotationTimer timeout -> call rotate()');
      self.rotate();
    }, delay);
    if (typeof this.timeout.unref === 'function') {
      this.timeout.unref();
    }
  }

  _calcRotTime(periodOffset: number) {
    this._debug('_calcRotTime: %s%s', this.periodNum, this.periodScope);
    const d = new Date();

    this._debug('  now local: %s', d);
    this._debug('    now utc: %s', d.toISOString());
    let rotAt;
    switch (this.periodScope) {
      case 'ms':
        // Hidden millisecond period for debugging.
        if (this.rotAt) {
          rotAt = this.rotAt + this.periodNum * periodOffset;
        } else {
          rotAt = Date.now() + this.periodNum * periodOffset;
        }
        break;
      case 'h':
        if (this.rotAt) {
          rotAt = this.rotAt + this.periodNum * 60 * 60 * 1000 * periodOffset;
        } else {
          // First time: top of the next hour.
          rotAt = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours() + periodOffset);
        }
        break;
      case 'd':
        if (this.rotAt) {
          rotAt = this.rotAt + this.periodNum * 24 * 60 * 60 * 1000 * periodOffset;
        } else {
          // First time: start of tomorrow (i.e. at the coming midnight) UTC.
          rotAt = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + periodOffset);
        }
        break;
      case 'w':
        // Currently, always on Sunday morning at 00:00:00 (UTC).
        if (this.rotAt) {
          rotAt = this.rotAt + this.periodNum * 7 * 24 * 60 * 60 * 1000 * periodOffset;
        } else {
          // First time: this coming Sunday.
          let dayOffset = 7 - d.getUTCDay();
          if (periodOffset < 1) {
            dayOffset = -d.getUTCDay();
          }
          if (periodOffset > 1 || periodOffset < -1) {
            dayOffset += 7 * periodOffset;
          }
          rotAt = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + dayOffset);
        }
        break;
      case 'm':
        if (this.rotAt) {
          rotAt = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + this.periodNum * periodOffset, 1);
        } else {
          // First time: the start of the next month.
          rotAt = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + periodOffset, 1);
        }
        break;
      case 'y':
        if (this.rotAt) {
          rotAt = Date.UTC(d.getUTCFullYear() + this.periodNum * periodOffset, 0, 1);
        } else {
          // First time: the start of the next year.
          rotAt = Date.UTC(d.getUTCFullYear() + periodOffset, 0, 1);
        }
        break;
      default:
        fail(format('invalid period scope: "%s"', this.periodScope));
    }

    if (this._debug()) {
      this._debug('  **rotAt**: %s (utc: %s)', rotAt, new Date(rotAt).toUTCString());
      const now = Date.now();
      this._debug(
        '        now: %s (%sms == %smin == %sh to go)',
        now,
        rotAt - now,
        (rotAt - now) / 1000 / 60,
        (rotAt - now) / 1000 / 60 / 60
      );
    }
    return rotAt;
  }

  rotate() {
    // XXX What about shutdown?
    const self = this;

    // If rotation period is > ~25 days, we have to break into multiple
    // setTimeout's. See <https://github.com/joyent/node/issues/8656>.
    if (self.rotAt && self.rotAt > Date.now()) {
      return self._setRotationTimer();
    }

    this._debug('rotate');
    if (self.rotating) {
      throw new TypeError('cannot start a rotation when already rotating');
    }
    self.rotating = true;

    self.stream.end(); // XXX can do moves sync after this? test at high rate

    let n = this.count;
    del();

    function del() {
      let toDel = self.path + '.' + String(n - 1);
      if (n === 0) {
        toDel = self.path;
      }
      n -= 1;
      self._debug('  rm %s', toDel);
      unlink(toDel, delErr => {
        // XXX handle err other than not exists
        moves();
      });
    }

    function moves() {
      if (self.count === 0 || n < 0) {
        return finish();
      }
      let before = self.path;
      const after = self.path + '.' + String(n);
      if (n > 0) {
        before += '.' + String(n - 1);
      }
      n -= 1;
      exists(before, fileExists => {
        if (!fileExists) {
          moves();
        } else {
          self._debug('  mv %s %s', before, after);
          mv(before, after, (mvErr: Error) => {
            if (mvErr) {
              self.emit('error', mvErr);
              finish(); // XXX finish here?
            } else {
              moves();
            }
          });
        }
      });
    }

    function finish() {
      self._debug('  open %s', self.path);
      self.stream = createWriteStream(self.path, { flags: 'a', encoding: 'utf8' });
      const q = self.rotQueue;
      const len = q.length;
      for (let i = 0; i < len; i++) {
        self.stream.write(q[i]);
      }
      self.rotQueue = [];
      self.rotating = false;
      self.emit('drain');
      self._setupNextRot();
    }
  }

  write(s: LogFields) {
    if (this.rotating) {
      this.rotQueue.push(s);
      return false;
    } else {
      return this.stream.write(s);
    }
  }

  end() {
    this.stream.end();
  }

  destroy() {
    this.stream.destroy();
  }
}
