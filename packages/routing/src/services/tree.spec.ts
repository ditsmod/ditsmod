import { describe, expect, it } from 'vitest';

import { Tree } from './tree.js';
import { RouteParam } from '../types/types.js';

class TestTree extends Tree {
  printTree(prefix = '') {
    console.log(
      ' %d %s%s[%d] %s %s %d \r\n',
      this.priority,
      prefix,
      this.path,
      this.children.length,
      this.handle,
      this.wildChild,
      this.type
    );
    for (let l = this.path.length; l > 0; l--) {
      prefix += ' ';
    }
    this.children.forEach((child) => {
      child.printTree(prefix);
    });
  }
}

interface PathAndParams {
  path: string;
  params: RouteParam[];
}

const noop = () => {};

describe('Tree', () => {
  describe('addRoute() and search()', () => {
    const tree = new TestTree({} as any);
    const paths = [
      '/hi',
      '/contact',
      '/co',
      '/c',
      '/a',
      '/ab',
      '/doc/',
      '/doc/node_faq.html',
      '/doc/node1.html',
      '/α',
      '/β',
    ];

    paths.forEach((route) => {
      tree.addRoute(route, noop);
    });

    // tree.printTree();

    const testData: { path: string; found: boolean }[] = [
      { path: '/a', found: true },
      { path: '/', found: false },
      { path: '/hi', found: true },
      { path: '/contact', found: true },
      { path: '/co', found: true },
      { path: '/con', found: false },
      { path: '/cona', found: false },
      { path: '/no', found: false },
      { path: '/ab', found: true },
      { path: '/α', found: true },
      { path: '/β', found: true },
    ];

    testData.forEach((test) => {
      it(test.path, () => {
        const { handle } = tree.search(test.path);
        if (test.found) {
          expect(handle).toBeTruthy();
        } else {
          expect(handle).toBe(null);
        }
      });
    });
  });

  describe('search() with wildcard', () => {
    const tree = new Tree({} as any);
    const paths = [
      '/',
      '/cmd/:tool/:sub',
      '/cmd/:tool/',
      '/src/*filepath',
      '/search/',
      '/search/:query',
      '/user_:name',
      '/user_:name/about',
      '/files/:dir/*filepath',
      '/doc/',
      '/doc/node_faq.html',
      '/doc/node1.html',
      '/info/:user/public',
      '/info/:user/project/:project',
    ];

    paths.forEach((path) => {
      tree.addRoute(path, noop);
    });

    // tree.printTree();

    const testData: PathAndParams[] = [
      {
        path: '/',
        params: [],
      },
      {
        path: '/cmd/test/',
        params: [{ key: 'tool', value: 'test' }],
      },
      {
        path: '/cmd/test/3',
        params: [
          { key: 'tool', value: 'test' },
          { key: 'sub', value: '3' },
        ],
      },
      {
        path: '/src/',
        params: [{ key: 'filepath', value: '/' }],
      },
      {
        path: '/src/some/file.png',
        params: [{ key: 'filepath', value: '/some/file.png' }],
      },
      {
        path: '/search/',
        params: [],
      },
      {
        path: '/search/中文',
        params: [{ key: 'query', value: '中文' }],
      },
      {
        path: '/user_noder',
        params: [{ key: 'name', value: 'noder' }],
      },
      {
        path: '/user_noder/about',
        params: [{ key: 'name', value: 'noder' }],
      },
      {
        path: '/files/js/inc/framework.js',
        params: [
          { key: 'dir', value: 'js' },
          { key: 'filepath', value: '/inc/framework.js' },
        ],
      },
      {
        path: '/info/gordon/public',
        params: [{ key: 'user', value: 'gordon' }],
      },
      {
        path: '/info/gordon/project/node',
        params: [
          { key: 'user', value: 'gordon' },
          { key: 'project', value: 'node' },
        ],
      },
    ];

    testData.forEach((test) => {
      it(test.path, () => {
        const { handle, params } = tree.search(test.path);
        expect(handle).toBeTruthy();
        expect(params).toEqual(test.params);
      });
    });

    const testHandler: PathAndParams[] = [
      {
        path: '/cmd/test',
        params: [{ key: 'tool', value: 'test' }],
      },
      {
        path: '/search/中文/',
        params: [{ key: 'query', value: '中文' }],
      },
    ];

    testHandler.forEach((test) => {
      it(test.path, () => {
        const { handle, params } = tree.search(test.path);
        expect(handle).toBeNull();
        expect(params).toEqual(test.params);
      });
    });
  });

  it('Invalid node type', () => {
    const tree = new Tree({} as any);
    tree.addRoute('/', noop);
    tree.addRoute('/:page', noop);

    tree.children[0].type = 42 as any;

    expect(() => tree.search('/test')).toThrow();
  });

  it('conflict', () => {
    const tree = new Tree({} as any);
    tree.addRoute('/src3/*filepath', noop);

    expect(() => tree.addRoute('/src3/*filepath/x', noop)).toThrow();
  });
});
