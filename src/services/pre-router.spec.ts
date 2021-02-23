import { PreRouter } from '../services/pre-router';

describe('PreRouting', () => {
  let mock: MockPreRouting;

  class MockPreRouting extends PreRouter {
    getPath(prefix: string, path: string) {
      return super.getPath(prefix, path);
    }
  }

  beforeEach(() => {
    mock = new MockPreRouting(null, null, null, null);
  });

  describe('getPath', () => {
    it('case 1', () => {
      const path1 = mock.getPath('/api/posts/:postId', ':postId');
      const path2 = mock.getPath('/api/posts', ':postId');
      expect(path1).toBe('/api/posts/:postId');
      expect(path2).toBe('/api/posts/:postId');
    });
  });
});
