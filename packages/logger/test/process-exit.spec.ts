/*
 * Test that bunyan process will terminate.
 *
 * Note: Currently (bunyan 0.23.1) this fails on node 0.8, because there is
 * no `unref` in node 0.8 and bunyan doesn't yet have `Logger.prototype.close()`
 * support.
 */

import { exec } from 'child_process';
import { getPathFile } from './util';

describe(getPathFile(__filename), () => {
  it('log with file stream will terminate', (done) => {
    exec('node ' + __dirname + '/process-exit.js', { timeout: 1000 }, function (err, stdout, stderr) {
      if (err) {
        done.fail(err);
      }
      expect(stdout).toEqual('done\n');
      expect(stderr).toEqual('');
      done();
    });
  });
});
